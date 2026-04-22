package com.fabrica.soyla.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class InvitacionGrupo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "grupo_id", nullable = false)
    private GrupoFamiliar grupo;

    @Column(unique = true, nullable = false, length = 256)
    private String token;

    @Column(nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(nullable = false)
    private LocalDateTime fechaExpiracion;

    @Column(nullable = false)
    private Boolean usado = false;

    public InvitacionGrupo() {
    }

    public InvitacionGrupo(GrupoFamiliar grupo, String token, LocalDateTime fechaExpiracion) {
        this.grupo = grupo;
        this.token = token;
        this.fechaCreacion = LocalDateTime.now();
        this.fechaExpiracion = fechaExpiracion;
        this.usado = false;
    }

    public boolean esValida() {
        return !usado && LocalDateTime.now().isBefore(fechaExpiracion);
    }

    public boolean estaExpirada() {
        return LocalDateTime.now().isAfter(fechaExpiracion);
    }
}
