package com.fabrica.soyla.controller;

import com.fabrica.soyla.model.LoginDTO;
import com.fabrica.soyla.model.LoginResponseDTO;
import com.fabrica.soyla.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginDTO dto) {
        LoginResponseDTO response = authService.login(dto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.replace("Bearer ", "");
        }
        
        if (auth != null && auth.isAuthenticated()) {
            String correo = (String) auth.getPrincipal();
            authService.logout(correo, token);
        }
        
        // Limpiar el contexto de seguridad
        SecurityContextHolder.clearContext();
        
        return ResponseEntity.ok("Sesión cerrada exitosamente");
    }
}