package com.fabrica.soyla.model;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CrearGrupoDTO {

    @NotBlank(message = "El nombre del grupo es obligatorio")
    private String nombre;
}