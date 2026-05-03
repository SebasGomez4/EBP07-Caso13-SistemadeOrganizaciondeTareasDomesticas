package com.fabrica.soyla.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fabrica.soyla.model.HouseholdGroup;

public interface HouseholdGroupRepository extends JpaRepository<HouseholdGroup, UUID> {
}
