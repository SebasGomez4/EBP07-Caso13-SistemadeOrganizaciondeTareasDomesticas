package com.fabrica.soyla.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fabrica.soyla.model.WeeklyRanking;

public interface WeeklyRankingRepository extends JpaRepository<WeeklyRanking, UUID> {

    Optional<WeeklyRanking> findFirstByGroup_IdAndActiveTrueOrderByCreatedAtDesc(UUID groupId);

    Optional<WeeklyRanking> findFirstByGroup_IdOrderByCreatedAtDesc(UUID groupId);

    List<WeeklyRanking> findByGroup_IdAndActiveTrue(UUID groupId);

    void deleteByGroup_Id(UUID groupId);
}
