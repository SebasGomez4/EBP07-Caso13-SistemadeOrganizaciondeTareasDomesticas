package com.fabrica.soyla.repository;

import com.fabrica.soyla.model.ClasificacionSemanal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClasificacionRepository extends JpaRepository<ClasificacionSemanal, Long> {
    Optional<ClasificacionSemanal> findByGrupoIdAndActivaTrue(Long grupoId);
    List<ClasificacionSemanal> findByActivaTrue();
}