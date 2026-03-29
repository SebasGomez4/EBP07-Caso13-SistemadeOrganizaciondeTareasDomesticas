package com.fabrica.soyla.repository;

import com.fabrica.soyla.model.TareaDomestica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TareaRepository extends JpaRepository<TareaDomestica, Long> {
}