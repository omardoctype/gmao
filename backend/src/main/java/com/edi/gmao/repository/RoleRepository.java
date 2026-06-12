package com.edi.gmao.repository;

import com.edi.gmao.entity.Role;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(String name);

    @EntityGraph(attributePaths = "permissions")
    @Query("select r from Role r left join fetch r.permissions where r.name = :name")
    Optional<Role> findByNameWithPermissions(@Param("name") String name);

    boolean existsByName(String name);

    List<Role> findByNameIn(Collection<String> names);
}
