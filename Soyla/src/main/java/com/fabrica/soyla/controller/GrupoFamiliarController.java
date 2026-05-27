package com.fabrica.soyla.controller;

import com.fabrica.soyla.model.CrearGrupoDTO;
import com.fabrica.soyla.config.JwtUtil;
import com.fabrica.soyla.model.GrupoFamiliar;
import com.fabrica.soyla.model.MiembroDTO;
import com.fabrica.soyla.service.GrupoFamiliarService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/grupos")
public class GrupoFamiliarController {

    @Autowired
    private GrupoFamiliarService grupoFamiliarService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/crear")
    public ResponseEntity<GrupoFamiliar> crearGrupo(
            @Valid @RequestBody CrearGrupoDTO dto,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        GrupoFamiliar grupo = grupoFamiliarService.crearGrupo(dto, token);
        return ResponseEntity.status(HttpStatus.CREATED).body(grupo);
    }   

    @GetMapping("/{grupoId}/miembros")
    public ResponseEntity<List<MiembroDTO>> obtenerMiembros(
            @PathVariable Long grupoId,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        List<MiembroDTO> miembros = grupoFamiliarService.obtenerMiembros(grupoId, token);
        return ResponseEntity.ok(miembros);
    }
    @GetMapping("/mis-grupos")
    public ResponseEntity<?> obtenerMisGrupos() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        try {
            List<?> grupos = grupoFamiliarService.obtenerMisGrupos(correo);
            if (grupos.isEmpty()) {
                Map<String, String> response = new HashMap<>();
                response.put("mensaje", "No perteneces a ningún grupo familiar");
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.ok(grupos);
        } catch (IllegalArgumentException e) {
            Map<String, String> response = new HashMap<>();
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @DeleteMapping("/{grupoId}/eliminar")
    public ResponseEntity<Map<String, String>> eliminarGrupo(
            @PathVariable Long grupoId,
            @RequestHeader("Authorization") String authHeader) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        Map<String, String> response = new HashMap<>();

        try {
            grupoFamiliarService.eliminarGrupo(grupoId, correo);
            response.put("mensaje", "El grupo familiar ha sido eliminado exitosamente. Esta acción es irreversible.");
            response.put("estado", "exito");
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

    @DeleteMapping("/{grupoId}/abandonar")
    public ResponseEntity<?> abandonarGrupo(@PathVariable Long grupoId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();
        Map<String, String> response = new HashMap<>();
        try {
            grupoFamiliarService.abandonarGrupo(grupoId, correo);
            response.put("mensaje", "Has abandonado el grupo exitosamente");
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (IllegalArgumentException e) {
            response.put("mensaje", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }
}