package com.fabrica.soyla.controller;

import com.fabrica.soyla.model.PerfilDTO;
import com.fabrica.soyla.model.RegistroUsuarioDTO;
import com.fabrica.soyla.model.Usuario;
import com.fabrica.soyla.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @PostMapping("/registrar")
    public ResponseEntity<Usuario> registrarUsuario(@Valid @RequestBody RegistroUsuarioDTO dto) {
        Usuario nuevo = usuarioService.registrarUsuario(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevo);
    }

    @GetMapping("/perfil/{id}")
    public ResponseEntity<PerfilDTO> obtenerPerfil(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String correo = (String) auth.getPrincipal();

        Usuario usuarioAutenticado = usuarioService.obtenerUsuarioPorCorreo(correo);

        if (!usuarioAutenticado.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build(); // Contenido no autorizado
        }

        PerfilDTO perfil = usuarioService.obtenerPerfil(correo);
        return ResponseEntity.ok(perfil);
    }
}