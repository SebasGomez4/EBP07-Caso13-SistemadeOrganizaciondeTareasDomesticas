package com.fabrica.soyla.repository;

import com.fabrica.soyla.model.InvitacionGrupo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InvitacionGrupoRepository extends JpaRepository<InvitacionGrupo, Long> {
    Optional<InvitacionGrupo> findByToken(String token);
}
