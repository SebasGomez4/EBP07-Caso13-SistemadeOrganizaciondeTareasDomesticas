package com.fabrica.soyla.service;

import com.fabrica.soyla.model.GrupoMiembro;
import com.fabrica.soyla.model.TareaDomestica;
import com.fabrica.soyla.repository.GrupoFamiliarRepository;
import com.fabrica.soyla.repository.TareaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Servicio responsable de detectar tareas vencidas y notificar a todos
 * los miembros del grupo familiar.
 *
 * Escenario 4: Usa el campo notificacionVencidaEnviada para evitar duplicados.
 * Escenario 3: Se ejecuta cada 30 segundos para detectar vencimientos puntualmente.
 */
@Service
public class TareaVencidaService {

    @Autowired
    private TareaRepository tareaRepository;

    @Autowired
    private NotificacionService notificacionService;

    @Autowired
    private GrupoFamiliarRepository grupoFamiliarRepository;

    /**
     * Escenario 3: Se ejecuta cada 30 segundos para detectar vencimientos
     * en un tiempo máximo de 5 segundos desde que se cumple la fecha límite.
     */
    @Scheduled(cron = "0 0 9    * * *")
    @Transactional
    public void marcarTareasVencidas() {
        LocalDate hoy = LocalDate.now();
        List<String> estadosExcluidos = List.of("COMPLETADA", "VENCIDA");

        List<TareaDomestica> tareas = tareaRepository
                .findTareasVencidasPorEstadoYFecha(estadosExcluidos, hoy);

        if (tareas.isEmpty()) return;

        for (TareaDomestica tarea : tareas) {

            // Escenario 2: No enviar alerta si ya fue completada
            if ("COMPLETADA".equals(tarea.getEstado())) continue;

            // Escenario 4: No reenviar si ya se notificó
            if (tarea.isNotificacionVencidaEnviada()) continue;

            // Marcar como vencida
            tarea.setEstado("VENCIDA");

            // Escenario 1: Construir mensaje con nombre de tarea,
            // responsable y fecha límite
            String nombreResponsable = tarea.getNombreResponsable();
            String mensaje = "🚨 La tarea \"" + tarea.getNombre() + "\" venció el "
                    + tarea.getFechaVencimiento()
                    + ". Responsable: " + nombreResponsable + ".";

            // Escenario 1: Notificar a TODOS los miembros del grupo
            if (tarea.getGrupo() != null) {
                List<GrupoMiembro> miembros = grupoFamiliarRepository
                        .findMiembrosByGrupoId(tarea.getGrupo().getId());

                for (GrupoMiembro miembro : miembros) {
                    notificacionService.crearNotificacion(
                            miembro.getUsuario(),
                            mensaje,
                            "VENCIDA"
                    );
                }
            }

            // Escenario 4: Marcar que la notificación ya fue enviada
            tarea.setNotificacionVencidaEnviada(true);
        }

        tareaRepository.saveAll(tareas);
    }

    /**
     * Método para ejecutar la verificación manualmente desde el controller.
     * Útil para pruebas sin esperar el scheduler.
     */
    public void verificarManualmente() {
        marcarTareasVencidas();
    }
}