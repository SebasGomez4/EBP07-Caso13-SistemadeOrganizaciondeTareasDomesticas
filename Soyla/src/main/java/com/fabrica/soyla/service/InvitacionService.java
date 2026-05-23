package com.fabrica.soyla.service;

import com.fabrica.soyla.model.GrupoFamiliar;
import com.fabrica.soyla.model.GrupoMiembro;
import com.fabrica.soyla.model.InvitacionGrupo;
import com.fabrica.soyla.model.Usuario;
import com.fabrica.soyla.repository.GrupoFamiliarRepository;
import com.fabrica.soyla.repository.InvitacionGrupoRepository;
import com.fabrica.soyla.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class InvitacionService {

    private static final long MAX_RESPONSE_TIME_MS = 3000; // 3 segundos
    private static final int TOKEN_LENGTH_BYTES = 32; // 256 bits de entropía (> 128 bits requeridos)
    private static final long EXPIRATION_HOURS = 72; // 72 horas

    @Autowired
    private InvitacionGrupoRepository invitacionGrupoRepository;

    @Autowired
    private GrupoFamiliarRepository grupoFamiliarRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;


    public InvitacionGrupo generarInvitacion(Long grupoId) {
        long startTime = System.currentTimeMillis();

        GrupoFamiliar grupo = grupoFamiliarRepository.findById(grupoId)
                .orElseThrow(() -> new IllegalArgumentException("Grupo familiar no encontrado"));

        // Generar token seguro
        String token = generarTokenSeguro();

        // Calcular fecha de expiración
        LocalDateTime fechaExpiracion = LocalDateTime.now().plusHours(EXPIRATION_HOURS);

        InvitacionGrupo invitacion = new InvitacionGrupo(grupo, token, fechaExpiracion);
        InvitacionGrupo invitacionGuardada = invitacionGrupoRepository.save(invitacion);

        long elapsedTime = System.currentTimeMillis() - startTime;
        if (elapsedTime > MAX_RESPONSE_TIME_MS) {
            throw new IllegalStateException(
                    "El tiempo de generación de la invitación excedió el límite máximo de 3 segundos. " +
                    "Tiempo utilizado: " + elapsedTime + "ms"
            );
        }

        return invitacionGuardada;
    }

    public void aceptarInvitacion(String token, String correoUsuario) {
        long startTime = System.currentTimeMillis();

        InvitacionGrupo invitacion = invitacionGrupoRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Enlace de invitación no válido"));

        // Verificar si la invitación está expirada
        if (invitacion.estaExpirada()) {
            throw new IllegalStateException("El enlace de invitación ya ha expirado");
        }

        // Verificar si ya fue usada
        if (invitacion.getUsado()) {
            throw new IllegalStateException("El enlace de invitación ya ha sido utilizado");
        }

        Usuario usuario = usuarioRepository.findByCorreo(correoUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        GrupoFamiliar grupo = invitacion.getGrupo();

        // Verificar si el usuario ya es miembro del grupo
        boolean yaEsMiembro = grupo.getMiembros().stream()
                .anyMatch(miembro -> miembro.getUsuario().getId().equals(usuario.getId()));

        if (yaEsMiembro) {
            throw new IllegalStateException("Ya perteneces a este grupo familiar");
        }

        // Agregar usuario al grupo
        GrupoMiembro miembro = new GrupoMiembro();
        miembro.setUsuario(usuario);
        miembro.setGrupo(grupo);
        miembro.setRol("MEMBER");

        grupo.getMiembros().add(miembro);
        grupoFamiliarRepository.save(grupo);

        // Marcar invitación como usada
        invitacion.setUsado(true);
        invitacionGrupoRepository.save(invitacion);

        long elapsedTime = System.currentTimeMillis() - startTime;
        if (elapsedTime > MAX_RESPONSE_TIME_MS) {
            throw new IllegalStateException(
                    "El tiempo de procesamiento de la invitación excedió el límite máximo de 3 segundos. " +
                    "Tiempo utilizado: " + elapsedTime + "ms"
            );
        }
    }

    private String generarTokenSeguro() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[TOKEN_LENGTH_BYTES];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public InvitacionGrupo obtenerInvitacion(String token) {
        return invitacionGrupoRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Enlace de invitación no encontrado"));
    }
}
