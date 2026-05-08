package com.fabrica.soyla.web;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public final class ApiModels {

    private ApiModels() {
    }

    public record RegisterRequest(
        @NotBlank(message = "El nombre completo es obligatorio.") String fullName,
        @NotBlank(message = "El correo electr\u00f3nico es obligatorio.") @Email(message = "El correo electr\u00f3nico no es v\u00e1lido.") String email,
        @NotBlank(message = "La contrase\u00f1a es obligatoria.") String password
    ) {
    }

    public record AuthRequest(
        @NotBlank(message = "El correo electr\u00f3nico es obligatorio.") @Email(message = "El correo electr\u00f3nico no es v\u00e1lido.") String email,
        @NotBlank(message = "La contrase\u00f1a es obligatoria.") String password
    ) {
    }

    public record AuthResponse(String fullName, String email, String token) {
    }

    public record UserProfileResponse(UUID id, String fullName, String email, String phone, Instant createdAt) {
    }

    public record UpdateProfileRequest(
        @NotBlank(message = "El correo electr\u00f3nico es obligatorio.") @Email(message = "El correo electr\u00f3nico no es v\u00e1lido.") String email,
        String phone
    ) {
    }

    public record CreateGroupRequest(
        @NotBlank(message = "El nombre del grupo es obligatorio.") String name,
        @NotBlank(message = "El creador del grupo es obligatorio.") @Email(message = "El correo electr\u00f3nico no es v\u00e1lido.") String createdByEmail
    ) {
    }

    public record GroupResponse(UUID id, String name, String createdByEmail, Instant createdAt, long memberCount) {
    }

    public record GroupMemberResponse(String email, String fullName, String role, Instant joinedAt) {
    }

    public record UpdateMemberRoleRequest(
        @NotBlank(message = "El rol es obligatorio.") String role,
        @NotBlank(message = "El correo del solicitante es obligatorio.") @Email(message = "El correo electr\u00f3nico no es v\u00e1lido.") String requestedByEmail
    ) {
    }

    public record InviteResponse(String code, UUID groupId, String groupName, Instant createdAt, Instant expiresAt) {
    }

    public record InviteJoinRequest(
        @NotBlank(message = "El correo del usuario es obligatorio.") @Email(message = "El correo electr\u00f3nico no es v\u00e1lido.") String userEmail
    ) {
    }

    public record JoinInviteResponse(boolean alreadyMember, GroupResponse group) {
    }

    public record CreateTaskRequest(
        @NotBlank(message = "El nombre de la tarea es obligatorio.") String name,
        String description,
        LocalDate deadline,
        String frequency,
        String priority
    ) {
    }

    public record TaskResponse(
        UUID id,
        UUID groupId,
        String name,
        String description,
        LocalDate deadline,
        String frequency,
        String assignedToEmail,
        String assignedToName,
        String priority,
        String status,
        Instant createdAt
    ) {
    }

    public record AssignTaskRequest(
        @NotBlank(message = "El responsable es obligatorio.") @Email(message = "El correo electr\u00f3nico no es v\u00e1lido.") String assignedToEmail
    ) {
    }
}
