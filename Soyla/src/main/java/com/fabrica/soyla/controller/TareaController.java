package com.fabrica.soyla.controller;

import com.fabrica.soyla.model.AsignarTareaDTO;
import com.fabrica.soyla.model.CambiarEstadoTareaDTO;
import com.fabrica.soyla.model.MiembroDTO;
import com.fabrica.soyla.model.TareaDomestica;
import com.fabrica.soyla.service.TareaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tareas")
public class TareaController {

    @Autowired
    private TareaService tareaService;

    @PostMapping
    public ResponseEntity<?> crearTarea(@Valid @RequestBody TareaDomestica tarea) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        try {
            TareaDomestica nueva = tareaService.crearTarea(tarea, correo);
            return ResponseEntity.status(HttpStatus.CREATED).body(nueva);
        } catch (IllegalStateException e) {
            Map<String, String> response = new HashMap<>();
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> response = new HashMap<>();
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping("/grupo/{grupoId}")
    public ResponseEntity<?> listarTareasPorGrupo(@PathVariable Long grupoId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        try {
            List<TareaDomestica> tareas = tareaService.listarTareasPorGrupo(grupoId, correo);
            if (tareas.isEmpty()) {
                Map<String, String> response = new HashMap<>();
                response.put("mensaje", "No existen tareas registradas en este grupo");
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.ok(tareas);
        } catch (IllegalStateException e) {
            Map<String, String> response = new HashMap<>();
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> eliminarTarea(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        Map<String, String> response = new HashMap<>();
        try {
            tareaService.eliminarTarea(id, correo);
            response.put("mensaje", "Tarea doméstica eliminada exitosamente");
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            response.put("mensaje", e.getMessage());
            response.put("estado", "error");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (IllegalArgumentException e) {
            response.put("mensaje", e.getMessage());
            response.put("estado", "error");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("mensaje", "Error al eliminar la tarea: " + e.getMessage());
            response.put("estado", "error");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/asignar")
    public ResponseEntity<Map<String, Object>> asignarTarea(@Valid @RequestBody AsignarTareaDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        Map<String, Object> response = new HashMap<>();
        try {
            TareaDomestica tarea = tareaService.asignarTarea(dto, correo);
            response.put("mensaje", "Tarea asignada exitosamente");
            response.put("estado", "exito");
            response.put("tarea", tarea);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            response.put("mensaje", e.getMessage());
            response.put("estado", "error");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (IllegalArgumentException e) {
            response.put("mensaje", e.getMessage());
            response.put("estado", "error");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @GetMapping("/miembros/{grupoId}")
    public ResponseEntity<List<MiembroDTO>> obtenerMiembrosDisponibles(@PathVariable Long grupoId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        List<MiembroDTO> miembros = tareaService.obtenerMiembrosDisponibles(grupoId, correo);
        return ResponseEntity.ok(miembros);
    }

    @PostMapping("/{id}/cambiar-estado")
    public ResponseEntity<Map<String, Object>> cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody CambiarEstadoTareaDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        Map<String, Object> response = new HashMap<>();
        try {
            TareaDomestica tarea = tareaService.cambiarEstado(id, dto.getNuevoEstado(), correo);
            response.put("mensaje", "Estado de la tarea actualizado exitosamente");
            response.put("estado", "exito");
            response.put("tarea", tarea);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("mensaje", e.getMessage());
            response.put("estado", "error");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (SecurityException e) {
            response.put("mensaje", e.getMessage());
            response.put("estado", "error");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (IllegalStateException e) {
            response.put("mensaje", e.getMessage());
            response.put("estado", "error");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
    }
}