package com.fabrica.soyla.service;

import java.time.Instant;
import java.time.LocalDate;
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
import com.fabrica.soyla.repository.AppUserRepository;
import com.fabrica.soyla.repository.GroupMembershipRepository;
import com.fabrica.soyla.repository.HouseholdGroupRepository;
import com.fabrica.soyla.repository.HouseholdTaskRepository;
import com.fabrica.soyla.repository.InviteLinkRepository;
import com.fabrica.soyla.config.JwtService;
import com.fabrica.soyla.web.ApiException;
import com.fabrica.soyla.web.ApiModels.AssignTaskRequest;
import com.fabrica.soyla.web.ApiModels.AuthRequest;
import com.fabrica.soyla.web.ApiModels.AuthResponse;
import com.fabrica.soyla.web.ApiModels.CreateGroupRequest;
import com.fabrica.soyla.web.ApiModels.CreateTaskRequest;
import com.fabrica.soyla.web.ApiModels.GroupMemberResponse;
import com.fabrica.soyla.web.ApiModels.GroupResponse;
import com.fabrica.soyla.web.ApiModels.InviteJoinRequest;
import com.fabrica.soyla.web.ApiModels.InviteResponse;
import com.fabrica.soyla.web.ApiModels.JoinInviteResponse;
import com.fabrica.soyla.web.ApiModels.RegisterRequest;
import com.fabrica.soyla.web.ApiModels.TaskResponse;
import com.fabrica.soyla.web.ApiModels.UpdateMemberRoleRequest;
import com.fabrica.soyla.web.ApiModels.UpdateProfileRequest;
import com.fabrica.soyla.web.ApiModels.UserProfileResponse;

@Service
@Transactional
public class SoylaService {

    private static final long INVITE_TTL_MILLIS = 72L * 60L * 60L * 1000L;
    private static final List<String> ALLOWED_ROLES = List.of("Administrador", "Coadministrador", "Colaborador");
    private static final List<String> ALLOWED_FREQUENCIES = List.of("ninguna", "diaria", "semanal", "mensual");

    private final AppUserRepository userRepository;
    private final HouseholdGroupRepository groupRepository;
    private final GroupMembershipRepository membershipRepository;
    private final InviteLinkRepository inviteRepository;
    private final HouseholdTaskRepository taskRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public SoylaService(
        AppUserRepository userRepository,
        HouseholdGroupRepository groupRepository,
        GroupMembershipRepository membershipRepository,
        InviteLinkRepository inviteRepository,
        HouseholdTaskRepository taskRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.membershipRepository = membershipRepository;
        this.inviteRepository = inviteRepository;
        this.taskRepository = taskRepository;
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
        userRepository.save(user);

        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        AppUser user = userRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas.");
        }

        return toAuthResponse(user);
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
        return toTaskResponse(task);
    }

    public void deleteTask(UUID taskId) {
        HouseholdTask task = findTask(taskId);
        taskRepository.delete(task);
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

    private AuthResponse toAuthResponse(AppUser user) {
        return new AuthResponse(user.getFullName(), user.getEmail(), jwtService.generateToken(user.getEmail()));
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
            task.getCreatedAt()
        );
    }
}
