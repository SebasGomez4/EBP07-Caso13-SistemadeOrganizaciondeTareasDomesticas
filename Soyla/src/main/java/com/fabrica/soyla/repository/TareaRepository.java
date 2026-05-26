package com.fabrica.soyla.repository;

import com.fabrica.soyla.model.TareaDomestica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TareaRepository extends JpaRepository<TareaDomestica, Long> {
    List<TareaDomestica> findByFechaVencimientoGreaterThanEqual(LocalDate fecha);
    List<TareaDomestica> findByResponsableId(Long responsableId);
    List<TareaDomestica> findByGrupoId(Long grupoId);

    @Query("select t from TareaDomestica t where t.estado not in :estados and t.fechaVencimiento < :fecha")
    List<TareaDomestica> findTareasVencidasPorEstadoYFecha(@Param("estados") List<String> estados, @Param("fecha") LocalDate fecha);
    @Query("SELECT t FROM TareaDomestica t WHERE t.responsable IS NOT NULL AND t.fechaVencimiento BETWEEN :hoy AND :limite AND t.estado NOT IN :estados")
    List<TareaDomestica> findTareasProximasAVencer(
        @Param("hoy") LocalDate hoy,
        @Param("limite") LocalDate limite,
        @Param("estados") List<String> estados
);
    @Modifying
    @Query("DELETE FROM TareaDomestica t WHERE t.grupo.id = :grupoId")
    void deleteByGrupoId(@Param("grupoId") Long grupoId);
}