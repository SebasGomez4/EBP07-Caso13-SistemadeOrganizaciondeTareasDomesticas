package com.fabrica.soyla.service;

import com.fabrica.soyla.model.AsignarTareaDTO;
import com.fabrica.soyla.model.MiembroDTO;
import com.fabrica.soyla.model.TareaDomestica;
import com.fabrica.soyla.repository.TareaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TareaService {

    @Autowired
    private TareaRepository tareaRepository;

    @Autowired
    private TareaCreationService tareaCreationService;

    @Autowired
    private TareaQueryService tareaQueryService;

    @Autowired
    private TareaDeletionService tareaDeletionService;

    @Autowired
    private TareaAssignmentService tareaAssignmentService;

    @Autowired
    private MiembroService miembroService;

    public TareaDomestica crearTarea(TareaDomestica tarea, String correoUsuario) {
        return tareaCreationService.crearTarea(tarea, correoUsuario);
    }

    public List<TareaDomestica> listarTareasPorGrupo(Long grupoId, String correoUsuario) {
        return tareaQueryService.listarTareasPorGrupo(grupoId, correoUsuario);
    }

    public void eliminarTarea(Long tareaId, String correoUsuario) {
        tareaDeletionService.eliminarTarea(tareaId, correoUsuario);
    }

    public TareaDomestica asignarTarea(AsignarTareaDTO dto, String correoUsuario) {
        return tareaAssignmentService.asignarTarea(dto, correoUsuario);
    }

    public List<MiembroDTO> obtenerMiembrosDisponibles(Long grupoId, String correoUsuario) {
        return miembroService.obtenerMiembrosDisponibles(grupoId, correoUsuario);
    }
}
