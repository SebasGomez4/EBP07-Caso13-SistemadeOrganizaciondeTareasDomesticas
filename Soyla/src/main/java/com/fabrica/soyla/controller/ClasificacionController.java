package com.fabrica.soyla.controller;

import com.fabrica.soyla.model.ClasificacionSemanal;
import com.fabrica.soyla.model.CrearClasificacionDTO;
import com.fabrica.soyla.model.HistorialPuntosDTO;
import com.fabrica.soyla.model.PuntajeMiembro;
import com.fabrica.soyla.model.RankingDTO;
import com.fabrica.soyla.service.ClasificacionService;
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
@RequestMapping("/api/clasificaciones")
public class ClasificacionController {

    @Autowired
    private ClasificacionService clasificacionService;

    @PostMapping("/crear")
    public ResponseEntity<?> crearClasificacion(@Valid @RequestBody CrearClasificacionDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        Map<String, Object> response = new HashMap<>();
        try {
            ClasificacionSemanal clasificacion = clasificacionService.crearClasificacion(dto, correo);
            response.put("mensaje", "Clasificación semanal creada exitosamente");
            response.put("clasificacion", clasificacion);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalStateException e) {
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (IllegalArgumentException e) {
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @GetMapping("/{grupoId}")
    public ResponseEntity<?> obtenerClasificacion(@PathVariable Long grupoId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        Map<String, Object> response = new HashMap<>();
        try {
            List<PuntajeMiembro> clasificacion = clasificacionService.obtenerClasificacion(grupoId, correo);
            return ResponseEntity.ok(clasificacion);
        } catch (IllegalStateException e) {
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (IllegalArgumentException e) {
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
    @GetMapping("/{grupoId}/ranking")
    public ResponseEntity<?> obtenerRanking(@PathVariable Long grupoId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        Map<String, Object> response = new HashMap<>();
        try {
            List<RankingDTO> ranking = clasificacionService.obtenerRanking(grupoId, correo);
            return ResponseEntity.ok(ranking);
        } catch (IllegalStateException e) {
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (IllegalArgumentException e) {
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @GetMapping("/{grupoId}/historial")
    public ResponseEntity<?> obtenerHistorial(@PathVariable Long grupoId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        Map<String, Object> response = new HashMap<>();
        try {
            List<HistorialPuntosDTO> historial = clasificacionService.obtenerHistorial(grupoId, correo);
            return ResponseEntity.ok(historial);
        } catch (IllegalStateException e) {
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (IllegalArgumentException e) {
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
}