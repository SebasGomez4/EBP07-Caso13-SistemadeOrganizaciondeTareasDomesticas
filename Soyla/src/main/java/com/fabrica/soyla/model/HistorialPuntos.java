package com.fabrica.soyla.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class HistorialPuntos {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "clasificacion_id")
    private ClasificacionSemanal clasificacion;

    @ManyToOne
    @JoinColumn(name = "tarea_id")
    private TareaDomestica tarea;

    private Integer puntosObtenidos;
    private LocalDateTime fecha = LocalDateTime.now();
}