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

    @Transactional
    public GrupoFamiliar crearGrupo(CrearGrupoDTO dto, String token) {

        String correo = jwtUtil.extraerCorreo(token);
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        GrupoMiembro miembro = new GrupoMiembro();
        miembro.setUsuario(usuario);
        miembro.setRol("ADMIN");

        GrupoFamiliar grupo = new GrupoFamiliar();
        grupo.setNombre(dto.getNombre());
        grupo.getMiembros().add(miembro);
        miembro.setGrupo(grupo);

        return grupoFamiliarRepository.save(grupo);
    }       

    public List<MiembroDTO> obtenerMiembros(Long grupoId, String token) {

    // Validar que el token es válido y extraer el correo
    String correo = jwtUtil.extraerCorreo(token);

    // Verificar que el usuario pertenece al grupo
    GrupoMiembro miembroActual = grupoFamiliarRepository
            .findMiembroEnGrupo(grupoId, correo)
            .orElseThrow(() -> new IllegalArgumentException("No perteneces a este grupo"));

    // Obtener el grupo
    GrupoFamiliar grupo = grupoFamiliarRepository.findById(grupoId)
            .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado"));

    boolean esAdmin = miembroActual.getRol().equals("ADMIN");

    // Construir la lista de miembros según el rol
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
    List<GrupoFamiliar> grupos = grupoFamiliarRepository.findGruposByUsuarioCorreo(correo);
    return grupos;
}
}