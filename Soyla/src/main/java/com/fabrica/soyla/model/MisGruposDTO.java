package com.fabrica.soyla.model;

public class MisGruposDTO {

    private Long id;
    private String nombreGrupo;
    private String rolUsuario;
    private String nombreUsuario;

    public MisGruposDTO() {}

    public MisGruposDTO(Long id, String nombreGrupo, String rolUsuario, String nombreUsuario) {
        this.id = id;
        this.nombreGrupo = nombreGrupo;
        this.rolUsuario = rolUsuario;
        this.nombreUsuario = nombreUsuario;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombreGrupo() { return nombreGrupo; }
    public void setNombreGrupo(String nombreGrupo) { this.nombreGrupo = nombreGrupo; }

    public String getRolUsuario() { return rolUsuario; }
    public void setRolUsuario(String rolUsuario) { this.rolUsuario = rolUsuario; }

    public String getNombreUsuario() { return nombreUsuario; }
    public void setNombreUsuario(String nombreUsuario) { this.nombreUsuario = nombreUsuario; }
}
