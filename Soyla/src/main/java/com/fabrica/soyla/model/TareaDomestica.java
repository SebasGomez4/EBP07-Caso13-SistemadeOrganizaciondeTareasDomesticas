package com.fabrica.soyla.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

@Entity
@Getter
@Setter
public class TareaDomestica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "La descripción es obligatoria")
    private String descripcion;


    @NotNull(message = "La fecha de vencimiento es obligatoria")
    @JsonFormat(pattern = "yyyy-MM-dd")
    @FutureOrPresent(message = "La fecha de vencimiento debe ser posterior a la actual.")
    private LocalDate fechaVencimiento;

    @ManyToOne
    @JoinColumn(name = "responsable_id")
    private Usuario responsable;

    private String prioridad;
    private String frecuencia;
    private String estado;
    private boolean notificacionVencidaEnviada = false;

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    @NotNull(message = "El grupo es obligatorio")
    private GrupoFamiliar grupo;

    public String getNombreResponsable() {
        return responsable != null ? responsable.getNombre() : "Sin responsable asignado";
    }

    public String getPrioridadMostrada() {
        return prioridad != null && !prioridad.isBlank() ? prioridad : "Sin prioridad asignada";
    }
}