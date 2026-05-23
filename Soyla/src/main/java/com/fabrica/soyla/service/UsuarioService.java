package com.fabrica.soyla.service;

import com.fabrica.soyla.model.EditarPerfilDTO;
import com.fabrica.soyla.model.PerfilDTO;
import com.fabrica.soyla.model.RegistroUsuarioDTO;
import com.fabrica.soyla.model.Usuario;
import com.fabrica.soyla.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.fabrica.soyla.config.JwtUtil;

@Service
public class UsuarioService {

    private static final long MAX_RESPONSE_TIME_MS = 3000;

@Autowired
private UsuarioRepository usuarioRepository;

@Autowired
private EmailService emailService;

@Autowired
private PasswordEncoder passwordEncoder;

@Autowired
private JwtUtil jwtUtil;

public Usuario registrarUsuario(RegistroUsuarioDTO dto) {
    long startTime = System.currentTimeMillis();

    if (usuarioRepository.existsByCorreo(dto.getCorreo())) {
        throw new IllegalArgumentException("Ya existe un usuario con ese correo");
    }

    Usuario usuario = new Usuario();
    usuario.setNombre(dto.getNombre());
    usuario.setCorreo(dto.getCorreo());
    usuario.setContrasena(passwordEncoder.encode(dto.getContrasena()));

    Usuario usuarioGuardado = usuarioRepository.save(usuario);

    // Generar token de confirmación de 24 horas y enviarlo
    long veinticuatroHoras = 1000L * 60 * 60 * 24;
    String confirmToken = jwtUtil.generarToken(usuarioGuardado.getCorreo(), veinticuatroHoras);
    emailService.enviarConfirmacionRegistro(usuarioGuardado.getCorreo(), usuarioGuardado.getNombre(), confirmToken);
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

    public PerfilDTO editarPerfil(Long id, EditarPerfilDTO dto, String correoAutenticado) {
        long startTime = System.currentTimeMillis();

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (!usuario.getCorreo().equals(correoAutenticado)) {
            throw new SecurityException("No tienes permiso para editar este perfil");
        }

        if (dto.getNombre() != null && !dto.getNombre().isBlank()) {
            usuario.setNombre(dto.getNombre());
        }

        if (dto.getCorreo() != null && !dto.getCorreo().isBlank()) {
            if (!dto.getCorreo().equals(usuario.getCorreo()) &&
                    usuarioRepository.existsByCorreo(dto.getCorreo())) {
                throw new IllegalArgumentException("Ya existe un usuario con ese correo");
            }
            usuario.setCorreo(dto.getCorreo());
        }

        if (dto.getTelefono() != null && !dto.getTelefono().isBlank()) {
            usuario.setTelefono(dto.getTelefono());
        }

        if (dto.getFotoPerfil() != null && !dto.getFotoPerfil().isBlank()) {
            usuario.setFotoPerfil(dto.getFotoPerfil());
        }

        if (dto.getContrasena() != null && !dto.getContrasena().isBlank()) {
            usuario.setContrasena(passwordEncoder.encode(dto.getContrasena()));
        }

        Usuario actualizado = usuarioRepository.save(usuario);

        long elapsedTime = System.currentTimeMillis() - startTime;
        if (elapsedTime > MAX_RESPONSE_TIME_MS) {
            throw new IllegalStateException(
                    "El tiempo de respuesta excedió el límite máximo de 3 segundos. " +
                    "Tiempo utilizado: " + elapsedTime + "ms"
            );
        }

        return new PerfilDTO(actualizado.getNombre(), actualizado.getCorreo(), actualizado.getFotoPerfil());
    }
}
