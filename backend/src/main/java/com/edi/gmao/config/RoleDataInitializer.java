package com.edi.gmao.config;

import com.edi.gmao.entity.Permission;
import com.edi.gmao.entity.Role;
import com.edi.gmao.entity.User;
import com.edi.gmao.repository.PermissionRepository;
import com.edi.gmao.repository.RoleRepository;
import com.edi.gmao.repository.UserRepository;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class RoleDataInitializer {

    @Bean
    public CommandLineRunner initializeRolesAndAdmin(
            PermissionRepository permissionRepository,
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            SeedAdminProperties seedAdminProperties
    ) {
        return args -> {
            createPermissionIfMissing(permissionRepository, "VIEW_DASHBOARD", "Consulter le dashboard");
            createPermissionIfMissing(permissionRepository, "MANAGE_USERS", "Gerer les utilisateurs");
            createPermissionIfMissing(permissionRepository, "CREATE_EQUIPMENT", "Creer des equipements");
            createPermissionIfMissing(permissionRepository, "UPDATE_WORK_ORDER", "Mettre a jour les ordres de travail");
            createPermissionIfMissing(permissionRepository, "MANAGE_STOCK", "Gerer le stock");

            createRoleIfMissing(roleRepository, "ADMIN", "Administrateur du systeme");
            createRoleIfMissing(roleRepository, "RESPONSABLE_MAINTENANCE", "Responsable maintenance");
            createRoleIfMissing(roleRepository, "TECHNICIAN", "Technicien de maintenance");
            createRoleIfMissing(roleRepository, "STOREKEEPER", "Magasinier");
            createRoleIfMissing(roleRepository, "OPERATOR", "Operateur de production");
            createRoleIfMissing(roleRepository, "DIRECTION", "Direction");

            assignPermissionsToRoles(permissionRepository, roleRepository);

            if (seedAdminProperties.isEnabled()) {
                createAdminIfMissing(roleRepository, userRepository, passwordEncoder, seedAdminProperties);
            }
        };
    }

    private void createRoleIfMissing(RoleRepository roleRepository, String name, String description) {
        if (roleRepository.existsByName(name)) {
            return;
        }

        Role role = new Role();
        role.setName(name);
        role.setDescription(description);
        roleRepository.save(role);
    }

    private void createPermissionIfMissing(
            PermissionRepository permissionRepository,
            String name,
            String description
    ) {
        if (permissionRepository.existsByName(name)) {
            return;
        }

        Permission permission = new Permission();
        permission.setName(name);
        permission.setDescription(description);
        permissionRepository.save(permission);
    }

    private void assignPermissionsToRoles(
            PermissionRepository permissionRepository,
            RoleRepository roleRepository
    ) {
        Map<String, Set<String>> rolePermissions = new HashMap<>();
        rolePermissions.put(
                "ADMIN",
                Set.of("VIEW_DASHBOARD", "MANAGE_USERS", "CREATE_EQUIPMENT", "UPDATE_WORK_ORDER", "MANAGE_STOCK")
        );
        rolePermissions.put(
                "RESPONSABLE_MAINTENANCE",
                Set.of("VIEW_DASHBOARD", "CREATE_EQUIPMENT", "UPDATE_WORK_ORDER")
        );
        rolePermissions.put("TECHNICIAN", Set.of("VIEW_DASHBOARD", "UPDATE_WORK_ORDER"));
        rolePermissions.put("STOREKEEPER", Set.of("VIEW_DASHBOARD", "MANAGE_STOCK"));
        rolePermissions.put("OPERATOR", Set.of("VIEW_DASHBOARD"));
        rolePermissions.put("DIRECTION", Set.of("VIEW_DASHBOARD"));

        for (Map.Entry<String, Set<String>> entry : rolePermissions.entrySet()) {
            Optional<Role> optionalRole = roleRepository.findByNameWithPermissions(entry.getKey());
            if (optionalRole.isEmpty()) {
                continue;
            }

            Role role = optionalRole.get();
            Set<Permission> targetPermissions = new HashSet<>(permissionRepository.findByNameIn(entry.getValue()));
            Set<String> existingPermissionNames = role.getPermissions().stream()
                    .map(Permission::getName)
                    .collect(Collectors.toSet());

            boolean needsUpdate = !existingPermissionNames.containsAll(entry.getValue());
            if (needsUpdate) {
                role.getPermissions().addAll(targetPermissions);
                roleRepository.save(role);
            }
        }
    }

    private void createAdminIfMissing(
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            SeedAdminProperties seedAdminProperties
    ) {
        String adminEmail = normalize(seedAdminProperties.getEmail()).toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(adminEmail)) {
            return;
        }

        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("ADMIN role must exist before creating admin user"));

        User admin = new User();
        admin.setFirstName(normalize(seedAdminProperties.getFirstName()));
        admin.setLastName(normalize(seedAdminProperties.getLastName()));
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode(seedAdminProperties.getPassword()));
        admin.setActive(seedAdminProperties.isActive());
        admin.setRoles(Set.of(adminRole));

        userRepository.save(admin);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}
