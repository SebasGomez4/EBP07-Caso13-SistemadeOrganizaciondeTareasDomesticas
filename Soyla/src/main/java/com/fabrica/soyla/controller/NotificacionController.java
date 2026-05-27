package com.fabrica.soyla.controller;

import com.fabrica.soyla.model.Notificacion;
import com.fabrica.soyla.model.Usuario;
import com.fabrica.soyla.repository.UsuarioRepository;
import com.fabrica.soyla.service.AlertaTareaService;
import com.fabrica.soyla.service.NotificacionService;
import com.fabrica.soyla.service.TareaVencidaService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {

    @Autowired
private AlertaTareaService alertaTareaService;

    @Autowired
    private NotificacionService notificacionService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TareaVencidaService tareaVencidaService;

    @GetMapping("/stream")
    public SseEmitter streamNotifications() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        return notificacionService.createEmitterForUser(usuario.getId());
    }

    @GetMapping
    public ResponseEntity<List<Notificacion>> listar() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        return ResponseEntity.ok(notificacionService.listarNotificaciones(usuario.getId()));
    }   
    @PostMapping("/verificar-tareas")
    public ResponseEntity<Map<String, String>> verificarTareas() {
        alertaTareaService.verificarManualmente();
        return ResponseEntity.ok(Map.of(
            "estado", "exito",
            "mensaje", "Verificación de tareas ejecutada correctamente"
        ));
}

    @PostMapping("/{id}/leer")
    public ResponseEntity<Map<String, String>> marcarComoLeida(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        notificacionService.marcarComoLeida(id, usuario.getId());
        return ResponseEntity.ok(Map.of("estado", "exito"));
    }

    @PostMapping("/verificar-vencidas")
    public ResponseEntity<Map<String, String>> verificarVencidas() {
        tareaVencidaService.verificarManualmente();
        return ResponseEntity.ok(Map.of(
            "estado", "exito",
            "mensaje", "Verificación de tareas vencidas ejecutada correctamente"
    ));
    }

    @GetMapping("/no-leidas")
    public ResponseEntity<Map<String, Long>> contarNoLeidas() {
        long startTime = System.currentTimeMillis();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        long cantidad = notificacionService.contarNoLeidas(usuario.getId());

        long elapsedTime = System.currentTimeMillis() - startTime;
        if (elapsedTime > 2000) {
            throw new IllegalStateException("El tiempo de respuesta excedió 2 segundos");
        }

        return ResponseEntity.ok(Map.of("noLeidas", cantidad));
    }
}
