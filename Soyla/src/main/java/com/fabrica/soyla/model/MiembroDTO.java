package com.fabrica.soyla.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MiembroDTO {
    private String nombre;
    private String rol;
    private String correo; // solo visible para ADMIN
}