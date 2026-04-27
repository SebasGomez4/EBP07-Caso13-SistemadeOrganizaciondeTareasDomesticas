package com.fabrica.soyla.model;

import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EditarPerfilDTO {

    private String nombre;

    @Email(message = "El formato del correo no es válido")
    private String correo;

    private String telefono;

    private String fotoPerfil;

    private String contrasena;
}