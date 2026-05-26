package com.fabrica.soyla.service;

import com.fabrica.soyla.model.TareaDomestica;
import com.fabrica.soyla.repository.TareaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

/**
 * Servicio responsable de detectar tareas próximas a vencer
 * y enviar alertas a los responsables.
 * 
 * Responsabilidad única: Monitoreo y emisión de alertas de vencimiento.
 * Separado de NotificacionService para respetar SRP (Single Responsibility Principle).
 */
@Service
public class AlertaTareaService {

    private static final int DIAS_ANTICIPACION = 2;
    private static final List<String> ESTADOS_EXCLUIDOS = List.of("COMPLETADA", "CANCELADA");

    @Autowired
    private TareaRepository tareaRepository;

    @Autowired
    private NotificacionService notificacionService;

    /**
     * Escenario 1 y 2: Se ejecuta cada hora para detectar tareas próximas a vencer.
     * Solo envía alertas cuando la tarea está dentro del rango de anticipación.
     * Escenario 3: SSE garantiza entrega en tiempo real al dispositivo del usuario.
     */
    @Scheduled(fixedRate = 3600000) // cada hora
    public void verificarTareasProximasAVencer() {
        LocalDate hoy = LocalDate.now();
        LocalDate limite = hoy.plusDays(DIAS_ANTICIPACION);

        List<TareaDomestica> tareasProximas = tareaRepository
                .findTareasProximasAVencer(hoy, limite, ESTADOS_EXCLUIDOS);

        for (TareaDomestica tarea : tareasProximas) {
            enviarAlerta(tarea);
        }
    }

    private void enviarAlerta(TareaDomestica tarea) {
        if (tarea.getResponsable() == null) return;

        long diasRestantes = java.time.temporal.ChronoUnit.DAYS
                .between(LocalDate.now(), tarea.getFechaVencimiento());

        String mensaje = diasRestantes == 0
                ? "⚠️ La tarea \"" + tarea.getNombre() + "\" vence HOY."
                : "⏰ La tarea \"" + tarea.getNombre() + "\" vence en " + diasRestantes + " día(s).";

        notificacionService.crearNotificacion(
                tarea.getResponsable(),
                mensaje,
                "RECORDATORIO"
        );
    }

    /**
     * Método para ejecutar la verificación manualmente desde el controller.
     * Útil para pruebas sin esperar el scheduler.
     */
    public void verificarManualmente() {
        verificarTareasProximasAVencer();
    }
}