package com.fabrica.soyla.controller;

import com.fabrica.soyla.model.InvitacionDTO;
import com.fabrica.soyla.model.InvitacionGrupo;
import com.fabrica.soyla.service.InvitacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/invitaciones")
public class InvitacionController {

    @Autowired
    private InvitacionService invitacionService;

    @PostMapping("/generar")
    public ResponseEntity<InvitacionDTO> generarInvitacion(@RequestParam Long grupoId) {
        InvitacionGrupo invitacion = invitacionService.generarInvitacion(grupoId);
        InvitacionDTO dto = new InvitacionDTO(invitacion.getToken(), invitacion.getGrupo().getNombre());
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/{token}/validar")
    public ResponseEntity<Map<String, Object>> validarInvitacion(@PathVariable String token) {
        try {
            InvitacionGrupo invitacion = invitacionService.obtenerInvitacion(token);
            Map<String, Object> response = new HashMap<>();
            response.put("valida", invitacion.esValida());
            response.put("grupoNombre", invitacion.getGrupo().getNombre());
            response.put("expirada", invitacion.estaExpirada());
            response.put("usado", invitacion.getUsado());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("valida", false);
            response.put("mensaje", "Enlace de invitación no válido");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @PostMapping("/{token}/aceptar")
    public ResponseEntity<Map<String, String>> aceptarInvitacion(@PathVariable String token) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();

        try {
            invitacionService.aceptarInvitacion(token, correo);
            Map<String, String> response = new HashMap<>();
            response.put("mensaje", "¡Bienvenido al grupo familiar! Ahora eres miembro");
            response.put("estado", "exito");
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            Map<String, String> response = new HashMap<>();
            response.put("mensaje", e.getMessage());
            response.put("estado", "error");

            // Diferenciar entre enlace expirado y ya miembro
            if (e.getMessage().contains("expirado")) {
                return ResponseEntity.status(HttpStatus.GONE).body(response); // 410 Gone para enlace expirado
            } else if (e.getMessage().contains("ya perteneces")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response); // 409 Conflict para ya miembro
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("mensaje", "Error al procesar la invitación: " + e.getMessage());
            response.put("estado", "error");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
}
