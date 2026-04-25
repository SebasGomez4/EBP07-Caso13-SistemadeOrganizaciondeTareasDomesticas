package com.fabrica.soyla.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InvitacionDTO {
    private String enlaceInvitacion;
    private String token;
    private String grupoNombre;
    private String mensaje;

    public InvitacionDTO(String token, String grupoNombre) {
        this.token = token;
        this.grupoNombre = grupoNombre;
        this.enlaceInvitacion = "/api/invitaciones/" + token + "/aceptar";
        this.mensaje = "Enlace de invitación generado exitosamente";
    }
}
