package com.fabrica.soyla.config;

import com.fabrica.soyla.model.Usuario;
import com.fabrica.soyla.repository.UsuarioRepository;
import com.fabrica.soyla.service.InactivityTrackingService;
import com.fabrica.soyla.service.TokenBlacklistService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private InactivityTrackingService inactivityTrackingService;

    @Autowired
    private TokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        System.out.println("=== JWT FILTER ===");
        System.out.println("METHOD: " + request.getMethod());
        System.out.println("URI: " + request.getRequestURI());
        System.out.println("AUTH HEADER: " + request.getHeader("Authorization"));

        // Agregar headers anti-caché
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.replace("Bearer ", "");

            // Verificar si el token está en la blacklist
            if (tokenBlacklistService.estaEnLista(token)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Sesión expirada. Por favor, inicie sesión nuevamente");
                return;
            }

            if (jwtUtil.validarToken(token)) {
                String correo = jwtUtil.extraerCorreo(token);
                Usuario usuario = usuarioRepository.findByCorreo(correo).orElse(null);

                if (usuario != null) {
                    // Verificar si la sesión ha expirado por inactividad
                    if (inactivityTrackingService.validarActividad(correo)) {
                        // Actualizar la última actividad
                        inactivityTrackingService.registrarActividad(correo);

                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(correo, null, List.of());
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    } else {
                        // Sesión expirada por inactividad
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.getWriter().write("Sesión expirada por inactividad");
                        return;
                    }
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}

