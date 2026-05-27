package com.fabrica.soyla.service;

import com.fabrica.soyla.config.JwtUtil;
import com.fabrica.soyla.model.CrearGrupoDTO;
import com.fabrica.soyla.model.GrupoFamiliar;
import com.fabrica.soyla.model.GrupoMiembro;
import com.fabrica.soyla.model.MiembroDTO;
import com.fabrica.soyla.model.MisGruposDTO;
import com.fabrica.soyla.model.Usuario;
import com.fabrica.soyla.repository.GrupoFamiliarRepository;
import com.fabrica.soyla.repository.InvitacionGrupoRepository;
import com.fabrica.soyla.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import com.fabrica.soyla.repository.TareaRepository;



@Service
public class GrupoFamiliarService {

    @Autowired
    private InvitacionGrupoRepository invitacionGrupoRepository;

    @Autowired
    private TareaRepository tareaRepository;

    @Autowired
    private GrupoAuthorizationService grupoAuthorizationService;

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
    public List<MisGruposDTO> obtenerMisGrupos(String correo) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        
        List<GrupoFamiliar> grupos = grupoFamiliarRepository.findGruposByUsuarioCorreo(correo);
        
        return grupos.stream().map(grupo -> {
            // Buscar el miembro para obtener el rol
            GrupoMiembro miembro = grupo.getMiembros().stream()
                    .filter(m -> m.getUsuario().getCorreo().equals(correo))
                    .findFirst()
                    .orElse(null);
            
            String rol = miembro != null ? miembro.getRol() : "MEMBER";
            return new MisGruposDTO(grupo.getId(), grupo.getNombre(), rol, usuario.getNombre());
        }).toList();
    }

    @Transactional
    public void eliminarGrupo(Long grupoId, String correoUsuario) {
    long startTime = System.currentTimeMillis();

    // Escenario 3: Validar que el usuario es ADMIN
    if (!grupoAuthorizationService.esAdminDelGrupo(grupoId, correoUsuario)) {
        throw new IllegalStateException(
            "Solo el administrador tiene permiso para eliminar el grupo");
    }

    // Verificar que el grupo existe
    GrupoFamiliar grupo = grupoFamiliarRepository.findById(grupoId)
            .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado"));

    
    // Eliminar invitaciones asociadas al grupo
    invitacionGrupoRepository.deleteByGrupoId(grupoId);

    // Escenario 1: Eliminar el grupo
    grupoFamiliarRepository.delete(grupo);

    // Escenario 4: Eliminar tareas pendientes asociadas al grupo
    tareaRepository.deleteByGrupoId(grupoId);

    // Escenario 1: Eliminar el grupo (miembros se eliminan por CascadeType.ALL)
    grupoFamiliarRepository.delete(grupo);

    // Escenario 5: Verificar tiempo de respuesta
    long elapsedTime = System.currentTimeMillis() - startTime;
    if (elapsedTime > 3000) {
        throw new IllegalStateException(
            "El tiempo de respuesta excedió el límite máximo de 3 segundos. " +
            "Tiempo utilizado: " + elapsedTime + "ms");
    }
    }
    
    @Transactional
    public void abandonarGrupo(Long grupoId, String correo) {
        long startTime = System.currentTimeMillis();

        GrupoMiembro miembro = grupoFamiliarRepository.findMiembroEnGrupo(grupoId, correo)
                .orElseThrow(() -> new IllegalArgumentException("No perteneces a este grupo"));

        GrupoFamiliar grupo = grupoFamiliarRepository.findById(grupoId)
                .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado"));

        // Si es el único miembro, elimina el grupo completo
        if (grupo.getMiembros().size() == 1) {
            eliminarGrupo(grupoId, correo);
            return;
        }

        // Si es admin y es el único admin, no puede abandonar
        if (miembro.getRol().equals("ADMIN")) {
            long totalAdmins = grupoFamiliarRepository.countAdminsByGrupoId(grupoId);
            if (totalAdmins <= 1) {
                throw new IllegalStateException("Debes transferir la administración antes de abandonar el grupo");
            }
        }

        grupo.getMiembros().remove(miembro);
        grupoFamiliarRepository.save(grupo);

        long elapsedTime = System.currentTimeMillis() - startTime;
        if (elapsedTime > 2000) {
            throw new IllegalStateException(
                    "El tiempo de respuesta excedió el límite máximo de 2 segundos. " +
                    "Tiempo utilizado: " + elapsedTime + "ms"
            );
        }
    }
}