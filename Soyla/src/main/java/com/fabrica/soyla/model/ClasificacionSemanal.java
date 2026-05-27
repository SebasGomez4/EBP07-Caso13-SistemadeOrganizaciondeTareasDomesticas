package com.fabrica.soyla.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Getter
@Setter
public class ClasificacionSemanal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    @NotNull(message = "El grupo es obligatorio")
    private GrupoFamiliar grupo;

    @NotNull(message = "Los puntos por tarea son obligatorios")
    private Integer puntosPorTarea;

    @NotNull(message = "La meta de puntos es obligatoria")
    private Integer metaPuntos;

    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private boolean activa = true;

    @OneToMany(mappedBy = "clasificacion", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnore
    private List<PuntajeMiembro> miembros = new ArrayList<>();
}