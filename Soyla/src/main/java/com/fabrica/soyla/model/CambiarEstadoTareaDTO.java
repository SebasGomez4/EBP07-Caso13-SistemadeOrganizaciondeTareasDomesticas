package com.fabrica.soyla.model;

public class CambiarEstadoTareaDTO {

    private String nuevoEstado;

    public CambiarEstadoTareaDTO() {}

    public CambiarEstadoTareaDTO(String nuevoEstado) {
        this.nuevoEstado = nuevoEstado;
    }

    public String getNuevoEstado() { return nuevoEstado; }
    public void setNuevoEstado(String nuevoEstado) { this.nuevoEstado = nuevoEstado; }
}
