package com.fabrica.soyla.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RankingDTO {
    private int posicion;
    private String nombre;
    private Integer puntos;
    private Integer metaPuntos;
    private double progreso; // porcentaje hacia la meta
    private String insignia; // 🥇 🥈 🥉

    public RankingDTO(int posicion, String nombre, Integer puntos, Integer metaPuntos) {
        this.posicion = posicion;
        this.nombre = nombre;
        this.puntos = puntos;
        this.metaPuntos = metaPuntos;
        this.progreso = metaPuntos > 0 ? Math.min(100.0, (puntos * 100.0) / metaPuntos) : 0;
        this.insignia = switch (posicion) {
            case 1 -> "🥇";
            case 2 -> "🥈";
            case 3 -> "🥉";
            default -> "⭐";
        };
    }
}