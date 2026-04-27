package com.fabrica.soyla.service;

import com.fabrica.soyla.model.AsignarTareaDTO;
import com.fabrica.soyla.model.GrupoFamiliar;
import com.fabrica.soyla.model.GrupoMiembro;
import com.fabrica.soyla.model.MiembroDTO;
import com.fabrica.soyla.model.TareaDomestica;
import com.fabrica.soyla.model.Usuario;
import com.fabrica.soyla.repository.GrupoFamiliarRepository;
import com.fabrica.soyla.repository.TareaRepository;
import com.fabrica.soyla.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class TareaService {

    private static final long MAX_RESPONSE_TIME_MS = 3000; // 3 segundos

    @Autowired
    private TareaRepository tareaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private GrupoFamiliarRepository grupoFamiliarRepository;

    @Transactional
public TareaDomestica crearTarea(TareaDomestica tarea, String correoUsuario) {
    if (tarea.getGrupo() == null || tarea.getGrupo().getId() == null) {
        throw new IllegalArgumentException("El grupo es obligatorio");
    }

    grupoFamiliarRepository.findMiembroEnGrupo(tarea.getGrupo().getId(), correoUsuario)
            .orElseThrow(() -> new IllegalStateException("No perteneces a este grupo familiar"));

    GrupoFamiliar grupo = grupoFamiliarRepository.findById(tarea.getGrupo().getId())
            .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado"));

    tarea.setId(null);
    tarea.setGrupo(grupo);
    tarea.setEstado(tarea.getEstado() != null ? tarea.getEstado() : "SIN_EMPEZAR");

    return tareaRepository.saveAndFlush(tarea);
}

public List<TareaDomestica> listarTareasPorGrupo(Long grupoId, String correoUsuario) {
    long startTime = System.currentTimeMillis();

    grupoFamiliarRepository.findMiembroEnGrupo(grupoId, correoUsuario)
            .orElseThrow(() -> new IllegalStateException("No perteneces a este grupo familiar"));

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

    @Transactional
    public void eliminarTarea(Long tareaId, String correoUsuario) {
        long startTime = System.currentTimeMillis();

        Usuario usuario = usuarioRepository.findByCorreo(correoUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (!esMiembroDeGrupo(usuario.getId())) {
            throw new IllegalStateException("Usuario no autorizado para eliminar tareas");
        }

        TareaDomestica tarea = tareaRepository.findById(tareaId)
                .orElseThrow(() -> new IllegalArgumentException("Tarea doméstica no encontrada"));

        tareaRepository.delete(tarea);

        long elapsedTime = System.currentTimeMillis() - startTime;
        if (elapsedTime > MAX_RESPONSE_TIME_MS) {
            throw new IllegalStateException(
                    "El tiempo de respuesta para eliminar la tarea excedió el límite máximo de 3 segundos. " +
                    "Tiempo utilizado: " + elapsedTime + "ms"
            );
        }
    }

    private boolean esMiembroDeGrupo(Long usuarioId) {
        return grupoFamiliarRepository.findAll().stream()
                .flatMap(grupo -> grupo.getMiembros().stream())
                .anyMatch(miembro -> miembro.getUsuario().getId().equals(usuarioId));
    }
    @Transactional
    public TareaDomestica asignarTarea(AsignarTareaDTO dto, String correoUsuario) {

        // Verificar que quien asigna pertenece al grupo
        GrupoMiembro miembroAsignador = grupoFamiliarRepository
                .findMiembroEnGrupo(dto.getGrupoId(), correoUsuario)
                .orElseThrow(() -> new IllegalStateException("No perteneces a este grupo familiar"));

        // Verificar que el responsable también pertenece al grupo
        GrupoMiembro miembroResponsable = grupoFamiliarRepository
                .findMiembroEnGrupoPorUsuarioId(dto.getGrupoId(), dto.getResponsableId())
                .orElseThrow(() -> new IllegalStateException("El miembro seleccionado no pertenece a este grupo familiar"));

        // Obtener la tarea
        TareaDomestica tarea = tareaRepository.findById(dto.getTareaId())
                .orElseThrow(() -> new IllegalArgumentException("Tarea no encontrada"));

        // Asignar el responsable
        tarea.setResponsable(miembroResponsable.getUsuario());
        return tareaRepository.saveAndFlush(tarea);
    }

    public List<MiembroDTO> obtenerMiembrosDisponibles(Long grupoId, String correoUsuario) {

    // Verificar que quien consulta pertenece al grupo
    GrupoMiembro miembroActual = grupoFamiliarRepository
            .findMiembroEnGrupo(grupoId, correoUsuario)
            .orElseThrow(() -> new IllegalStateException("No perteneces a este grupo familiar"));

    boolean esAdmin = miembroActual.getRol().equals("ADMIN");

    // Retornar miembros del grupo
    return grupoFamiliarRepository.findMiembrosByGrupoId(grupoId)
            .stream().map(miembro -> {
                MiembroDTO dto = new MiembroDTO();
                dto.setNombre(miembro.getUsuario().getNombre());
                dto.setRol(miembro.getRol());
                if (esAdmin) {
                    dto.setCorreo(miembro.getUsuario().getCorreo());
                }
                return dto;
            }).toList();
}
}