package com.fabrica.soyla.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fabrica.soyla.model.InviteLink;

public interface InviteLinkRepository extends JpaRepository<InviteLink, UUID> {

    Optional<InviteLink> findByCode(String code);

    Optional<InviteLink> findFirstByGroup_IdAndExpiresAtAfterOrderByCreatedAtDesc(UUID groupId, Instant now);

    boolean existsByCode(String code);
}
