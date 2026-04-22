package com.fabrica.soyla.service;

import com.fabrica.soyla.model.GrupoFamiliar;
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
    public TareaDomestica crearTarea(TareaDomestica tarea) {
        if (tarea.getFechaVencimiento().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("La fecha de vencimiento debe ser posterior a la actual.");
        }
        tarea.setId(null);
        return tareaRepository.saveAndFlush(tarea);
    }

    public List<TareaDomestica> listarTareasVigentes() {
        return tareaRepository.findByFechaVencimientoGreaterThanEqual(LocalDate.now());
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
}