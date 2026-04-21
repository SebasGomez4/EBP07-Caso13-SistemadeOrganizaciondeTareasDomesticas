package com.fabrica.soyla.controller;

import com.fabrica.soyla.model.CrearGrupoDTO;
import com.fabrica.soyla.model.GrupoFamiliar;
import com.fabrica.soyla.service.GrupoFamiliarService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/grupos")
public class GrupoFamiliarController {

    @Autowired
    private GrupoFamiliarService grupoFamiliarService;

    @PostMapping("/crear")
    public ResponseEntity<GrupoFamiliar> crearGrupo(
            @Valid @RequestBody CrearGrupoDTO dto,
            @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        GrupoFamiliar grupo = grupoFamiliarService.crearGrupo(dto, token);
        return ResponseEntity.status(HttpStatus.CREATED).body(grupo);
    }
}