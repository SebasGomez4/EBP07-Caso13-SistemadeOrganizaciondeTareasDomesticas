package com.fabrica.soyla.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fabrica.soyla.model.UserNotification;

public interface UserNotificationRepository extends JpaRepository<UserNotification, UUID> {

    List<UserNotification> findByRecipient_EmailIgnoreCaseOrderByCreatedAtDesc(String email);

    Optional<UserNotification> findByRecipient_EmailIgnoreCaseAndDedupeKey(String email, String dedupeKey);

    void deleteByGroup_Id(UUID groupId);
}
