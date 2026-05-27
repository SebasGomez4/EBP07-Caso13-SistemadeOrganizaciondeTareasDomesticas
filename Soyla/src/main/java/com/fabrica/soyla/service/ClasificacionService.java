package com.fabrica.soyla.service;

import com.fabrica.soyla.model.ClasificacionSemanal;
import com.fabrica.soyla.model.CrearClasificacionDTO;
import com.fabrica.soyla.model.GrupoFamiliar;
import com.fabrica.soyla.model.GrupoMiembro;
import com.fabrica.soyla.model.PuntajeMiembro;
import com.fabrica.soyla.repository.ClasificacionRepository;
import com.fabrica.soyla.repository.GrupoFamiliarRepository;
import com.fabrica.soyla.repository.PuntajeMiembroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
public class ClasificacionService {

    @Autowired
    private ClasificacionRepository clasificacionRepository;

    @Autowired
    private GrupoFamiliarRepository grupoFamiliarRepository;

    @Autowired
    private GrupoAuthorizationService grupoAuthorizationService;

    @Autowired
    private PuntajeMiembroRepository puntajeMiembroRepository;

    @Transactional
    public ClasificacionSemanal crearClasificacion(CrearClasificacionDTO dto, String correo) {
        long startTime = System.currentTimeMillis();

        if (!grupoAuthorizationService.esAdminDelGrupo(dto.getGrupoId(), correo)) {
            throw new IllegalStateException("Solo el administrador puede crear una clasificación semanal");
        }

        clasificacionRepository.findByGrupoIdAndActivaTrue(dto.getGrupoId())
                .ifPresent(c -> {
                    throw new IllegalStateException("Ya existe una clasificación semanal activa en este grupo");
                });

        GrupoFamiliar grupo = grupoFamiliarRepository.findById(dto.getGrupoId())
                .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado"));

        ClasificacionSemanal clasificacion = new ClasificacionSemanal();
        clasificacion.setGrupo(grupo);
        clasificacion.setPuntosPorTarea(dto.getPuntosPorTarea());
        clasificacion.setMetaPuntos(dto.getMetaPuntos());
        clasificacion.setFechaInicio(LocalDate.now());
        clasificacion.setFechaFin(LocalDate.now().plusDays(7));
        clasificacion.setActiva(true);

        ClasificacionSemanal guardada = clasificacionRepository.save(clasificacion);

        // Inicializar puntaje en 0 para cada miembro del grupo
        for (GrupoMiembro miembro : grupo.getMiembros()) {
            PuntajeMiembro puntaje = new PuntajeMiembro();
            puntaje.setClasificacion(guardada);
            puntaje.setUsuario(miembro.getUsuario());
            puntaje.setPuntos(0);
            guardada.getMiembros().add(puntaje);
        }

        ClasificacionSemanal resultado = clasificacionRepository.save(guardada);

        long elapsedTime = System.currentTimeMillis() - startTime;
        if (elapsedTime > 3000) {
            throw new IllegalStateException(
                    "El tiempo de respuesta excedió el límite máximo de 3 segundos. " +
                    "Tiempo utilizado: " + elapsedTime + "ms");
        }

        return resultado;
    }

    public List<PuntajeMiembro> obtenerClasificacion(Long grupoId, String correo) {
        grupoAuthorizationService.validarPertenenciaAlGrupo(grupoId, correo);

        ClasificacionSemanal clasificacion = clasificacionRepository
                .findByGrupoIdAndActivaTrue(grupoId)
                .orElseThrow(() -> new IllegalArgumentException("No hay clasificación activa en este grupo"));

        return puntajeMiembroRepository.findByClasificacionIdOrderByPuntosDesc(clasificacion.getId());
    }
}