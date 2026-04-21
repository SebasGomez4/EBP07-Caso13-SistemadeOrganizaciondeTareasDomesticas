package com.fabrica.soyla.service;

import com.fabrica.soyla.config.JwtUtil;
import com.fabrica.soyla.model.CrearGrupoDTO;
import com.fabrica.soyla.model.GrupoFamiliar;
import com.fabrica.soyla.model.GrupoMiembro;
import com.fabrica.soyla.model.Usuario;
import com.fabrica.soyla.repository.GrupoFamiliarRepository;
import com.fabrica.soyla.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}