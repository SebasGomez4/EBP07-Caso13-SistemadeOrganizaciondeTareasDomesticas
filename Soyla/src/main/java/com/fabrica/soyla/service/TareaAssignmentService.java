package com.fabrica.soyla.service;

import com.fabrica.soyla.model.AsignarTareaDTO;
import com.fabrica.soyla.model.TareaDomestica;
import com.fabrica.soyla.repository.GrupoFamiliarRepository;
import com.fabrica.soyla.repository.TareaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Servicio dedicado a ASIGNAR tareas a miembros.
 * Responsabilidad única: Manejar la asignación de responsables.
 * 
 * Soluciona el antipatrón: GOD SERVICE (separación de responsabilidades)
 */
@Service
public class TareaAssignmentService {

    @Autowired
    private TareaRepository tareaRepository;

    @Autowired
    private GrupoFamiliarRepository grupoFamiliarRepository;

    @Autowired
    private GrupoAuthorizationService authorizationService;

    @Transactional
    public TareaDomestica asignarTarea(AsignarTareaDTO dto, String correoUsuario) {
        authorizationService.validarPertenenciaAlGrupo(dto.getGrupoId(), correoUsuario);

        grupoFamiliarRepository.findMiembroEnGrupoPorUsuarioId(
                dto.getGrupoId(), 
                dto.getResponsableId())
                .orElseThrow(() -> new IllegalStateException(
                    "El miembro seleccionado no pertenece a este grupo familiar"));

        TareaDomestica tarea = tareaRepository.findById(dto.getTareaId())
                .orElseThrow(() -> new IllegalArgumentException("Tarea no encontrada"));

        tarea.setResponsable(
            grupoFamiliarRepository
                .findMiembroEnGrupoPorUsuarioId(dto.getGrupoId(), dto.getResponsableId())
                .get()
                .getUsuario()
        );

        return tareaRepository.saveAndFlush(tarea);
    }
}
