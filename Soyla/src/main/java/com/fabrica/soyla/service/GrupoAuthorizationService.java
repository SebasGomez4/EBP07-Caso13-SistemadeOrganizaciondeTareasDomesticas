package com.fabrica.soyla.service;

import com.fabrica.soyla.model.GrupoMiembro;
import com.fabrica.soyla.repository.GrupoFamiliarRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Servicio centralizado para VALIDACIÓN DE AUTORIZACIÓN.
 * 
 * Responsabilidad única: Verificar pertenencia a grupos y roles.
 * 
 * Beneficio: Un único lugar donde cambiar la lógica de autorización.
 * Si necesitas agregar logs, métricas, o cambiar la excepción,
 * cambias AQUÍ y se refleja en todos los servicios que lo usan.
 * 
 * Soluciona el antipatron: LÓGICA REPETIDA DE VALIDACIÓN (DRY - Don't Repeat Yourself)
 */
@Service
public class GrupoAuthorizationService {

    @Autowired
    private GrupoFamiliarRepository grupoFamiliarRepository;

    //Valida que un usuario pertenece a un grupo.
    public void validarPertenenciaAlGrupo(Long grupoId, String correoUsuario) {
        grupoFamiliarRepository.findMiembroEnGrupo(grupoId, correoUsuario)
                .orElseThrow(() -> new IllegalStateException(
                    "No perteneces a este grupo familiar"));
    }

    // Obtiene el miembro del usuario en el grupo.
    public GrupoMiembro obtenerMiembroEnGrupo(Long grupoId, String correoUsuario) {
        return grupoFamiliarRepository.findMiembroEnGrupo(grupoId, correoUsuario)
                .orElseThrow(() -> new IllegalStateException(
                    "No perteneces a este grupo familiar"));
    }

    
    //Valida que el usuario es administrador del grupo.
    public boolean esAdminDelGrupo(Long grupoId, String correoUsuario) {
        GrupoMiembro miembro = obtenerMiembroEnGrupo(grupoId, correoUsuario);
        return "ADMIN".equals(miembro.getRol());
    }

    //Obtiene el rol del usuario en el grupo.
    public String obtenerRolEnGrupo(Long grupoId, String correoUsuario) {
        return obtenerMiembroEnGrupo(grupoId, correoUsuario).getRol();
    }
}
