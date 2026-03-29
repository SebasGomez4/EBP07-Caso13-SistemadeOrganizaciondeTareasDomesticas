package com.fabrica.soyla.service;

import com.fabrica.soyla.model.TareaDomestica;
import com.fabrica.soyla.repository.TareaRepository;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TareaService {

    @Autowired
    private TareaRepository tareaRepository;

    @Transactional
    public TareaDomestica crearTarea(TareaDomestica tarea) {
        if(tarea.getFechaVencimiento().isBefore(LocalDate.now())){
            throw new IllegalArgumentException("La fecha de vencimiento debe ser posterior a la actual.");
        }
        tarea.setId(null); 
        return tareaRepository.saveAndFlush(tarea);
    }
}