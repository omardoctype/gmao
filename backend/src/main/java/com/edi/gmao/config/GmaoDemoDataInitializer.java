package com.edi.gmao.config;

import com.edi.gmao.entity.AuditLog;
import com.edi.gmao.entity.Breakdown;
import com.edi.gmao.entity.BreakdownPriority;
import com.edi.gmao.entity.BreakdownStatus;
import com.edi.gmao.entity.BreakdownType;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentStatus;
import com.edi.gmao.entity.MaintenancePlan;
import com.edi.gmao.entity.MaintenancePlanFrequency;
import com.edi.gmao.entity.MaintenancePlanType;
import com.edi.gmao.entity.Role;
import com.edi.gmao.entity.SparePart;
import com.edi.gmao.entity.StockMovement;
import com.edi.gmao.entity.StockMovementType;
import com.edi.gmao.entity.User;
import com.edi.gmao.entity.WorkOrder;
import com.edi.gmao.entity.WorkOrderPriority;
import com.edi.gmao.entity.WorkOrderStatus;
import com.edi.gmao.entity.WorkOrderType;
import com.edi.gmao.repository.AuditLogRepository;
import com.edi.gmao.repository.BreakdownRepository;
import com.edi.gmao.repository.EquipmentRepository;
import com.edi.gmao.repository.MaintenancePlanRepository;
import com.edi.gmao.repository.RoleRepository;
import com.edi.gmao.repository.SparePartRepository;
import com.edi.gmao.repository.StockMovementRepository;
import com.edi.gmao.repository.UserRepository;
import com.edi.gmao.repository.WorkOrderRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class GmaoDemoDataInitializer implements CommandLineRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(GmaoDemoDataInitializer.class);
    private static final long DEMO_RANDOM_SEED = 20260515L;

    private final EquipmentRepository equipmentRepository;
    private final BreakdownRepository breakdownRepository;
    private final WorkOrderRepository workOrderRepository;
    private final SparePartRepository sparePartRepository;
    private final StockMovementRepository stockMovementRepository;
    private final MaintenancePlanRepository maintenancePlanRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.demo.enabled:true}")
    private boolean demoSeedEnabled;

    public GmaoDemoDataInitializer(
            EquipmentRepository equipmentRepository,
            BreakdownRepository breakdownRepository,
            WorkOrderRepository workOrderRepository,
            SparePartRepository sparePartRepository,
            StockMovementRepository stockMovementRepository,
            MaintenancePlanRepository maintenancePlanRepository,
            AuditLogRepository auditLogRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.equipmentRepository = equipmentRepository;
        this.breakdownRepository = breakdownRepository;
        this.workOrderRepository = workOrderRepository;
        this.sparePartRepository = sparePartRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.maintenancePlanRepository = maintenancePlanRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!demoSeedEnabled) {
            LOGGER.info("Demo data seeder is disabled (app.seed.demo.enabled=false).");
            return;
        }

        MainTableSnapshot snapshot = loadMainTableSnapshot();
        if (!snapshot.isEmpty()) {
            PredictiveDemoSeedResult predictiveDemoSeedResult = seedPredictiveDifferentiationDemo();
            LOGGER.info(
                    "Demo data seeder skipped because main business tables are not empty: equipments={}, breakdowns={}, "
                            + "workOrders={}, spareParts={}, stockMovements={}, maintenancePlans={}. "
                            + "Predictive demo upsert: equipmentsCreated={}, breakdownsCreated={}, workOrdersCreated={}.",
                    snapshot.equipmentCount(),
                    snapshot.breakdownCount(),
                    snapshot.workOrderCount(),
                    snapshot.sparePartCount(),
                    snapshot.stockMovementCount(),
                    snapshot.maintenancePlanCount(),
                    predictiveDemoSeedResult.equipmentsCreated(),
                    predictiveDemoSeedResult.breakdownsCreated(),
                    predictiveDemoSeedResult.workOrdersCreated()
            );
            return;
        }

        LOGGER.info("Demo data seeder started (deterministic seed={}).", DEMO_RANDOM_SEED);
        Random random = new Random(DEMO_RANDOM_SEED);

        Map<String, Role> rolesByName = ensureRolesForDemoUsers();
        UserSeedResult userSeedResult = seedDemoUsers(rolesByName);

        List<Equipment> equipments = seedEquipments(random);
        List<Breakdown> breakdowns = seedBreakdowns(equipments, random);
        List<WorkOrder> workOrders = seedWorkOrders(equipments, breakdowns, userSeedResult.usersByEmail(), random);
        List<SparePart> spareParts = seedSpareParts(random);
        List<StockMovement> stockMovements = seedStockMovements(spareParts, random);
        List<MaintenancePlan> maintenancePlans = seedMaintenancePlans(equipments, random);
        List<AuditLog> interventionReports = seedInterventionReports(workOrders, userSeedResult.usersByEmail(), random);
        PredictiveDemoSeedResult predictiveDemoSeedResult = seedPredictiveDifferentiationDemo();

        LOGGER.info(
                "Demo data seeder completed: usersCreated={} usersReused={} equipments={} breakdowns={} workOrders={} "
                        + "spareParts={} stockMovements={} maintenancePlans={} interventionReports={} "
                        + "predictiveDemoEquipmentsCreated={} predictiveDemoBreakdownsCreated={} predictiveDemoWorkOrdersCreated={}.",
                userSeedResult.createdCount(),
                userSeedResult.reusedCount(),
                equipments.size(),
                breakdowns.size(),
                workOrders.size(),
                spareParts.size(),
                stockMovements.size(),
                maintenancePlans.size(),
                interventionReports.size(),
                predictiveDemoSeedResult.equipmentsCreated(),
                predictiveDemoSeedResult.breakdownsCreated(),
                predictiveDemoSeedResult.workOrdersCreated()
        );
    }

    private MainTableSnapshot loadMainTableSnapshot() {
        return new MainTableSnapshot(
                equipmentRepository.count(),
                breakdownRepository.count(),
                workOrderRepository.count(),
                sparePartRepository.count(),
                stockMovementRepository.count(),
                maintenancePlanRepository.count()
        );
    }

    private Map<String, Role> ensureRolesForDemoUsers() {
        Map<String, String> roleDescriptions = new LinkedHashMap<>();
        roleDescriptions.put("RESPONSABLE_MAINTENANCE", "Responsable maintenance");
        roleDescriptions.put("TECHNICIAN", "Technicien de maintenance");
        roleDescriptions.put("STOREKEEPER", "Magasinier");
        roleDescriptions.put("OPERATOR", "Operateur");
        roleDescriptions.put("DIRECTION", "Direction");

        Map<String, Role> rolesByName = new HashMap<>();
        for (Map.Entry<String, String> entry : roleDescriptions.entrySet()) {
            String roleName = entry.getKey();
            Role role = roleRepository.findByName(roleName).orElseGet(() -> {
                Role createdRole = new Role();
                createdRole.setName(roleName);
                createdRole.setDescription(entry.getValue());
                return roleRepository.save(createdRole);
            });
            rolesByName.put(roleName, role);
        }
        return rolesByName;
    }

    private UserSeedResult seedDemoUsers(Map<String, Role> rolesByName) {
        List<DemoUserSeed> seeds = List.of(
                new DemoUserSeed("Maintenance", "Manager", "resp@gmao.com", "Resp123!", "RESPONSABLE_MAINTENANCE", "+21670001001"),
                new DemoUserSeed("Yassine", "Technician", "tech@gmao.com", "Tech123!", "TECHNICIAN", "+21670001002"),
                new DemoUserSeed("Sana", "Storekeeper", "stock@gmao.com", "Stock123!", "STOREKEEPER", "+21670001003"),
                new DemoUserSeed("Nour", "Operator", "operator@gmao.com", "Operator123!", "OPERATOR", "+21670001004"),
                new DemoUserSeed("Executive", "Board", "direction@gmao.com", "Direction123!", "DIRECTION", "+21670001005")
        );

        Map<String, User> usersByEmail = new HashMap<>();
        int createdCount = 0;
        int reusedCount = 0;

        for (DemoUserSeed seed : seeds) {
            String normalizedEmail = normalizeEmail(seed.email());
            User existingUser = userRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
            User user = existingUser;
            if (user == null) {
                Role role = rolesByName.get(seed.roleName());
                if (role == null) {
                    throw new IllegalStateException("Role not found for demo user: " + seed.roleName());
                }

                User createdUser = new User();
                createdUser.setFirstName(seed.firstName());
                createdUser.setLastName(seed.lastName());
                createdUser.setEmail(normalizedEmail);
                createdUser.setPassword(passwordEncoder.encode(seed.rawPassword()));
                createdUser.setPhone(seed.phone());
                createdUser.setActive(true);
                createdUser.setRoles(Set.of(role));
                user = userRepository.save(createdUser);
                createdCount++;
            } else {
                reusedCount++;
            }

            usersByEmail.put(normalizedEmail, user);
        }

        return new UserSeedResult(createdCount, reusedCount, usersByEmail);
    }

    private List<Equipment> seedEquipments(Random random) {
        List<EquipmentSeed> equipmentSeeds = List.of(
                new EquipmentSeed("EQ-001", "Presse hydraulique HP-200", "Press", "HydroTech", "HP-200", "Atelier A", EquipmentStatus.OPERATIONAL, EquipmentCriticality.CRITICAL, 8),
                new EquipmentSeed("EQ-002", "Convoyeur a bande CV-120", "Material Handling", "Convex", "CV-120", "Ligne Emballage", EquipmentStatus.MAINTENANCE, EquipmentCriticality.HIGH, 6),
                new EquipmentSeed("EQ-003", "Compresseur d'air CP-50", "Air System", "AtlasCore", "CP-50", "Salle Utilites", EquipmentStatus.OPERATIONAL, EquipmentCriticality.HIGH, 7),
                new EquipmentSeed("EQ-004", "Pompe centrifuge PM-30", "Pumping", "FlowMax", "PM-30", "Station Eau 1", EquipmentStatus.OPERATIONAL, EquipmentCriticality.MEDIUM, 5),
                new EquipmentSeed("EQ-005", "Four industriel FR-900", "Thermal", "ThermoLine", "FR-900", "Traitement Thermique", EquipmentStatus.OUT_OF_SERVICE, EquipmentCriticality.CRITICAL, 11),
                new EquipmentSeed("EQ-006", "Moteur electrique MT-15", "Drive", "Siemens", "MT-15", "Ligne Production 2", EquipmentStatus.OPERATIONAL, EquipmentCriticality.HIGH, 4),
                new EquipmentSeed("EQ-007", "Groupe froid GF-40", "Cooling", "FrigoTech", "GF-40", "Zone Stockage", EquipmentStatus.MAINTENANCE, EquipmentCriticality.HIGH, 9),
                new EquipmentSeed("EQ-008", "Machine de decoupe DC-300", "Machining", "CutMaster", "DC-300", "Atelier B", EquipmentStatus.OPERATIONAL, EquipmentCriticality.CRITICAL, 6),
                new EquipmentSeed("EQ-009", "Systeme de ventilation VN-80", "HVAC", "Ventis", "VN-80", "Usine Centrale", EquipmentStatus.OPERATIONAL, EquipmentCriticality.MEDIUM, 10),
                new EquipmentSeed("EQ-010", "Armoire electrique AE-10", "Electrical", "Schneider", "AE-10", "Poste Electrique 1", EquipmentStatus.OPERATIONAL, EquipmentCriticality.CRITICAL, 5),
                new EquipmentSeed("EQ-011", "Chaudiere vapeur CH-250", "Thermal", "BoilerPro", "CH-250", "Salle Chaudieres", EquipmentStatus.OPERATIONAL, EquipmentCriticality.HIGH, 12),
                new EquipmentSeed("EQ-012", "Tour CNC TN-450", "Machining", "Mazak", "TN-450", "Atelier Usinage", EquipmentStatus.OPERATIONAL, EquipmentCriticality.HIGH, 3),
                new EquipmentSeed("EQ-013", "Robot de palettisation RB-20", "Automation", "Kuka", "RB-20", "Zone Expedition", EquipmentStatus.OPERATIONAL, EquipmentCriticality.MEDIUM, 2),
                new EquipmentSeed("EQ-014", "Generateur secours GS-500", "Power", "Cummins", "GS-500", "Batiment Energie", EquipmentStatus.MAINTENANCE, EquipmentCriticality.CRITICAL, 8),
                new EquipmentSeed("EQ-015", "Pompe vide PV-18", "Vacuum", "Leybold", "PV-18", "Ligne Conditionnement", EquipmentStatus.OPERATIONAL, EquipmentCriticality.MEDIUM, 4),
                new EquipmentSeed("EQ-016", "Ligne remplissage LR-700", "Filling", "PackTech", "LR-700", "Ligne Embouteillage", EquipmentStatus.OPERATIONAL, EquipmentCriticality.HIGH, 7),
                new EquipmentSeed("EQ-017", "Filtre industriel FI-90", "Filtration", "Pall", "FI-90", "Traitement Effluents", EquipmentStatus.OPERATIONAL, EquipmentCriticality.MEDIUM, 9),
                new EquipmentSeed("EQ-018", "Pont roulant PR-12", "Lifting", "Demag", "PR-12", "Magasin Principal", EquipmentStatus.OUT_OF_SERVICE, EquipmentCriticality.HIGH, 14),
                new EquipmentSeed("EQ-019", "Compresseur screw CS-75", "Air System", "Ingersoll", "CS-75", "Salle Utilites", EquipmentStatus.OPERATIONAL, EquipmentCriticality.HIGH, 6),
                new EquipmentSeed("EQ-020", "Systeme dosage automatique SD-22", "Automation", "DoseLine", "SD-22", "Ligne Chimie", EquipmentStatus.OPERATIONAL, EquipmentCriticality.CRITICAL, 3)
        );

        LocalDate today = LocalDate.now();
        List<Equipment> equipments = new ArrayList<>(equipmentSeeds.size());
        for (EquipmentSeed seed : equipmentSeeds) {
            Equipment equipment = new Equipment();
            equipment.setCode(seed.code());
            equipment.setName(seed.name());
            equipment.setCategory(seed.category());
            equipment.setBrand(seed.brand());
            equipment.setModel(seed.model());
            equipment.setSerialNumber("SN-" + seed.code().replace("-", "") + "-" + randomBetween(random, 1000, 9999));
            equipment.setLocation(seed.location());
            equipment.setStatus(seed.status());
            equipment.setCriticality(seed.criticality());
            equipment.setInstallationDate(today.minusYears(seed.installationYears()).minusDays(randomBetween(random, 0, 320)));
            equipment.setDescription("Industrial asset used in daily production. Preventive and corrective history is tracked.");
            equipments.add(equipment);
        }

        return equipmentRepository.saveAll(equipments);
    }

    private List<Breakdown> seedBreakdowns(List<Equipment> equipments, Random random) {
        List<BreakdownScenario> scenarios = List.of(
                new BreakdownScenario("Surchauffe moteur", BreakdownType.ELECTRICAL, "Motor temperature exceeded safe range during high load."),
                new BreakdownScenario("Fuite hydraulique", BreakdownType.HYDRAULIC, "Hydraulic circuit leak detected near actuator."),
                new BreakdownScenario("Vibration excessive", BreakdownType.MECHANICAL, "Abnormal vibration level detected on rotating assembly."),
                new BreakdownScenario("Chute de pression", BreakdownType.PNEUMATIC, "Pneumatic pressure drop impacted production cycle."),
                new BreakdownScenario("Blocage convoyeur", BreakdownType.MECHANICAL, "Conveyor belt blocked by misaligned roller."),
                new BreakdownScenario("Capteur defectueux", BreakdownType.ELECTRICAL, "Sensor drift generated unstable readings."),
                new BreakdownScenario("Court-circuit armoire", BreakdownType.ELECTRICAL, "Electrical cabinet short-circuit trip observed."),
                new BreakdownScenario("Bruit anormal", BreakdownType.MECHANICAL, "Unusual bearing noise reported by operator."),
                new BreakdownScenario("Arret imprevu", BreakdownType.OTHER, "Unexpected stop without planned shutdown request."),
                new BreakdownScenario("Debit insuffisant", BreakdownType.HYDRAULIC, "Flow rate below nominal operating threshold.")
        );

        LocalDateTime now = LocalDateTime.now();
        List<Breakdown> breakdowns = new ArrayList<>(50);
        for (int i = 1; i <= 50; i++) {
            BreakdownScenario scenario = scenarios.get((i - 1) % scenarios.size());
            Equipment equipment = equipments.get(random.nextInt(equipments.size()));
            BreakdownStatus status = breakdownStatusForIndex(i);

            Breakdown breakdown = new Breakdown();
            breakdown.setReference(String.format(Locale.ROOT, "BRK-%03d", i));
            breakdown.setTitle(scenario.title());
            breakdown.setDescription(
                    scenario.description() + " Equipment: " + equipment.getCode() + " (" + equipment.getName() + ")."
            );
            breakdown.setType(scenario.type());
            breakdown.setPriority(breakdownPriorityForIndex(i));
            breakdown.setStatus(status);
            breakdown.setDeclaredAt(randomDeclaredAtForStatus(now, status, random));
            breakdown.setEquipment(equipment);
            breakdowns.add(breakdown);
        }

        return breakdownRepository.saveAll(breakdowns);
    }

    private List<WorkOrder> seedWorkOrders(
            List<Equipment> equipments,
            List<Breakdown> breakdowns,
            Map<String, User> usersByEmail,
            Random random
    ) {
        User technician = usersByEmail.get("tech@gmao.com");
        User maintenanceManager = usersByEmail.get("resp@gmao.com");

        LocalDateTime now = LocalDateTime.now();
        List<WorkOrder> workOrders = new ArrayList<>(50);
        for (int i = 1; i <= 50; i++) {
            WorkOrderStatus status = workOrderStatusForIndex(i);
            boolean linkedToBreakdown = i <= 30;
            Breakdown linkedBreakdown = linkedToBreakdown ? breakdowns.get((i - 1) % breakdowns.size()) : null;
            Equipment equipment = linkedBreakdown != null
                    ? linkedBreakdown.getEquipment()
                    : equipments.get(random.nextInt(equipments.size()));

            LocalDateTime createdAt = linkedBreakdown != null
                    ? linkedBreakdown.getDeclaredAt().plusHours(randomBetween(random, 1, 18))
                    : now.minusDays(randomBetween(random, 14, 220)).minusHours(randomBetween(random, 0, 20));
            if (createdAt.isAfter(now.minusMinutes(30))) {
                createdAt = now.minusHours(randomBetween(random, 1, 36));
            }
            LocalDateTime plannedDate = plannedDateForStatus(now, createdAt, status, i, random);
            LocalDateTime assignedAt = assignedAtForStatus(status, createdAt, random);
            LocalDateTime acceptedAt = acceptedAtForStatus(status, assignedAt, random);
            LocalDateTime startedAt = startedAtForStatus(status, plannedDate, random);
            if (startedAt != null && startedAt.isAfter(now.minusMinutes(30))) {
                startedAt = now.minusHours(randomBetween(random, 1, 18));
            }
            LocalDateTime completedAt = completedAtForStatus(status, startedAt, now, random);
            Integer estimatedDurationMinutes = randomBetween(random, 45, 480);
            Integer actualDurationMinutes = completedAt == null || startedAt == null
                    ? null
                    : Math.toIntExact(java.time.Duration.between(startedAt, completedAt).toMinutes());

            BigDecimal estimatedCost = randomMoney(random, 180, 5400);
            BigDecimal realCost = realCostForStatus(status, estimatedCost, random);

            WorkOrder workOrder = new WorkOrder();
            workOrder.setReference(String.format(Locale.ROOT, "WO-%03d", i));
            workOrder.setType(workOrderTypeForIndex(i, linkedToBreakdown));
            workOrder.setStatus(status);
            workOrder.setPriority(workOrderPriorityForIndex(i));
            workOrder.setCreatedAt(createdAt);
            workOrder.setPlannedDate(plannedDate);
            workOrder.setAssignedAt(assignedAt);
            workOrder.setAcceptedAt(acceptedAt);
            workOrder.setStartedAt(startedAt);
            workOrder.setCompletedAt(completedAt);
            workOrder.setEstimatedDurationMinutes(estimatedDurationMinutes);
            workOrder.setActualDurationMinutes(actualDurationMinutes);
            workOrder.setEstimatedCost(estimatedCost);
            workOrder.setRealCost(realCost);
            workOrder.setDescription(buildWorkOrderDescription(linkedBreakdown, equipment, status));
            workOrder.setEquipment(equipment);
            workOrder.setBreakdown(linkedBreakdown);

            if (technician != null && (status == WorkOrderStatus.ASSIGNED
                    || status == WorkOrderStatus.ACCEPTED
                    || status == WorkOrderStatus.IN_PROGRESS
                    || status == WorkOrderStatus.COMPLETED
                    || i % 12 == 0)) {
                workOrder.setAssignedTechnician(technician);
            } else if (maintenanceManager != null && i % 17 == 0) {
                workOrder.setAssignedTechnician(maintenanceManager);
            }

            workOrders.add(workOrder);
        }

        return workOrderRepository.saveAll(workOrders);
    }

    private List<SparePart> seedSpareParts(Random random) {
        List<SparePartSeed> seeds = List.of(
                new SparePartSeed("SP-001", "Filtre hydraulique", "Hydraulique", 70, 15, new BigDecimal("42.50")),
                new SparePartSeed("SP-002", "Capteur temperature", "Instrumentation", 55, 12, new BigDecimal("28.00")),
                new SparePartSeed("SP-003", "Joint haute pression", "Hydraulique", 80, 20, new BigDecimal("9.80")),
                new SparePartSeed("SP-004", "Courroie convoyeur", "Transmission", 32, 8, new BigDecimal("67.00")),
                new SparePartSeed("SP-005", "Roulement moteur", "Mecanique", 48, 12, new BigDecimal("36.40")),
                new SparePartSeed("SP-006", "Fusible industriel", "Electrique", 120, 30, new BigDecimal("4.20")),
                new SparePartSeed("SP-007", "Disjoncteur", "Electrique", 34, 10, new BigDecimal("74.90")),
                new SparePartSeed("SP-008", "Pompe de lubrification", "Lubrification", 18, 6, new BigDecimal("185.00")),
                new SparePartSeed("SP-009", "Electrovanne", "Pneumatique", 43, 10, new BigDecimal("53.70")),
                new SparePartSeed("SP-010", "Ventilateur moteur", "Refroidissement", 26, 7, new BigDecimal("88.30")),
                new SparePartSeed("SP-011", "Pressostat", "Instrumentation", 37, 9, new BigDecimal("41.90")),
                new SparePartSeed("SP-012", "Relais thermique", "Electrique", 21, 6, new BigDecimal("29.50")),
                new SparePartSeed("SP-013", "Pignon acier", "Mecanique", 25, 7, new BigDecimal("113.00")),
                new SparePartSeed("SP-014", "Chaîne transmission", "Transmission", 29, 8, new BigDecimal("96.00")),
                new SparePartSeed("SP-015", "Tete de pompe", "Hydraulique", 16, 5, new BigDecimal("240.00")),
                new SparePartSeed("SP-016", "Sonde pression", "Instrumentation", 39, 9, new BigDecimal("66.20")),
                new SparePartSeed("SP-017", "Carte automate", "Automatisme", 12, 4, new BigDecimal("420.00")),
                new SparePartSeed("SP-018", "Contacteur puissance", "Electrique", 31, 8, new BigDecimal("58.90")),
                new SparePartSeed("SP-019", "Nozzle dosage", "Process", 46, 12, new BigDecimal("17.60")),
                new SparePartSeed("SP-020", "Courroie crantee", "Transmission", 33, 9, new BigDecimal("44.50")),
                new SparePartSeed("SP-021", "Roue codeuse", "Instrumentation", 15, 4, new BigDecimal("132.00")),
                new SparePartSeed("SP-022", "Lubrifiant industriel 5L", "Consommable", 62, 14, new BigDecimal("24.00")),
                new SparePartSeed("SP-023", "Filtre air compresseur", "Air System", 44, 11, new BigDecimal("37.80")),
                new SparePartSeed("SP-024", "Soupape securite", "Pneumatique", 20, 6, new BigDecimal("79.00")),
                new SparePartSeed("SP-025", "Capteur vibration", "Instrumentation", 22, 6, new BigDecimal("110.00")),
                new SparePartSeed("SP-026", "Bague etancheite", "Mecanique", 58, 14, new BigDecimal("6.30")),
                new SparePartSeed("SP-027", "Moteur pas a pas", "Automatisme", 17, 5, new BigDecimal("154.00")),
                new SparePartSeed("SP-028", "Connecteur industriel", "Electrique", 75, 18, new BigDecimal("8.90")),
                new SparePartSeed("SP-029", "Capot ventilateur", "Refroidissement", 27, 7, new BigDecimal("32.00")),
                new SparePartSeed("SP-030", "Valve de purge", "Hydraulique", 36, 9, new BigDecimal("22.60"))
        );

        List<SparePart> spareParts = new ArrayList<>(seeds.size());
        for (SparePartSeed seed : seeds) {
            SparePart sparePart = new SparePart();
            sparePart.setReference(seed.reference());
            sparePart.setName(seed.name());
            sparePart.setCategory(seed.category());
            sparePart.setQuantityInStock(seed.initialStock() + randomBetween(random, 0, 12));
            sparePart.setMinimumThreshold(seed.minimumThreshold());
            sparePart.setUnitPrice(seed.unitPrice());
            spareParts.add(sparePart);
        }

        return sparePartRepository.saveAll(spareParts);
    }

    private List<StockMovement> seedStockMovements(List<SparePart> spareParts, Random random) {
        LocalDateTime baseDate = LocalDateTime.now().minusDays(240);
        List<LocalDateTime> movementDates = new ArrayList<>(80);
        for (int i = 0; i < 80; i++) {
            LocalDateTime movementDate = baseDate
                    .plusDays(randomBetween(random, 0, 239))
                    .plusHours(randomBetween(random, 0, 23))
                    .plusMinutes(randomBetween(random, 0, 59));
            movementDates.add(movementDate);
        }
        movementDates.sort(Comparator.naturalOrder());

        List<StockMovement> movements = new ArrayList<>(80);
        for (LocalDateTime movementDate : movementDates) {
            SparePart sparePart = spareParts.get(random.nextInt(spareParts.size()));

            boolean inbound = sparePart.getQuantityInStock() <= 5 || random.nextDouble() < 0.46;
            if (!inbound && sparePart.getQuantityInStock() <= 0) {
                inbound = true;
            }

            int quantity;
            if (inbound) {
                quantity = randomBetween(random, 4, 24);
                sparePart.setQuantityInStock(sparePart.getQuantityInStock() + quantity);
            } else {
                int maxOut = Math.max(1, Math.min(18, sparePart.getQuantityInStock()));
                quantity = randomBetween(random, 1, maxOut);
                sparePart.setQuantityInStock(sparePart.getQuantityInStock() - quantity);
            }

            StockMovement movement = new StockMovement();
            movement.setType(inbound ? StockMovementType.IN : StockMovementType.OUT);
            movement.setQuantity(quantity);
            movement.setMovementDate(movementDate);
            movement.setSparePart(sparePart);
            movements.add(movement);
        }

        List<SparePart> sortedByStock = spareParts.stream()
                .sorted(Comparator.comparingInt(SparePart::getQuantityInStock))
                .collect(Collectors.toList());
        for (int i = 0; i < sortedByStock.size(); i++) {
            SparePart part = sortedByStock.get(i);
            if (i < 6) {
                part.setMinimumThreshold(part.getQuantityInStock() + randomBetween(random, 2, 8));
            } else {
                int targetThreshold = (int) Math.round(part.getQuantityInStock() * (0.35 + random.nextDouble() * 0.20));
                targetThreshold = Math.max(2, targetThreshold);
                part.setMinimumThreshold(Math.min(part.getQuantityInStock(), targetThreshold));
            }
        }

        stockMovementRepository.saveAll(movements);
        sparePartRepository.saveAll(spareParts);
        return movements;
    }

    private List<MaintenancePlan> seedMaintenancePlans(List<Equipment> equipments, Random random) {
        List<MaintenancePlanType> types = List.of(
                MaintenancePlanType.PREVENTIVE,
                MaintenancePlanType.PREDICTIVE,
                MaintenancePlanType.LEGAL,
                MaintenancePlanType.CONDITION_BASED,
                MaintenancePlanType.PREVENTIVE,
                MaintenancePlanType.PREDICTIVE,
                MaintenancePlanType.LEGAL,
                MaintenancePlanType.PREVENTIVE,
                MaintenancePlanType.CONDITION_BASED,
                MaintenancePlanType.OTHER
        );
        List<MaintenancePlanFrequency> frequencies = List.of(
                MaintenancePlanFrequency.WEEKLY,
                MaintenancePlanFrequency.MONTHLY,
                MaintenancePlanFrequency.QUARTERLY,
                MaintenancePlanFrequency.MONTHLY,
                MaintenancePlanFrequency.SEMI_ANNUAL,
                MaintenancePlanFrequency.WEEKLY,
                MaintenancePlanFrequency.ANNUAL,
                MaintenancePlanFrequency.MONTHLY,
                MaintenancePlanFrequency.QUARTERLY,
                MaintenancePlanFrequency.MONTHLY
        );

        LocalDate today = LocalDate.now();
        List<MaintenancePlan> maintenancePlans = new ArrayList<>(10);
        for (int i = 0; i < 10; i++) {
            Equipment equipment = equipments.get(i);
            MaintenancePlan plan = new MaintenancePlan();
            plan.setType(types.get(i));
            plan.setFrequency(frequencies.get(i));
            plan.setNextExecutionDate(today.plusDays(5L + i * 12L + randomBetween(random, 0, 8)));
            plan.setDescription(
                    "Plan " + (i + 1) + " for " + equipment.getCode()
                            + ": inspection, cleaning, lubrication, safety tests, and calibration checks."
            );
            plan.setEquipment(equipment);
            maintenancePlans.add(plan);
        }

        return maintenancePlanRepository.saveAll(maintenancePlans);
    }

    private List<AuditLog> seedInterventionReports(
            List<WorkOrder> workOrders,
            Map<String, User> usersByEmail,
            Random random
    ) {
        List<WorkOrder> reportableWorkOrders = workOrders.stream()
                .filter(wo -> wo.getStatus() == WorkOrderStatus.COMPLETED
                        || wo.getStatus() == WorkOrderStatus.IN_PROGRESS
                        || wo.getStatus() == WorkOrderStatus.ACCEPTED
                        || wo.getStatus() == WorkOrderStatus.ASSIGNED)
                .collect(Collectors.toList());

        if (reportableWorkOrders.isEmpty()) {
            reportableWorkOrders = workOrders;
        }

        List<User> actors = List.of(
                usersByEmail.get("tech@gmao.com"),
                usersByEmail.get("resp@gmao.com"),
                usersByEmail.get("operator@gmao.com")
        ).stream().filter(user -> user != null).collect(Collectors.toList());

        String[] interventionActions = {
                "INTERVENTION_REPORT_CREATED",
                "INTERVENTION_STATUS_UPDATED",
                "INTERVENTION_PART_REPLACED"
        };
        String[] interventionDetails = {
                "Root cause isolated and corrective action validated with production.",
                "Safety lockout verified before mechanical intervention.",
                "Functional test completed after spare part replacement.",
                "Condition monitoring values returned within nominal limits.",
                "Operator briefing completed after restart."
        };

        LocalDateTime now = LocalDateTime.now();
        List<AuditLog> reports = new ArrayList<>(30);
        for (int i = 1; i <= 30; i++) {
            WorkOrder workOrder = reportableWorkOrders.get((i - 1) % reportableWorkOrders.size());
            User actor = actors.isEmpty() ? null : actors.get((i - 1) % actors.size());

            LocalDateTime baseDate = workOrder.getCompletedAt() != null
                    ? workOrder.getCompletedAt()
                    : workOrder.getStartedAt() != null
                    ? workOrder.getStartedAt()
                    : workOrder.getCreatedAt().plusHours(6);
            LocalDateTime reportDate = baseDate.minusHours(randomBetween(random, 0, 6));
            if (reportDate.isAfter(now)) {
                reportDate = now.minusHours(randomBetween(random, 1, 10));
            }

            AuditLog report = new AuditLog();
            report.setAction(interventionActions[(i - 1) % interventionActions.length]);
            report.setEntityType("WORK_ORDER");
            report.setEntityId(workOrder.getId());
            if (actor != null) {
                report.setUserId(actor.getId());
                report.setUsername(actor.getEmail());
            }
            report.setDetails(
                    "WO " + workOrder.getReference() + " on equipment " + workOrder.getEquipment().getCode()
                            + ": " + interventionDetails[(i - 1) % interventionDetails.length]
            );
            report.setCreatedAt(reportDate);
            reports.add(report);
        }

        return auditLogRepository.saveAll(reports);
    }

    private PredictiveDemoSeedResult seedPredictiveDifferentiationDemo() {
        LocalDateTime now = LocalDateTime.now();
        User technician = userRepository.findByEmailIgnoreCase("tech@gmao.com").orElse(null);

        EquipmentSeed lowRiskSeed = new EquipmentSeed(
                "EQ-PRED-LOW",
                "Pompe auxiliaire test pannes mineures",
                "Predictive Demo",
                "DemoFlow",
                "PRED-LOW",
                "Banc demonstration predictive",
                EquipmentStatus.OPERATIONAL,
                EquipmentCriticality.MEDIUM,
                2
        );
        EquipmentSeed criticalRiskSeed = new EquipmentSeed(
                "EQ-PRED-CRIT",
                "Compresseur critique test pannes graves",
                "Predictive Demo",
                "DemoAir",
                "PRED-CRIT",
                "Banc demonstration predictive",
                EquipmentStatus.OUT_OF_SERVICE,
                EquipmentCriticality.CRITICAL,
                6
        );

        int equipmentsCreated = 0;
        Equipment lowRiskEquipment = equipmentRepository.findByCodeIgnoreCase(lowRiskSeed.code()).orElse(null);
        if (lowRiskEquipment == null) {
            lowRiskEquipment = new Equipment();
            lowRiskEquipment.setCode(lowRiskSeed.code());
            equipmentsCreated++;
        }
        applyPredictiveDemoEquipmentSeed(lowRiskEquipment, lowRiskSeed, now.toLocalDate());
        lowRiskEquipment = equipmentRepository.save(lowRiskEquipment);

        Equipment criticalRiskEquipment = equipmentRepository.findByCodeIgnoreCase(criticalRiskSeed.code()).orElse(null);
        if (criticalRiskEquipment == null) {
            criticalRiskEquipment = new Equipment();
            criticalRiskEquipment.setCode(criticalRiskSeed.code());
            equipmentsCreated++;
        }
        applyPredictiveDemoEquipmentSeed(criticalRiskEquipment, criticalRiskSeed, now.toLocalDate());
        criticalRiskEquipment = equipmentRepository.save(criticalRiskEquipment);

        int breakdownsCreated = seedLowRiskPredictiveBreakdowns(lowRiskEquipment, now)
                + seedCriticalRiskPredictiveBreakdowns(criticalRiskEquipment, now);
        int workOrdersCreated = seedLowRiskPredictiveWorkOrders(lowRiskEquipment, now, technician)
                + seedCriticalRiskPredictiveWorkOrders(criticalRiskEquipment, now, technician);

        return new PredictiveDemoSeedResult(equipmentsCreated, breakdownsCreated, workOrdersCreated);
    }

    private void applyPredictiveDemoEquipmentSeed(Equipment equipment, EquipmentSeed seed, LocalDate today) {
        equipment.setName(seed.name());
        equipment.setCategory(seed.category());
        equipment.setBrand(seed.brand());
        equipment.setModel(seed.model());
        equipment.setSerialNumber("SN-" + seed.code().replace("-", "") + "-DEMO");
        equipment.setLocation(seed.location());
        equipment.setStatus(seed.status());
        equipment.setCriticality(seed.criticality());
        equipment.setInstallationDate(today.minusYears(seed.installationYears()));
        equipment.setDescription(
                "Scenario de demonstration predictive: deux equipements ont le meme nombre de pannes, "
                        + "mais pas la meme gravite ni le meme impact operationnel."
        );
    }

    private int seedLowRiskPredictiveBreakdowns(Equipment equipment, LocalDateTime now) {
        int createdCount = 0;
        for (int i = 1; i <= 10; i++) {
            String reference = String.format(Locale.ROOT, "BRK-PRED-LOW-%03d", i);
            Breakdown breakdown = breakdownRepository.findByReferenceIgnoreCase(reference).orElse(null);
            if (breakdown == null) {
                breakdown = new Breakdown();
                breakdown.setReference(reference);
                createdCount++;
            }

            breakdown.setTitle("Panne mineure recurrente pompe auxiliaire");
            breakdown.setDescription(
                    "Cas demo predictive LOW: micro-incident mineur sans arret critique. "
                            + "L'equipement reste operationnel malgre la recurrence."
            );
            breakdown.setType(BreakdownType.MECHANICAL);
            breakdown.setPriority(BreakdownPriority.LOW);
            breakdown.setStatus(BreakdownStatus.RESOLVED);
            if (breakdown.getId() == null) {
                breakdown.setDeclaredAt(now.minusDays(i * 4L).minusHours(i));
            }
            breakdown.setEquipment(equipment);
            breakdownRepository.save(breakdown);
        }
        return createdCount;
    }

    private int seedCriticalRiskPredictiveBreakdowns(Equipment equipment, LocalDateTime now) {
        int createdCount = 0;
        for (int i = 1; i <= 10; i++) {
            String reference = String.format(Locale.ROOT, "BRK-PRED-CRIT-%03d", i);
            Breakdown breakdown = breakdownRepository.findByReferenceIgnoreCase(reference).orElse(null);
            if (breakdown == null) {
                breakdown = new Breakdown();
                breakdown.setReference(reference);
                createdCount++;
            }

            boolean criticalPriority = i % 2 == 1;
            breakdown.setTitle("Panne grave recurrente compresseur critique");
            breakdown.setDescription(
                    "Cas demo predictive CRITICAL: panne a fort impact production, avec indisponibilite "
                            + "et recurrence du meme mode de defaillance."
            );
            breakdown.setType(BreakdownType.PNEUMATIC);
            breakdown.setPriority(criticalPriority ? BreakdownPriority.CRITICAL : BreakdownPriority.HIGH);
            breakdown.setStatus(i <= 5 ? BreakdownStatus.DECLARED : BreakdownStatus.IN_PROGRESS);
            if (breakdown.getId() == null) {
                breakdown.setDeclaredAt(now.minusDays(i * 3L).minusHours(i));
            }
            breakdown.setEquipment(equipment);
            breakdownRepository.save(breakdown);
        }
        return createdCount;
    }

    private int seedLowRiskPredictiveWorkOrders(Equipment equipment, LocalDateTime now, User technician) {
        int createdCount = 0;
        for (int i = 1; i <= 10; i++) {
            String reference = String.format(Locale.ROOT, "WO-PRED-LOW-%03d", i);
            Breakdown breakdown = breakdownRepository.findByReferenceIgnoreCase(
                    String.format(Locale.ROOT, "BRK-PRED-LOW-%03d", i)
            ).orElse(null);
            WorkOrder workOrder = workOrderRepository.findByReferenceIgnoreCase(reference).orElse(null);
            if (workOrder == null) {
                workOrder = new WorkOrder();
                workOrder.setReference(reference);
                workOrder.setCreatedAt(now.minusDays(50L - i));
                createdCount++;
            }

            LocalDateTime plannedDate = now.minusDays(45L - i);
            LocalDateTime startedAt = plannedDate.plusHours(2);
            LocalDateTime completedAt = startedAt.plusHours(3);
            workOrder.setType(WorkOrderType.CORRECTIVE);
            workOrder.setStatus(WorkOrderStatus.COMPLETED);
            workOrder.setPriority(WorkOrderPriority.LOW);
            workOrder.setPlannedDate(plannedDate);
            workOrder.setAssignedAt(plannedDate.minusHours(12));
            workOrder.setAcceptedAt(plannedDate.minusHours(4));
            workOrder.setStartedAt(startedAt);
            workOrder.setCompletedAt(completedAt);
            workOrder.setEstimatedDurationMinutes(180);
            workOrder.setActualDurationMinutes(Math.toIntExact(java.time.Duration.between(startedAt, completedAt).toMinutes()));
            workOrder.setEstimatedCost(BigDecimal.valueOf(120));
            workOrder.setRealCost(BigDecimal.valueOf(95));
            workOrder.setDescription(
                    "OT demo predictive LOW: correction mineure cloturee, sans impact critique sur la production."
            );
            workOrder.setEquipment(equipment);
            workOrder.setBreakdown(breakdown);
            workOrder.setAssignedTechnician(technician);
            workOrderRepository.save(workOrder);
        }

        String preventiveReference = "WO-PRED-LOW-PREV-001";
        WorkOrder preventiveWorkOrder = workOrderRepository.findByReferenceIgnoreCase(preventiveReference).orElse(null);
        if (preventiveWorkOrder == null) {
            preventiveWorkOrder = new WorkOrder();
            preventiveWorkOrder.setReference(preventiveReference);
            preventiveWorkOrder.setCreatedAt(now.minusDays(18));
            createdCount++;
        }
        LocalDateTime preventivePlannedDate = now.minusDays(15);
        LocalDateTime preventiveStartedAt = preventivePlannedDate.plusHours(1);
        LocalDateTime preventiveCompletedAt = now.minusDays(14);
        preventiveWorkOrder.setType(WorkOrderType.PREVENTIVE);
        preventiveWorkOrder.setStatus(WorkOrderStatus.COMPLETED);
        preventiveWorkOrder.setPriority(WorkOrderPriority.LOW);
        preventiveWorkOrder.setPlannedDate(preventivePlannedDate);
        preventiveWorkOrder.setAssignedAt(preventivePlannedDate.minusHours(10));
        preventiveWorkOrder.setAcceptedAt(preventivePlannedDate.minusHours(2));
        preventiveWorkOrder.setStartedAt(preventiveStartedAt);
        preventiveWorkOrder.setCompletedAt(preventiveCompletedAt);
        preventiveWorkOrder.setEstimatedDurationMinutes(120);
        preventiveWorkOrder.setActualDurationMinutes(Math.toIntExact(java.time.Duration.between(preventiveStartedAt, preventiveCompletedAt).toMinutes()));
        preventiveWorkOrder.setEstimatedCost(BigDecimal.valueOf(180));
        preventiveWorkOrder.setRealCost(BigDecimal.valueOf(160));
        preventiveWorkOrder.setDescription(
                "OT demo predictive LOW: preventive recente terminee pour prouver que la recurrence mineure reste maitrisee."
        );
        preventiveWorkOrder.setEquipment(equipment);
        preventiveWorkOrder.setBreakdown(null);
        preventiveWorkOrder.setAssignedTechnician(technician);
        workOrderRepository.save(preventiveWorkOrder);

        return createdCount;
    }

    private int seedCriticalRiskPredictiveWorkOrders(Equipment equipment, LocalDateTime now, User technician) {
        int createdCount = 0;
        for (int i = 1; i <= 8; i++) {
            String reference = String.format(Locale.ROOT, "WO-PRED-CRIT-%03d", i);
            Breakdown breakdown = breakdownRepository.findByReferenceIgnoreCase(
                    String.format(Locale.ROOT, "BRK-PRED-CRIT-%03d", i)
            ).orElse(null);
            WorkOrder workOrder = workOrderRepository.findByReferenceIgnoreCase(reference).orElse(null);
            if (workOrder == null) {
                workOrder = new WorkOrder();
                workOrder.setReference(reference);
                workOrder.setCreatedAt(now.minusDays(30L + i));
                createdCount++;
            }

            LocalDateTime plannedDate = now.minusDays(20L + i);
            WorkOrderStatus status = i % 2 == 0 ? WorkOrderStatus.ASSIGNED : WorkOrderStatus.IN_PROGRESS;
            workOrder.setType(WorkOrderType.CORRECTIVE);
            workOrder.setStatus(status);
            workOrder.setPriority(status == WorkOrderStatus.ASSIGNED ? WorkOrderPriority.HIGH : WorkOrderPriority.CRITICAL);
            workOrder.setPlannedDate(plannedDate);
            workOrder.setAssignedAt(plannedDate.minusHours(12));
            workOrder.setAcceptedAt(status == WorkOrderStatus.IN_PROGRESS ? plannedDate.minusHours(2) : null);
            workOrder.setStartedAt(status == WorkOrderStatus.IN_PROGRESS ? plannedDate.plusHours(4) : null);
            workOrder.setCompletedAt(null);
            workOrder.setEstimatedDurationMinutes(240);
            workOrder.setActualDurationMinutes(null);
            workOrder.setEstimatedCost(BigDecimal.valueOf(2500));
            workOrder.setRealCost(null);
            workOrder.setDescription(
                    "OT demo predictive CRITICAL: intervention ouverte et en retard sur panne grave recurrente."
            );
            workOrder.setEquipment(equipment);
            workOrder.setBreakdown(breakdown);
            workOrder.setAssignedTechnician(technician);
            workOrderRepository.save(workOrder);
        }

        createdCount += upsertCriticalPreventiveDemoWorkOrder(
                "WO-PRED-CRIT-PREV-001",
                WorkOrderType.PREVENTIVE,
                WorkOrderStatus.ASSIGNED,
                now.minusDays(28),
                equipment,
                technician
        );
        createdCount += upsertCriticalPreventiveDemoWorkOrder(
                "WO-PRED-CRIT-INSP-001",
                WorkOrderType.INSPECTION,
                WorkOrderStatus.IN_PROGRESS,
                now.minusDays(22),
                equipment,
                technician
        );

        return createdCount;
    }

    private int upsertCriticalPreventiveDemoWorkOrder(
            String reference,
            WorkOrderType type,
            WorkOrderStatus status,
            LocalDateTime plannedDate,
            Equipment equipment,
            User technician
    ) {
        WorkOrder workOrder = workOrderRepository.findByReferenceIgnoreCase(reference).orElse(null);
        int createdCount = 0;
        if (workOrder == null) {
            workOrder = new WorkOrder();
            workOrder.setReference(reference);
            workOrder.setCreatedAt(plannedDate.minusDays(4));
            createdCount = 1;
        }

        workOrder.setType(type);
        workOrder.setStatus(status);
        workOrder.setPriority(WorkOrderPriority.CRITICAL);
        workOrder.setPlannedDate(plannedDate);
        workOrder.setAssignedAt(plannedDate.minusHours(12));
        workOrder.setAcceptedAt(status == WorkOrderStatus.IN_PROGRESS ? plannedDate.minusHours(3) : null);
        workOrder.setStartedAt(status == WorkOrderStatus.IN_PROGRESS ? plannedDate.plusHours(6) : null);
        workOrder.setCompletedAt(null);
        workOrder.setEstimatedDurationMinutes(180);
        workOrder.setActualDurationMinutes(null);
        workOrder.setEstimatedCost(BigDecimal.valueOf(1800));
        workOrder.setRealCost(null);
        workOrder.setDescription(
                "OT demo predictive CRITICAL: maintenance preventive/inspection en retard sur equipement critique."
        );
        workOrder.setEquipment(equipment);
        workOrder.setBreakdown(null);
        workOrder.setAssignedTechnician(technician);
        workOrderRepository.save(workOrder);
        return createdCount;
    }

    private BreakdownStatus breakdownStatusForIndex(int index) {
        if (index <= 10) {
            return BreakdownStatus.DECLARED;
        }
        if (index <= 20) {
            return BreakdownStatus.QUALIFIED;
        }
        if (index <= 32) {
            return BreakdownStatus.IN_PROGRESS;
        }
        return BreakdownStatus.RESOLVED;
    }

    private BreakdownPriority breakdownPriorityForIndex(int index) {
        int bucket = index % 10;
        return switch (bucket) {
            case 0 -> BreakdownPriority.CRITICAL;
            case 1, 2, 3 -> BreakdownPriority.HIGH;
            case 4, 5, 6 -> BreakdownPriority.MEDIUM;
            default -> BreakdownPriority.LOW;
        };
    }

    private LocalDateTime randomDeclaredAtForStatus(LocalDateTime now, BreakdownStatus status, Random random) {
        return switch (status) {
            case DECLARED -> now.minusDays(randomBetween(random, 0, 8)).minusHours(randomBetween(random, 0, 10));
            case QUALIFIED -> now.minusDays(randomBetween(random, 4, 25)).minusHours(randomBetween(random, 0, 12));
            case IN_PROGRESS -> now.minusDays(randomBetween(random, 10, 60)).minusHours(randomBetween(random, 0, 14));
            case RESOLVED -> now.minusDays(randomBetween(random, 20, 220)).minusHours(randomBetween(random, 0, 20));
        };
    }

    private WorkOrderStatus workOrderStatusForIndex(int index) {
        if (index <= 10) {
            return WorkOrderStatus.CREATED;
        }
        if (index <= 20) {
            return WorkOrderStatus.ASSIGNED;
        }
        if (index <= 28) {
            return WorkOrderStatus.ACCEPTED;
        }
        if (index <= 36) {
            return WorkOrderStatus.IN_PROGRESS;
        }
        if (index <= 46) {
            return WorkOrderStatus.COMPLETED;
        }
        return WorkOrderStatus.CANCELLED;
    }

    private WorkOrderPriority workOrderPriorityForIndex(int index) {
        int bucket = index % 8;
        return switch (bucket) {
            case 0 -> WorkOrderPriority.CRITICAL;
            case 1, 2 -> WorkOrderPriority.HIGH;
            case 3, 4, 5 -> WorkOrderPriority.MEDIUM;
            default -> WorkOrderPriority.LOW;
        };
    }

    private WorkOrderType workOrderTypeForIndex(int index, boolean linkedToBreakdown) {
        if (linkedToBreakdown) {
            return WorkOrderType.CORRECTIVE;
        }
        return switch (index % 4) {
            case 0 -> WorkOrderType.PREVENTIVE;
            case 1 -> WorkOrderType.INSPECTION;
            case 2 -> WorkOrderType.INSTALLATION;
            default -> WorkOrderType.OTHER;
        };
    }

    private LocalDateTime plannedDateForStatus(
            LocalDateTime now,
            LocalDateTime createdAt,
            WorkOrderStatus status,
            int index,
            Random random
    ) {
        return switch (status) {
            case CREATED -> {
                if (index % 9 == 0) {
                    yield now.minusDays(randomBetween(random, 1, 12));
                }
                yield createdAt.plusDays(randomBetween(random, 2, 35));
            }
            case ASSIGNED, ACCEPTED -> {
                if (index % 4 == 0) {
                    yield now.minusDays(randomBetween(random, 1, 8));
                }
                yield createdAt.plusDays(randomBetween(random, 1, 20));
            }
            case IN_PROGRESS -> {
                LocalDateTime planned = createdAt.plusDays(randomBetween(random, 1, 12));
                if (planned.isAfter(now.minusDays(1))) {
                    planned = now.minusDays(randomBetween(random, 1, 16));
                }
                yield planned;
            }
            case COMPLETED -> {
                LocalDateTime planned = createdAt.plusDays(randomBetween(random, 1, 18));
                if (planned.isAfter(now.minusDays(2))) {
                    planned = now.minusDays(randomBetween(random, 2, 30));
                }
                yield planned;
            }
            case CANCELLED -> createdAt.plusDays(randomBetween(random, 1, 20));
        };
    }

    private LocalDateTime assignedAtForStatus(WorkOrderStatus status, LocalDateTime createdAt, Random random) {
        return switch (status) {
            case ASSIGNED, ACCEPTED, IN_PROGRESS, COMPLETED -> createdAt.plusHours(randomBetween(random, 2, 24));
            default -> null;
        };
    }

    private LocalDateTime acceptedAtForStatus(WorkOrderStatus status, LocalDateTime assignedAt, Random random) {
        if (assignedAt == null) {
            return null;
        }
        return switch (status) {
            case ACCEPTED, IN_PROGRESS, COMPLETED -> assignedAt.plusHours(randomBetween(random, 1, 8));
            default -> null;
        };
    }

    private LocalDateTime startedAtForStatus(WorkOrderStatus status, LocalDateTime plannedDate, Random random) {
        return switch (status) {
            case IN_PROGRESS, COMPLETED -> plannedDate.plusHours(randomBetween(random, 0, 12));
            default -> null;
        };
    }

    private LocalDateTime completedAtForStatus(
            WorkOrderStatus status,
            LocalDateTime startedAt,
            LocalDateTime now,
            Random random
    ) {
        if (status != WorkOrderStatus.COMPLETED || startedAt == null) {
            return null;
        }

        LocalDateTime completedAt = startedAt.plusHours(randomBetween(random, 4, 80));
        if (completedAt.isAfter(now.minusMinutes(30))) {
            completedAt = now.minusHours(randomBetween(random, 2, 30));
        }
        return completedAt;
    }

    private BigDecimal realCostForStatus(WorkOrderStatus status, BigDecimal estimatedCost, Random random) {
        return switch (status) {
            case COMPLETED -> estimatedCost
                    .multiply(BigDecimal.valueOf(0.85 + random.nextDouble() * 0.50))
                    .setScale(2, RoundingMode.HALF_UP);
            case IN_PROGRESS -> estimatedCost
                    .multiply(BigDecimal.valueOf(0.25 + random.nextDouble() * 0.35))
                    .setScale(2, RoundingMode.HALF_UP);
            default -> null;
        };
    }

    private String buildWorkOrderDescription(Breakdown linkedBreakdown, Equipment equipment, WorkOrderStatus status) {
        if (linkedBreakdown == null) {
            return "Planned operation on " + equipment.getCode()
                    + " including controls, checklist execution, and documentation update. Status: " + status + ".";
        }
        return "Corrective intervention for breakdown " + linkedBreakdown.getReference()
                + " on equipment " + equipment.getCode()
                + ". Actions include diagnosis, repair, testing, and production handover.";
    }

    private BigDecimal randomMoney(Random random, double min, double max) {
        double value = min + (max - min) * random.nextDouble();
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private int randomBetween(Random random, int minInclusive, int maxInclusive) {
        if (minInclusive == maxInclusive) {
            return minInclusive;
        }
        return minInclusive + random.nextInt(maxInclusive - minInclusive + 1);
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private record MainTableSnapshot(
            long equipmentCount,
            long breakdownCount,
            long workOrderCount,
            long sparePartCount,
            long stockMovementCount,
            long maintenancePlanCount
    ) {
        private boolean isEmpty() {
            return equipmentCount == 0
                    && breakdownCount == 0
                    && workOrderCount == 0
                    && sparePartCount == 0
                    && stockMovementCount == 0
                    && maintenancePlanCount == 0;
        }
    }

    private record DemoUserSeed(
            String firstName,
            String lastName,
            String email,
            String rawPassword,
            String roleName,
            String phone
    ) {
    }

    private record UserSeedResult(int createdCount, int reusedCount, Map<String, User> usersByEmail) {
    }

    private record PredictiveDemoSeedResult(int equipmentsCreated, int breakdownsCreated, int workOrdersCreated) {
    }

    private record EquipmentSeed(
            String code,
            String name,
            String category,
            String brand,
            String model,
            String location,
            EquipmentStatus status,
            EquipmentCriticality criticality,
            int installationYears
    ) {
    }

    private record BreakdownScenario(String title, BreakdownType type, String description) {
    }

    private record SparePartSeed(
            String reference,
            String name,
            String category,
            int initialStock,
            int minimumThreshold,
            BigDecimal unitPrice
    ) {
    }
}
