package com.fabrica.soyla.repository;

import com.fabrica.soyla.model.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findByUsuarioIdOrderByCreadoAtDesc(Long usuarioId);
    long countByUsuarioIdAndLeidaFalse(Long usuarioId);
}