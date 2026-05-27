package com.fabrica.soyla.repository;

import com.fabrica.soyla.model.PuntajeMiembro;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PuntajeMiembroRepository extends JpaRepository<PuntajeMiembro, Long> {
    List<PuntajeMiembro> findByClasificacionIdOrderByPuntosDesc(Long clasificacionId);
    Optional<PuntajeMiembro> findByClasificacionIdAndUsuarioId(Long clasificacionId, Long usuarioId);
}