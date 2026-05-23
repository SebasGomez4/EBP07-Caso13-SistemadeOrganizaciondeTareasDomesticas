package com.fabrica.soyla.service;

import com.fabrica.soyla.model.TareaDomestica;
import com.fabrica.soyla.repository.TareaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Servicio dedicado a ELIMINAR tareas.
 * Responsabilidad única: Gestionar eliminación de tareas.
 * 
 * Soluciona el antipatrón: GOD SERVICE (separación de responsabilidades)
 */
@Service
public class TareaDeletionService {

    private static final long MAX_RESPONSE_TIME_MS = 3000;

    @Autowired
    private TareaRepository tareaRepository;

    @Autowired
    private GrupoAuthorizationService authorizationService;

    @Transactional
    public void eliminarTarea(Long tareaId, String correoUsuario) {
        long startTime = System.currentTimeMillis();
        
        TareaDomestica tarea = tareaRepository.findById(tareaId)
                .orElseThrow(() -> new IllegalArgumentException(
                    "Tarea doméstica no encontrada"));

        authorizationService.validarPertenenciaAlGrupo(
            tarea.getGrupo().getId(), 
            correoUsuario
        );

        tareaRepository.delete(tarea);

        long elapsedTime = System.currentTimeMillis() - startTime;
        if (elapsedTime > MAX_RESPONSE_TIME_MS) {
            throw new IllegalStateException(
                    "El tiempo de respuesta para eliminar la tarea excedió el límite máximo de 3 segundos. " +
                    "Tiempo utilizado: " + elapsedTime + "ms"
            );
        }
    }
}
