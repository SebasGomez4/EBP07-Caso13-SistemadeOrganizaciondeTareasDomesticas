package com.fabrica.soyla.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fabrica.soyla.model.HouseholdTask;

public interface HouseholdTaskRepository extends JpaRepository<HouseholdTask, UUID> {

    List<HouseholdTask> findByGroup_IdOrderByCreatedAtDesc(UUID groupId);

    List<HouseholdTask> findByGroup_IdAndStatusOrderByCreatedAtDesc(UUID groupId, String status);

    void deleteByGroup_Id(UUID groupId);
}
