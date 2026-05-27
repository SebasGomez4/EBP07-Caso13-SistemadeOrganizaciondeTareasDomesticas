package com.fabrica.soyla.model;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CrearClasificacionDTO {

    @NotNull(message = "El grupo es obligatorio")
    private Long grupoId;

    @NotNull(message = "Los puntos por tarea son obligatorios")
    private Integer puntosPorTarea;

    @NotNull(message = "La meta de puntos es obligatoria")
    private Integer metaPuntos;
}