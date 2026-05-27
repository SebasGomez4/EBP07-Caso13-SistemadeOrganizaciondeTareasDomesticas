package com.fabrica.soyla.model;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class HistorialPuntosDTO {
    private String nombreTarea;
    private Integer puntosObtenidos;
    private LocalDateTime fecha;

    public HistorialPuntosDTO(String nombreTarea, Integer puntosObtenidos, LocalDateTime fecha) {
        this.nombreTarea = nombreTarea;
        this.puntosObtenidos = puntosObtenidos;
        this.fecha = fecha;
    }
}