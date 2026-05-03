package com.fabrica.soyla.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fabrica.soyla.model.GroupMembership;

public interface GroupMembershipRepository extends JpaRepository<GroupMembership, UUID> {

    List<GroupMembership> findByGroup_IdOrderByJoinedAtAsc(UUID groupId);

    List<GroupMembership> findByUser_EmailIgnoreCaseOrderByJoinedAtDesc(String email);

    Optional<GroupMembership> findByGroup_IdAndUser_EmailIgnoreCase(UUID groupId, String email);

    boolean existsByGroup_IdAndUser_EmailIgnoreCase(UUID groupId, String email);
}
