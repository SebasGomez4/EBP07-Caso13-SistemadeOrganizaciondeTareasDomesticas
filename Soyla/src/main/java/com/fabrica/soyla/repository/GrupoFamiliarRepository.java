package com.fabrica.soyla.repository;

import com.fabrica.soyla.model.GrupoFamiliar;
import com.fabrica.soyla.model.GrupoMiembro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GrupoFamiliarRepository extends JpaRepository<GrupoFamiliar, Long> {

    @Query("SELECT gm FROM GrupoMiembro gm WHERE gm.grupo.id = :grupoId AND gm.usuario.correo = :correo")
    Optional<GrupoMiembro> findMiembroEnGrupo(@Param("grupoId") Long grupoId, @Param("correo") String correo);

    @Query("SELECT gm FROM GrupoMiembro gm WHERE gm.grupo.id = :grupoId")
    List<GrupoMiembro> findMiembrosByGrupoId(@Param("grupoId") Long grupoId);

    @Query("SELECT gm FROM GrupoMiembro gm WHERE gm.grupo.id = :grupoId AND gm.usuario.id = :usuarioId")
    Optional<GrupoMiembro> findMiembroEnGrupoPorUsuarioId(@Param("grupoId") Long grupoId, @Param("usuarioId") Long usuarioId);
}