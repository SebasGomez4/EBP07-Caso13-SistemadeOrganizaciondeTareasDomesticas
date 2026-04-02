package com.fabrica.soyla.service;

import com.fabrica.soyla.config.JwtUtil;
import com.fabrica.soyla.model.LoginDTO;
import com.fabrica.soyla.model.Usuario;
import com.fabrica.soyla.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtUtil jwtUtil;

    public String login(LoginDTO dto) {
        Usuario usuario = usuarioRepository.findByCorreo(dto.getCorreo())
                .orElseThrow(() -> new IllegalArgumentException("Correo o contraseña incorrectos"));

        if (!usuario.getContrasena().equals(dto.getContrasena())) {
            throw new IllegalArgumentException("Correo o contraseña incorrectos");
        }

        return jwtUtil.generarToken(usuario.getCorreo());
    }
}