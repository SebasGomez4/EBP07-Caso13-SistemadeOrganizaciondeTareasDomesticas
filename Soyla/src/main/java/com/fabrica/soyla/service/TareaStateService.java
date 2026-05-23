package com.fabrica.soyla.service;

import com.fabrica.soyla.model.GrupoMiembro;
import com.fabrica.soyla.model.TareaDomestica;
import com.fabrica.soyla.model.Usuario;
import com.fabrica.soyla.repository.TareaRepository;
import com.fabrica.soyla.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
public class TareaStateService {

    @Autowired
    private TareaRepository tareaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private GrupoAuthorizationService authorizationService;

    @Autowired
    private NotificacionService notificacionService;

    @Transactional
    public TareaDomestica cambiarEstado(Long tareaId, String nuevoEstado, String correoUsuario) {
        TareaDomestica tarea = tareaRepository.findById(tareaId)
                .orElseThrow(() -> new IllegalArgumentException("Tarea no encontrada"));

        Usuario usuario = usuarioRepository.findByCorreo(correoUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        GrupoMiembro miembro = authorizationService.obtenerMiembroEnGrupo(tarea.getGrupo().getId(), correoUsuario);

        boolean esResponsable = tarea.getResponsable() != null && Objects.equals(tarea.getResponsable().getId(), usuario.getId());
        boolean esAdmin = "ADMIN".equals(miembro.getRol());

        if (!esResponsable && !esAdmin) {
            throw new SecurityException("Solo el responsable o un admin puede cambiar el estado");
        }

        String estadoActual = tarea.getEstado() != null ? tarea.getEstado() : "SIN_EMPEZAR";

        if (!esTransicionValida(estadoActual, nuevoEstado)) {
            throw new IllegalArgumentException("No se puede cambiar de " + estadoActual + " a " + nuevoEstado);
        }

        tarea.setEstado(nuevoEstado);
        TareaDomestica saved = tareaRepository.saveAndFlush(tarea);

        String mensaje = "El estado de la tarea '" + tarea.getNombre() + "' cambió a " + nuevoEstado;
        tarea.getGrupo().getMiembros().forEach(gm ->
                notificacionService.crearNotificacion(gm.getUsuario(), mensaje, "CAMBIO_ESTADO")
        );

        return saved;
    }

    private boolean esTransicionValida(String estadoActual, String nuevoEstado) {
        if (estadoActual.equals(nuevoEstado)) {
            return false;
        }
        if ("VENCIDA".equals(estadoActual)) {
            return false;
        }
        if ("EN_PROGRESO".equals(estadoActual) && "SIN_EMPEZAR".equals(nuevoEstado)) {
            return false;
        }
        // Permitir otras transiciones: SIN_EMPEZAR->EN_PROGRESO, SIN_EMPEZAR->COMPLETADA,
        // EN_PROGRESO->COMPLETADA, COMPLETADA->EN_PROGRESO
        return true;
    }
}
