package com.fabrica.soyla.service;

import com.fabrica.soyla.config.JwtUtil;
import com.fabrica.soyla.model.CrearGrupoDTO;
import com.fabrica.soyla.model.GrupoFamiliar;
import com.fabrica.soyla.model.GrupoMiembro;
import com.fabrica.soyla.model.MiembroDTO;
import com.fabrica.soyla.model.Usuario;
import com.fabrica.soyla.repository.GrupoFamiliarRepository;
import com.fabrica.soyla.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class GrupoFamiliarService {

    @Autowired
    private GrupoFamiliarRepository grupoFamiliarRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private GrupoAuthorizationService authorizationService;

    @Transactional
    public GrupoFamiliar crearGrupo(CrearGrupoDTO dto, String token) {
        String correo = jwtUtil.extraerCorreo(token);
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        GrupoFamiliar grupo = new GrupoFamiliar();
        grupo.setNombre(dto.getNombre());
        
        // Guardar primero el grupo SIN miembros
        GrupoFamiliar grupoGuardado = grupoFamiliarRepository.save(grupo);

        // Luego crear y agregar el miembro
        GrupoMiembro miembro = new GrupoMiembro();
        miembro.setUsuario(usuario);
        miembro.setRol("ADMIN");
        miembro.setGrupo(grupoGuardado);
        
        grupoGuardado.getMiembros().add(miembro);
        
        return grupoFamiliarRepository.save(grupoGuardado);
    }

    public List<MiembroDTO> obtenerMiembros(Long grupoId, String token) {
        String correo = jwtUtil.extraerCorreo(token);
        
        authorizationService.validarPertenenciaAlGrupo(grupoId, correo);
        
        GrupoFamiliar grupo = grupoFamiliarRepository.findById(grupoId)
                .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado"));

        boolean esAdmin = authorizationService.esAdminDelGrupo(grupoId, correo);

        return grupo.getMiembros().stream().map(miembro -> {
            MiembroDTO dto = new MiembroDTO();
            dto.setNombre(miembro.getUsuario().getNombre());
            dto.setRol(miembro.getRol());
            if (esAdmin) {
                dto.setCorreo(miembro.getUsuario().getCorreo());
            }
            return dto;
        }).toList();
    }

    public List<GrupoFamiliar> obtenerMisGrupos(String correo) {
        return grupoFamiliarRepository.findGruposByUsuarioCorreo(correo);
    }
}