package com.fabrica.soyla.service;

import com.fabrica.soyla.model.TareaDomestica;
import com.fabrica.soyla.repository.TareaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class TareaVencidaService {

    @Autowired
    private TareaRepository tareaRepository;

    @Autowired
    private NotificacionService notificacionService;

    @Scheduled(fixedDelay = 30000)
    public void marcarTareasVencidas() {
        LocalDate hoy = LocalDate.now();
        List<String> estadosExcluidos = List.of("COMPLETADA", "VENCIDA");
        List<TareaDomestica> tareas = tareaRepository.findTareasVencidasPorEstadoYFecha(estadosExcluidos, hoy);
        if (tareas.isEmpty()) {
            return;
        }
        for (TareaDomestica tarea : tareas) {
            tarea.setEstado("VENCIDA");
            if (tarea.getResponsable() != null) {
                String mensaje = "La tarea '" + tarea.getNombre() + "' ha vencido y fue marcada como VENCIDA.";
                notificacionService.crearNotificacion(tarea.getResponsable(), mensaje, "VENCIDA");
            }
        }
        tareaRepository.saveAll(tareas);
    }
}
