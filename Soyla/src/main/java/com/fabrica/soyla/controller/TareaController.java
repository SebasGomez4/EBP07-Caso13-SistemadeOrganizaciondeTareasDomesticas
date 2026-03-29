package com.fabrica.soyla.controller;

import com.fabrica.soyla.model.TareaDomestica;
import com.fabrica.soyla.service.TareaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tareas")
public class TareaController {

    @Autowired
    private TareaService tareaService;

     @PostMapping
    public ResponseEntity<?> crearTarea(@Valid @RequestBody TareaDomestica tarea) {
        try {
            TareaDomestica nueva = tareaService.crearTarea(tarea);
            return ResponseEntity.status(HttpStatus.CREATED).body(nueva);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
