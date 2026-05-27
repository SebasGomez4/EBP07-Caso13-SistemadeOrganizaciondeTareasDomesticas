package com.fabrica.soyla.service;

import com.fabrica.soyla.model.Notificacion;
import com.fabrica.soyla.model.Usuario;
import com.fabrica.soyla.repository.NotificacionRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NotificacionService {

    @Autowired
    private NotificacionRepository notificacionRepository;

    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    public Notificacion crearNotificacion(Usuario usuario, String mensaje, String tipo) {
        Notificacion n = new Notificacion(usuario, mensaje, tipo);
        Notificacion saved = notificacionRepository.save(n);
        // intentar enviar por SSE
        SseEmitter emitter = emitters.get(usuario.getId());
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(Map.of(
                        "id", saved.getId(),
                        "mensaje", saved.getMensaje(),
                        "leida", saved.isLeida(),
                        "creadoAt", saved.getCreadoAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
                        "tipo", saved.getTipo()
                )));
            } catch (IOException e) {
                emitters.remove(usuario.getId());
            }
        }
        return saved;
    }

    public List<Notificacion> listarNotificaciones(Long usuarioId) {
        return notificacionRepository.findByUsuarioIdOrderByCreadoAtDesc(usuarioId);
    }

    public Notificacion marcarComoLeida(Long id, Long usuarioId) {
        Notificacion n = notificacionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notificación no encontrada"));
        if (!n.getUsuario().getId().equals(usuarioId)) {
            throw new SecurityException("No autorizado");
        }
        n.setLeida(true);
        return notificacionRepository.save(n);
    }

    public SseEmitter createEmitterForUser(Long usuarioId) {
        SseEmitter emitter = new SseEmitter(0L); // no timeout
        emitters.put(usuarioId, emitter);
        emitter.onCompletion(() -> emitters.remove(usuarioId));
        emitter.onTimeout(() -> emitters.remove(usuarioId));
        return emitter;
    }

    public long contarNoLeidas(Long usuarioId) {
        return notificacionRepository.countByUsuarioIdAndLeidaFalse(usuarioId);
    }
}
