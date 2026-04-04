package com.fabrica.soyla.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
public class GrupoFamiliar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre del grupo es obligatorio")
    private String nombre;

    @OneToMany(mappedBy = "grupo", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<GrupoMiembro> miembros = new ArrayList<>();
}