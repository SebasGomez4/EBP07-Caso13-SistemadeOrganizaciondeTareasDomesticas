package com.fabrica.soyla.repository;

import com.fabrica.soyla.model.TareaDomestica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TareaRepository extends JpaRepository<TareaDomestica, Long> {
    List<TareaDomestica> findByFechaVencimientoGreaterThanEqual(LocalDate fecha);
    List<TareaDomestica> findByResponsableId(Long responsableId);
    List<TareaDomestica> findByGrupoId(Long grupoId);
}