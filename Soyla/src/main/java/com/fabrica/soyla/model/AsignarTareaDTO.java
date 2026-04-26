package com.fabrica.soyla.model;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AsignarTareaDTO {

    @NotNull(message = "El id de la tarea es obligatorio")
    private Long tareaId;

    @NotNull(message = "El id del responsable es obligatorio")
    private Long responsableId;

    @NotNull(message = "El id del grupo es obligatorio")
    private Long grupoId;
}