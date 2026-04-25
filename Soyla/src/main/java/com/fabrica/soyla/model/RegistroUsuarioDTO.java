package com.fabrica.soyla.model;

import com.fabrica.soyla.validation.ValidarContraseña;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegistroUsuarioDTO {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @Email(message = "El correo no es válido")
    @NotBlank(message = "El correo es obligatorio")
    private String correo;

    @NotBlank(message = "La contraseña es obligatoria")
    @ValidarContraseña
    private String contrasena;
}