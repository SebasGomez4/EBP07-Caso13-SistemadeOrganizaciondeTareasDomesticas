package com.fabrica.soyla.service;

import com.fabrica.soyla.model.GrupoFamiliar;
import com.fabrica.soyla.model.TareaDomestica;
import com.fabrica.soyla.repository.GrupoFamiliarRepository;
import com.fabrica.soyla.repository.TareaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Servicio dedicado a la CREACIÓN de tareas.
 * Responsabilidad única: Crear nuevas tareas de forma segura.
 * 
 * Soluciona el antipatrón: GOD SERVICE (separación de responsabilidades)
 */
@Service
public class TareaCreationService {

    @Autowired
    private TareaRepository tareaRepository;

    @Autowired
    private GrupoFamiliarRepository grupoFamiliarRepository;

    @Autowired
    private GrupoAuthorizationService authorizationService;

    @Transactional
    public TareaDomestica crearTarea(TareaDomestica tarea, String correoUsuario) {
        if (tarea.getGrupo() == null || tarea.getGrupo().getId() == null) {
            throw new IllegalArgumentException("El grupo es obligatorio");
        }

        authorizationService.validarPertenenciaAlGrupo(
            tarea.getGrupo().getId(), 
            correoUsuario
        );

        GrupoFamiliar grupo = grupoFamiliarRepository.findById(tarea.getGrupo().getId())
                .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado"));

        tarea.setId(null);
        tarea.setGrupo(grupo);
        tarea.setEstado(tarea.getEstado() != null ? tarea.getEstado() : "SIN_EMPEZAR");

        return tareaRepository.saveAndFlush(tarea);
    }
}
