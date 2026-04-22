package com.fabrica.soyla.service;

import com.fabrica.soyla.model.PerfilDTO;
import com.fabrica.soyla.model.RegistroUsuarioDTO;
import com.fabrica.soyla.model.Usuario;
import com.fabrica.soyla.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {

    private static final long MAX_RESPONSE_TIME_MS = 3000; // 3 segundos

    @Autowired
    private UsuarioRepository usuarioRepository;

    public Usuario registrarUsuario(RegistroUsuarioDTO dto) {
        long startTime = System.currentTimeMillis();

        if (usuarioRepository.existsByCorreo(dto.getCorreo())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese correo");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(dto.getNombre());
        usuario.setCorreo(dto.getCorreo());
        usuario.setContrasena(dto.getContrasena());

        Usuario usuarioGuardado = usuarioRepository.save(usuario);

        long elapsedTime = System.currentTimeMillis() - startTime;
        if (elapsedTime > MAX_RESPONSE_TIME_MS) {
            throw new IllegalStateException(
                    "El tiempo de registro excedió el límite máximo de 3 segundos. " +
                    "Tiempo utilizado: " + elapsedTime + "ms"
            );
        }

        return usuarioGuardado;
    }

    public PerfilDTO obtenerPerfil(String correo) {
        long startTime = System.currentTimeMillis();

        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        PerfilDTO perfil = new PerfilDTO(usuario.getNombre(), usuario.getCorreo(), usuario.getFotoPerfil());

        long elapsedTime = System.currentTimeMillis() - startTime;
        if (elapsedTime > MAX_RESPONSE_TIME_MS) {
            throw new IllegalStateException(
                    "El tiempo de respuesta excedió el límite máximo de 3 segundos. " +
                    "Tiempo utilizado: " + elapsedTime + "ms"
            );
        }

        return perfil;
    }

    public Usuario obtenerUsuarioPorCorreo(String correo) {
        return usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }
}
