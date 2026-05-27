package com.fabrica.soyla.repository;

import com.fabrica.soyla.model.HistorialPuntos;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HistorialPuntosRepository extends JpaRepository<HistorialPuntos, Long> {
    List<HistorialPuntos> findByUsuarioIdAndClasificacionIdOrderByFechaDesc(Long usuarioId, Long clasificacionId);
}