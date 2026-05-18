package com.fabrica.soyla.service;

import com.fabrica.soyla.model.MiembroDTO;
import com.fabrica.soyla.repository.GrupoFamiliarRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

/**
 * Servicio dedicado a GESTIÓN DE MIEMBROS.
 * Responsabilidad única: Operaciones sobre miembros de grupos.
 * 
 * Soluciona el antipatrón: GOD SERVICE (separación de responsabilidades)
 */
@Service
public class MiembroService {

    @Autowired
    private GrupoFamiliarRepository grupoFamiliarRepository;

    @Autowired
    private GrupoAuthorizationService authorizationService;

    public List<MiembroDTO> obtenerMiembrosDisponibles(Long grupoId, String correoUsuario) {
        authorizationService.validarPertenenciaAlGrupo(grupoId, correoUsuario);
        
        boolean esAdmin = authorizationService.esAdminDelGrupo(grupoId, correoUsuario);

        return grupoFamiliarRepository.findMiembrosByGrupoId(grupoId)
                .stream()
                .map(miembro -> {
                    MiembroDTO dto = new MiembroDTO();
                    dto.setNombre(miembro.getUsuario().getNombre());
                    dto.setRol(miembro.getRol());
                    if (esAdmin) {
                        dto.setCorreo(miembro.getUsuario().getCorreo());
                    }
                    return dto;
                })
                .toList();
    }
}
