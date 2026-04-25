package com.fabrica.soyla.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PerfilDTO {
    private String nombre;
    private String correo;
    private String fotoPerfil;

    public PerfilDTO(String nombre, String correo, String fotoPerfil) {
        this.nombre = nombre;
        this.correo = correo;
        this.fotoPerfil = fotoPerfil != null ? fotoPerfil : "/images/default-user-gray.png"; // Foto por defecto
    }
}