package com.fabrica.soyla.repository;

import com.fabrica.soyla.model.GrupoFamiliar;
import com.fabrica.soyla.model.GrupoMiembro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface GrupoFamiliarRepository extends JpaRepository<GrupoFamiliar, Long> {

    @Query("SELECT gm FROM GrupoMiembro gm WHERE gm.grupo.id = :grupoId AND gm.usuario.correo = :correo")
    Optional<GrupoMiembro> findMiembroEnGrupo(@Param("grupoId") Long grupoId, @Param("correo") String correo);
}