package com.fabrica.soyla.service;

import com.fabrica.soyla.model.TareaDomestica;
import com.fabrica.soyla.repository.TareaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

/**
 * Servicio dedicado a CONSULTAS de tareas.
 * Responsabilidad única: Obtener/listar tareas.
 * 
 * Soluciona el antipatrón: GOD SERVICE (separación de responsabilidades)
 */
@Service
public class TareaQueryService {

    @Autowired
    private TareaRepository tareaRepository;

    @Autowired
    private GrupoAuthorizationService authorizationService;

    public List<TareaDomestica> listarTareasPorGrupo(Long grupoId, String correoUsuario) {
        long startTime = System.currentTimeMillis();
        
        authorizationService.validarPertenenciaAlGrupo(grupoId, correoUsuario);
        
        List<TareaDomestica> tareas = tareaRepository.findByGrupoId(grupoId);
        
        long elapsedTime = System.currentTimeMillis() - startTime;
        if (elapsedTime > 2000) {
            throw new IllegalStateException(
                    "El tiempo de carga excedió el límite máximo de 2 segundos. " +
                    "Tiempo utilizado: " + elapsedTime + "ms"
            );
        }
        
        return tareas;
    }
}
