package com.fabrica.soyla.controller;

import com.fabrica.soyla.model.TareaDomestica;
import com.fabrica.soyla.repository.UsuarioRepository;
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

    @Autowired
    private UsuarioRepository usuarioRepository;

    @PostMapping
    public ResponseEntity<TareaDomestica> crearTarea(@Valid @RequestBody TareaDomestica tarea) {
        TareaDomestica nueva = tareaService.crearTarea(tarea);
        return ResponseEntity.status(HttpStatus.CREATED).body(nueva);
    }

    @GetMapping
    public ResponseEntity<List<TareaDomestica>> listarTareas() {
        List<TareaDomestica> tareas = tareaService.listarTareasVigentes();
        return ResponseEntity.ok(tareas);
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
}
