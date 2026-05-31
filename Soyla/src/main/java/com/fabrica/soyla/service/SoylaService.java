package com.fabrica.soyla.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.fabrica.soyla.model.AppUser;
import com.fabrica.soyla.model.GroupMembership;
import com.fabrica.soyla.model.HouseholdGroup;
import com.fabrica.soyla.model.HouseholdTask;
import com.fabrica.soyla.model.InviteLink;
import com.fabrica.soyla.model.UserNotification;
import com.fabrica.soyla.model.WeeklyRanking;
import com.fabrica.soyla.repository.AppUserRepository;
import com.fabrica.soyla.repository.GroupMembershipRepository;
import com.fabrica.soyla.repository.HouseholdGroupRepository;
import com.fabrica.soyla.repository.HouseholdTaskRepository;
import com.fabrica.soyla.repository.InviteLinkRepository;
import com.fabrica.soyla.repository.UserNotificationRepository;
import com.fabrica.soyla.repository.WeeklyRankingRepository;
import com.fabrica.soyla.config.JwtService;
import com.fabrica.soyla.web.ApiException;
import com.fabrica.soyla.web.ApiModels.AssignTaskRequest;
import com.fabrica.soyla.web.ApiModels.AuthRequest;
import com.fabrica.soyla.web.ApiModels.AuthResponse;
import com.fabrica.soyla.web.ApiModels.ConfirmEmailResponse;
import com.fabrica.soyla.web.ApiModels.CreateGroupRequest;
import com.fabrica.soyla.web.ApiModels.CreateRankingRequest;
import com.fabrica.soyla.web.ApiModels.CreateTaskRequest;
import com.fabrica.soyla.web.ApiModels.GroupActionRequest;
import com.fabrica.soyla.web.ApiModels.GroupMemberResponse;
import com.fabrica.soyla.web.ApiModels.GroupResponse;
import com.fabrica.soyla.web.ApiModels.InviteJoinRequest;
import com.fabrica.soyla.web.ApiModels.InviteResponse;
import com.fabrica.soyla.web.ApiModels.JoinInviteResponse;
import com.fabrica.soyla.web.ApiModels.NotificationResponse;
import com.fabrica.soyla.web.ApiModels.RankingMemberResponse;
import com.fabrica.soyla.web.ApiModels.RankingTaskHistory;
import com.fabrica.soyla.web.ApiModels.RegisterRequest;
import com.fabrica.soyla.web.ApiModels.ResendConfirmationRequest;
import com.fabrica.soyla.web.ApiModels.TaskResponse;
import com.fabrica.soyla.web.ApiModels.UpdateMemberRoleRequest;
import com.fabrica.soyla.web.ApiModels.UpdateProfileRequest;
import com.fabrica.soyla.web.ApiModels.UpdateTaskStatusRequest;
import com.fabrica.soyla.web.ApiModels.UserProfileResponse;
import com.fabrica.soyla.web.ApiModels.WeeklyRankingResponse;

@Service
@Transactional
public class SoylaService {

    private static final long INVITE_TTL_MILLIS = 72L * 60L * 60L * 1000L;
    private static final long EMAIL_CONFIRMATION_TTL_MILLIS = 24L * 60L * 60L * 1000L;
    private static final List<String> ALLOWED_ROLES = List.of("Administrador", "Coadministrador", "Colaborador");
    private static final List<String> ALLOWED_FREQUENCIES = List.of("ninguna", "diaria", "semanal", "mensual");
    private static final List<String> ALLOWED_STATUSES = List.of("pending", "in_progress", "completed");

    private final AppUserRepository userRepository;
    private final HouseholdGroupRepository groupRepository;
    private final GroupMembershipRepository membershipRepository;
    private final InviteLinkRepository inviteRepository;
    private final HouseholdTaskRepository taskRepository;
    private final WeeklyRankingRepository rankingRepository;
    private final UserNotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public SoylaService(
        AppUserRepository userRepository,
        HouseholdGroupRepository groupRepository,
        GroupMembershipRepository membershipRepository,
        InviteLinkRepository inviteRepository,
        HouseholdTaskRepository taskRepository,
        WeeklyRankingRepository rankingRepository,
        UserNotificationRepository notificationRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.membershipRepository = membershipRepository;
        this.inviteRepository = inviteRepository;
        this.taskRepository = taskRepository;
        this.rankingRepository = rankingRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "Este correo electr\u00f3nico ya est\u00e1 registrado.");
        }

        AppUser user = new AppUser();
        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setActive(false);
        refreshConfirmationToken(user);
        userRepository.save(user);

        return toPendingAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        AppUser user = userRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas.");
        }
        if (!user.isActive() && user.getEmailConfirmationToken() == null) {
            user.setActive(true);
        }
        if (!user.isActive()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Debes confirmar tu correo electr\u00f3nico antes de iniciar sesi\u00f3n.");
        }

        return toAuthResponse(user);
    }

    public ConfirmEmailResponse confirmEmail(String token) {
        AppUser user = userRepository.findByEmailConfirmationToken(token)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "El enlace de confirmaci\u00f3n no es v\u00e1lido."));

        if (user.getEmailConfirmationExpiresAt() == null || user.getEmailConfirmationExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.GONE, "El enlace de confirmaci\u00f3n ha expirado.");
        }

        user.setActive(true);
        user.setEmailConfirmationToken(null);
        user.setEmailConfirmationExpiresAt(null);
        return new ConfirmEmailResponse(user.getEmail(), true);
    }

    public AuthResponse resendConfirmation(ResendConfirmationRequest request) {
        AppUser user = findUserByEmail(request.email());
        if (user.isActive()) {
            return toAuthResponse(user);
        }
        refreshConfirmationToken(user);
        return toPendingAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        return toUserProfile(findUserByEmail(email));
    }

    public UserProfileResponse updateProfile(String currentEmail, UpdateProfileRequest request) {
        AppUser user = findUserByEmail(currentEmail);
        String newEmail = normalizeEmail(request.email());

        userRepository.findByEmailIgnoreCase(newEmail)
            .filter(existing -> !existing.getId().equals(user.getId()))
            .ifPresent(existing -> {
                throw new ApiException(HttpStatus.CONFLICT, "Este correo ya est\u00e1 registrado por otro usuario.");
            });

        user.setEmail(newEmail);
        user.setPhone(normalizeOptional(request.phone()));

        return toUserProfile(user);
    }

    public GroupResponse createGroup(CreateGroupRequest request) {
        AppUser creator = findUserByEmail(request.createdByEmail());

        HouseholdGroup group = new HouseholdGroup();
        group.setName(request.name().trim());
        group.setCreatedBy(creator);
        groupRepository.save(group);

        GroupMembership membership = new GroupMembership();
        membership.setGroup(group);
        membership.setUser(creator);
        membership.setRole("Administrador");
        membershipRepository.save(membership);

        return toGroupResponse(group);
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> listGroupsForMember(String memberEmail) {
        return membershipRepository.findByUser_EmailIgnoreCaseOrderByJoinedAtDesc(normalizeEmail(memberEmail)).stream()
            .map(GroupMembership::getGroup)
            .distinct()
            .map(this::toGroupResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public GroupResponse getGroup(UUID groupId) {
        return toGroupResponse(findGroup(groupId));
    }

    @Transactional(readOnly = true)
    public List<GroupMemberResponse> listMembers(UUID groupId) {
        findGroup(groupId);
        return membershipRepository.findByGroup_IdOrderByJoinedAtAsc(groupId).stream()
            .map(this::toMemberResponse)
            .toList();
    }

    public GroupMemberResponse updateMemberRole(UUID groupId, String memberEmail, UpdateMemberRoleRequest request) {
        validateRole(request.role());

        GroupMembership requester = membershipRepository.findByGroup_IdAndUser_EmailIgnoreCase(groupId, normalizeEmail(request.requestedByEmail()))
            .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Solo un miembro del grupo puede modificar roles."));

        if (!"Administrador".equals(requester.getRole())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Solo los administradores pueden cambiar roles.");
        }

        GroupMembership target = membershipRepository.findByGroup_IdAndUser_EmailIgnoreCase(groupId, normalizeEmail(memberEmail))
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No se encontr\u00f3 el miembro solicitado."));

        target.setRole(request.role());
        return toMemberResponse(target);
    }

    @Transactional(readOnly = true)
    public InviteResponse getActiveInvite(UUID groupId) {
        findGroup(groupId);
        InviteLink invite = inviteRepository.findFirstByGroup_IdAndExpiresAtAfterOrderByCreatedAtDesc(groupId, Instant.now())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No hay una invitaci\u00f3n activa para este grupo."));

        return toInviteResponse(invite);
    }

    public InviteResponse createOrReuseInvite(UUID groupId) {
        HouseholdGroup group = findGroup(groupId);

        InviteLink existing = inviteRepository.findFirstByGroup_IdAndExpiresAtAfterOrderByCreatedAtDesc(groupId, Instant.now())
            .orElse(null);
        if (existing != null) {
            return toInviteResponse(existing);
        }

        InviteLink invite = new InviteLink();
        invite.setGroup(group);
        invite.setCode(generateInviteCode());
        invite.setExpiresAt(Instant.now().plusMillis(INVITE_TTL_MILLIS));
        inviteRepository.save(invite);

        return toInviteResponse(invite);
    }

    @Transactional(readOnly = true)
    public InviteResponse lookupInvite(String code) {
        InviteLink invite = findInvite(code);
        validateInviteActive(invite);
        return toInviteResponse(invite);
    }

    public JoinInviteResponse joinInvite(String code, InviteJoinRequest request) {
        InviteLink invite = findInvite(code);
        validateInviteActive(invite);

        AppUser user = findUserByEmail(request.userEmail());
        HouseholdGroup group = invite.getGroup();

        GroupMembership existingMembership = membershipRepository.findByGroup_IdAndUser_EmailIgnoreCase(group.getId(), user.getEmail())
            .orElse(null);
        if (existingMembership != null) {
            return new JoinInviteResponse(true, toGroupResponse(group));
        }

        GroupMembership membership = new GroupMembership();
        membership.setGroup(group);
        membership.setUser(user);
        membership.setRole("Colaborador");
        membershipRepository.save(membership);

        return new JoinInviteResponse(false, toGroupResponse(group));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> listTasks(UUID groupId) {
        findGroup(groupId);
        return taskRepository.findByGroup_IdOrderByCreatedAtDesc(groupId).stream()
            .map(this::toTaskResponse)
            .toList();
    }

    public TaskResponse createTask(UUID groupId, CreateTaskRequest request) {
        HouseholdGroup group = findGroup(groupId);
        validateTaskName(request.name());
        String frequency = normalizeFrequency(request.frequency());
        LocalDate deadline = request.deadline();

        if ("ninguna".equals(frequency) && deadline == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La fecha l\u00edmite es obligatoria si la tarea no tiene frecuencia.");
        }

        if (!"ninguna".equals(frequency) && deadline != null) {
            deadline = null;
        }

        HouseholdTask task = new HouseholdTask();
        task.setGroup(group);
        task.setName(request.name().trim());
        task.setDescription(normalizeOptional(request.description()));
        task.setDeadline(deadline);
        task.setFrequency(frequency);
        task.setPriority(normalizeOptional(request.priority()));
        task.setStatus("pending");
        taskRepository.save(task);

        return toTaskResponse(task);
    }

    public TaskResponse assignTask(UUID taskId, AssignTaskRequest request) {
        HouseholdTask task = findTask(taskId);
        AppUser assignee = findUserByEmail(request.assignedToEmail());

        boolean memberBelongsToGroup = membershipRepository.existsByGroup_IdAndUser_EmailIgnoreCase(
            task.getGroup().getId(),
            assignee.getEmail()
        );
        if (!memberBelongsToGroup) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El usuario seleccionado no pertenece a este grupo.");
        }

        task.setAssignedTo(assignee);
        createNotification(
            assignee,
            task.getGroup(),
            task,
            "assignment",
            "Nueva tarea asignada",
            "Se te asign\u00f3 \"" + task.getName() + "\".",
            "assignment:" + task.getId() + ":" + assignee.getEmail()
        );
        return toTaskResponse(task);
    }

    public void deleteTask(UUID taskId) {
        HouseholdTask task = findTask(taskId);
        taskRepository.delete(task);
    }

    public TaskResponse updateTaskStatus(UUID taskId, UpdateTaskStatusRequest request) {
        HouseholdTask task = findTask(taskId);
        String status = normalizeStatus(request.status());
        AppUser requester = findUserByEmail(request.requestedByEmail());

        if (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(requester.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Solo el responsable puede actualizar el estado de la tarea.");
        }

        task.setStatus(status);
        if ("completed".equals(status)) {
            if (task.getCompletedAt() == null) {
                task.setCompletedAt(Instant.now());
            }
            for (GroupMembership membership : membershipRepository.findByGroup_IdOrderByJoinedAtAsc(task.getGroup().getId())) {
                createNotification(
                    membership.getUser(),
                    task.getGroup(),
                    task,
                    "completion",
                    "Tarea completada",
                    requester.getFullName() + " complet\u00f3 \"" + task.getName() + "\".",
                    "completion:" + task.getId() + ":" + membership.getUser().getEmail()
                );
            }
        } else {
            task.setCompletedAt(null);
        }

        finalizeActiveRankingIfNeeded(task.getGroup().getId());
        return toTaskResponse(task);
    }

    public void leaveGroup(UUID groupId, String memberEmail) {
        GroupMembership membership = membershipRepository.findByGroup_IdAndUser_EmailIgnoreCase(groupId, normalizeEmail(memberEmail))
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No perteneces a este grupo."));

        if ("Administrador".equals(membership.getRole())) {
            long adminCount = membershipRepository.findByGroup_IdOrderByJoinedAtAsc(groupId).stream()
                .filter(candidate -> "Administrador".equals(candidate.getRole()))
                .count();
            if (adminCount <= 1) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Debes transferir la administraci\u00f3n antes de abandonar el grupo.");
            }
        }

        membershipRepository.delete(membership);
    }

    public void deleteGroup(UUID groupId, GroupActionRequest request) {
        HouseholdGroup group = findGroup(groupId);
        GroupMembership requester = membershipRepository.findByGroup_IdAndUser_EmailIgnoreCase(groupId, normalizeEmail(request.requestedByEmail()))
            .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Solo un miembro del grupo puede eliminarlo."));

        if (!"Administrador".equals(requester.getRole())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Solo los administradores pueden eliminar el grupo.");
        }

        notificationRepository.deleteByGroup_Id(groupId);
        rankingRepository.deleteByGroup_Id(groupId);
        inviteRepository.deleteByGroup_Id(groupId);
        taskRepository.deleteByGroup_Id(groupId);
        membershipRepository.deleteByGroup_Id(groupId);
        groupRepository.delete(group);
    }

    public WeeklyRankingResponse createWeeklyRanking(UUID groupId, CreateRankingRequest request) {
        HouseholdGroup group = findGroup(groupId);
        GroupMembership requester = membershipRepository.findByGroup_IdAndUser_EmailIgnoreCase(groupId, normalizeEmail(request.requestedByEmail()))
            .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Solo un miembro del grupo puede crear clasificaciones."));

        if (!"Administrador".equals(requester.getRole())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Solo los administradores pueden crear clasificaciones semanales.");
        }
        if (request.pointsPerTask() <= 0 || request.weeklyGoal() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Los puntos por tarea y la meta semanal deben ser mayores a cero.");
        }
        if (rankingRepository.findFirstByGroup_IdAndActiveTrueOrderByCreatedAtDesc(groupId).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya existe una clasificaci\u00f3n semanal activa en el grupo familiar.");
        }

        ZonedDateTime now = ZonedDateTime.now(ZoneId.systemDefault());
        ZonedDateTime startOfWeek = now.minusDays(now.getDayOfWeek().getValue() - 1L).toLocalDate().atStartOfDay(now.getZone());
        ZonedDateTime endOfWeek = startOfWeek.plusDays(7).minusNanos(1);

        WeeklyRanking ranking = new WeeklyRanking();
        ranking.setGroup(group);
        ranking.setPointsPerTask(request.pointsPerTask());
        ranking.setWeeklyGoal(request.weeklyGoal());
        ranking.setStartAt(startOfWeek.toInstant());
        ranking.setEndAt(endOfWeek.toInstant());
        rankingRepository.save(ranking);

        return toRankingResponse(ranking);
    }

    @Transactional(readOnly = true)
    public WeeklyRankingResponse getWeeklyRanking(UUID groupId) {
        WeeklyRanking ranking = rankingRepository.findFirstByGroup_IdAndActiveTrueOrderByCreatedAtDesc(groupId)
            .or(() -> rankingRepository.findFirstByGroup_IdOrderByCreatedAtDesc(groupId))
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No hay una clasificaci\u00f3n semanal para este grupo."));
        return toRankingResponse(ranking);
    }

    public List<NotificationResponse> listNotifications(String email) {
        AppUser user = findUserByEmail(email);
        generateDeadlineNotifications(user);
        return notificationRepository.findByRecipient_EmailIgnoreCaseOrderByCreatedAtDesc(user.getEmail()).stream()
            .map(this::toNotificationResponse)
            .toList();
    }

    public NotificationResponse markNotificationRead(UUID notificationId, String email) {
        UserNotification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No se encontr\u00f3 la notificaci\u00f3n solicitada."));
        if (!notification.getRecipient().getEmail().equalsIgnoreCase(normalizeEmail(email))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "No puedes modificar esta notificaci\u00f3n.");
        }
        notification.setRead(true);
        return toNotificationResponse(notification);
    }

    public void markAllNotificationsRead(String email) {
        String normalizedEmail = normalizeEmail(email);
        notificationRepository.findByRecipient_EmailIgnoreCaseOrderByCreatedAtDesc(normalizedEmail).forEach(notification -> notification.setRead(true));
    }

    private void createNotification(
        AppUser recipient,
        HouseholdGroup group,
        HouseholdTask task,
        String type,
        String title,
        String description,
        String dedupeKey
    ) {
        if (notificationRepository.findByRecipient_EmailIgnoreCaseAndDedupeKey(recipient.getEmail(), dedupeKey).isPresent()) {
            return;
        }

        UserNotification notification = new UserNotification();
        notification.setRecipient(recipient);
        notification.setGroup(group);
        notification.setTask(task);
        notification.setType(type);
        notification.setTitle(title);
        notification.setDescription(description);
        notification.setDedupeKey(dedupeKey);
        notificationRepository.save(notification);
    }

    private void generateDeadlineNotifications(AppUser user) {
        LocalDate today = LocalDate.now();
        for (GroupMembership membership : membershipRepository.findByUser_EmailIgnoreCaseOrderByJoinedAtDesc(user.getEmail())) {
            for (HouseholdTask task : taskRepository.findByGroup_IdOrderByCreatedAtDesc(membership.getGroup().getId())) {
                if (task.getDeadline() == null || "completed".equals(task.getStatus()) || task.getAssignedTo() == null) {
                    continue;
                }
                boolean isAssignee = task.getAssignedTo().getId().equals(user.getId());
                if (isAssignee && !task.getDeadline().isBefore(today) && !task.getDeadline().isAfter(today.plusDays(1))) {
                    createNotification(
                        user,
                        task.getGroup(),
                        task,
                        "due_soon",
                        "Tarea pr\u00f3xima a vencer",
                        "\"" + task.getName() + "\" vence el " + task.getDeadline() + ".",
                        "due-soon:" + task.getId() + ":" + user.getEmail()
                    );
                }
                if (task.getDeadline().isBefore(today)) {
                    for (GroupMembership groupMember : membershipRepository.findByGroup_IdOrderByJoinedAtAsc(task.getGroup().getId())) {
                        createNotification(
                            groupMember.getUser(),
                            task.getGroup(),
                            task,
                            "overdue",
                            "Tarea vencida",
                            "\"" + task.getName() + "\" venci\u00f3 el " + task.getDeadline() + ".",
                            "overdue:" + task.getId() + ":" + groupMember.getUser().getEmail()
                        );
                    }
                }
            }
        }
    }

    private void finalizeActiveRankingIfNeeded(UUID groupId) {
        rankingRepository.findFirstByGroup_IdAndActiveTrueOrderByCreatedAtDesc(groupId).ifPresent(ranking -> {
            WeeklyRankingResponse response = toRankingResponse(ranking);
            boolean goalReached = response.members().stream().anyMatch(member -> member.points() >= ranking.getWeeklyGoal());
            if (Instant.now().isAfter(ranking.getEndAt()) || goalReached) {
                ranking.setActive(false);
            }
        });
    }

    private AppUser findUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(normalizeEmail(email))
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No se encontr\u00f3 el usuario solicitado."));
    }

    private HouseholdGroup findGroup(UUID groupId) {
        return groupRepository.findById(groupId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No se encontr\u00f3 el grupo solicitado."));
    }

    private InviteLink findInvite(String code) {
        return inviteRepository.findByCode(code)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "El enlace de invitaci\u00f3n no es v\u00e1lido."));
    }

    private HouseholdTask findTask(UUID taskId) {
        return taskRepository.findById(taskId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No se encontr\u00f3 la tarea solicitada."));
    }

    private void validateInviteActive(InviteLink invite) {
        if (invite.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.GONE, "El enlace de invitaci\u00f3n ha expirado.");
        }
    }

    private void validateRole(String role) {
        if (!ALLOWED_ROLES.contains(role)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El rol solicitado no es v\u00e1lido.");
        }
    }

    private void validateTaskName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El nombre de la tarea es obligatorio.");
        }

        String trimmed = name.trim();
        if (trimmed.matches("^[^a-zA-Z0-9]+$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El nombre de la tarea no puede contener solo caracteres especiales.");
        }
        if (trimmed.matches("^[0-9]+$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El nombre de la tarea no puede contener solo n\u00fameros.");
        }
    }

    private String normalizeFrequency(String frequency) {
        String value = StringUtils.hasText(frequency) ? frequency.trim().toLowerCase(Locale.ROOT) : "ninguna";
        if (!ALLOWED_FREQUENCIES.contains(value)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La frecuencia solicitada no es v\u00e1lida.");
        }
        return value;
    }

    private String normalizeStatus(String status) {
        String value = StringUtils.hasText(status) ? status.trim().toLowerCase(Locale.ROOT) : "pending";
        if (!ALLOWED_STATUSES.contains(value)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El estado solicitado no es v\u00e1lido.");
        }
        return value;
    }

    private String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El correo electr\u00f3nico es obligatorio.");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeOptional(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String generateInviteCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        String code;
        do {
            StringBuilder builder = new StringBuilder();
            for (int index = 0; index < 12; index++) {
                int randomIndex = (int) Math.floor(Math.random() * chars.length());
                builder.append(chars.charAt(randomIndex));
            }
            code = builder.toString();
        } while (inviteRepository.existsByCode(code));
        return code;
    }

    private void refreshConfirmationToken(AppUser user) {
        user.setEmailConfirmationToken(UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", ""));
        user.setEmailConfirmationExpiresAt(Instant.now().plusMillis(EMAIL_CONFIRMATION_TTL_MILLIS));
    }

    private AuthResponse toAuthResponse(AppUser user) {
        return new AuthResponse(user.getFullName(), user.getEmail(), jwtService.generateToken(user.getEmail()), user.isActive(), null);
    }

    private AuthResponse toPendingAuthResponse(AppUser user) {
        return new AuthResponse(
            user.getFullName(),
            user.getEmail(),
            null,
            user.isActive(),
            "/confirm-email/" + user.getEmailConfirmationToken()
        );
    }

    private UserProfileResponse toUserProfile(AppUser user) {
        return new UserProfileResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getPhone(),
            user.getCreatedAt()
        );
    }

    private GroupResponse toGroupResponse(HouseholdGroup group) {
        long memberCount = membershipRepository.findByGroup_IdOrderByJoinedAtAsc(group.getId()).size();
        return new GroupResponse(
            group.getId(),
            group.getName(),
            group.getCreatedBy().getEmail(),
            group.getCreatedAt(),
            memberCount
        );
    }

    private GroupMemberResponse toMemberResponse(GroupMembership membership) {
        return new GroupMemberResponse(
            membership.getUser().getEmail(),
            membership.getUser().getFullName(),
            membership.getRole(),
            membership.getJoinedAt()
        );
    }

    private InviteResponse toInviteResponse(InviteLink invite) {
        return new InviteResponse(
            invite.getCode(),
            invite.getGroup().getId(),
            invite.getGroup().getName(),
            invite.getCreatedAt(),
            invite.getExpiresAt()
        );
    }

    private TaskResponse toTaskResponse(HouseholdTask task) {
        return new TaskResponse(
            task.getId(),
            task.getGroup().getId(),
            task.getName(),
            task.getDescription(),
            task.getDeadline(),
            task.getFrequency(),
            task.getAssignedTo() == null ? null : task.getAssignedTo().getEmail(),
            task.getAssignedTo() == null ? null : task.getAssignedTo().getFullName(),
            task.getPriority(),
            task.getStatus(),
            task.getCreatedAt(),
            task.getCompletedAt()
        );
    }

    private WeeklyRankingResponse toRankingResponse(WeeklyRanking ranking) {
        List<HouseholdTask> completedTasks = taskRepository.findByGroup_IdAndStatusOrderByCreatedAtDesc(ranking.getGroup().getId(), "completed").stream()
            .filter(task -> task.getCompletedAt() != null)
            .filter(task -> !task.getCompletedAt().isBefore(ranking.getStartAt()) && !task.getCompletedAt().isAfter(ranking.getEndAt()))
            .toList();

        List<RankingMemberResponse> members = membershipRepository.findByGroup_IdOrderByJoinedAtAsc(ranking.getGroup().getId()).stream()
            .map(membership -> {
                List<RankingTaskHistory> history = completedTasks.stream()
                    .filter(task -> task.getAssignedTo() != null && task.getAssignedTo().getId().equals(membership.getUser().getId()))
                    .map(task -> new RankingTaskHistory(task.getId(), task.getName(), task.getCompletedAt(), ranking.getPointsPerTask()))
                    .toList();
                return new RankingMemberResponse(
                    membership.getUser().getEmail(),
                    membership.getUser().getFullName(),
                    history.size() * ranking.getPointsPerTask(),
                    history.size(),
                    0,
                    history
                );
            })
            .sorted((left, right) -> {
                int points = Integer.compare(right.points(), left.points());
                return points != 0 ? points : left.fullName().compareToIgnoreCase(right.fullName());
            })
            .toList();

        java.util.ArrayList<RankingMemberResponse> positioned = new java.util.ArrayList<>();
        int nextPosition = 1;
        for (int index = 0; index < members.size(); index++) {
            RankingMemberResponse member = members.get(index);
            int position = index > 0 && member.points() == members.get(index - 1).points()
                ? positioned.get(index - 1).position()
                : nextPosition;
            positioned.add(new RankingMemberResponse(
                member.email(),
                member.fullName(),
                member.points(),
                member.completedTasks(),
                position,
                member.history()
            ));
            nextPosition++;
        }

        boolean shouldBeInactive = Instant.now().isAfter(ranking.getEndAt()) || positioned.stream().anyMatch(member -> member.points() >= ranking.getWeeklyGoal());
        if (ranking.isActive() && shouldBeInactive) {
            ranking.setActive(false);
        }
        String winnerEmail = positioned.stream().filter(member -> member.points() > 0).findFirst().map(RankingMemberResponse::email).orElse(null);

        return new WeeklyRankingResponse(
            ranking.getId(),
            ranking.getGroup().getId(),
            ranking.getPointsPerTask(),
            ranking.getWeeklyGoal(),
            ranking.getStartAt(),
            ranking.getEndAt(),
            ranking.isActive(),
            ranking.getCreatedAt(),
            winnerEmail,
            positioned
        );
    }

    private NotificationResponse toNotificationResponse(UserNotification notification) {
        return new NotificationResponse(
            notification.getId(),
            notification.getType(),
            notification.getTitle(),
            notification.getDescription(),
            notification.isRead(),
            notification.getGroup().getId(),
            notification.getTask() == null ? null : notification.getTask().getId(),
            notification.getCreatedAt()
        );
    }
}
