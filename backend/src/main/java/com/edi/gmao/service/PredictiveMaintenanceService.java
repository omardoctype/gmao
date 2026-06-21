package com.edi.gmao.service;

import com.edi.gmao.dto.predictive.PredictiveDashboardResponse;
import com.edi.gmao.dto.predictive.PredictiveRiskLevel;
import com.edi.gmao.dto.predictive.PredictiveRiskReason;
import com.edi.gmao.dto.predictive.PredictiveRiskResponse;
import com.edi.gmao.entity.Breakdown;
import com.edi.gmao.entity.BreakdownPriority;
import com.edi.gmao.entity.BreakdownType;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentStatus;
import com.edi.gmao.entity.InterventionReport;
import com.edi.gmao.entity.WorkOrder;
import com.edi.gmao.entity.WorkOrderStatus;
import com.edi.gmao.entity.WorkOrderType;
import com.edi.gmao.exception.EquipmentNotFoundException;
import com.edi.gmao.repository.BreakdownRepository;
import com.edi.gmao.repository.EquipmentRepository;
import com.edi.gmao.repository.InterventionReportRepository;
import com.edi.gmao.repository.WorkOrderRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PredictiveMaintenanceService {

    private static final int LOOKBACK_DAYS = 90;

    private static final Set<WorkOrderStatus> OPEN_WORK_ORDER_STATUSES = EnumSet.of(
            WorkOrderStatus.CREATED,
            WorkOrderStatus.ASSIGNED,
            WorkOrderStatus.ACCEPTED,
            WorkOrderStatus.IN_PROGRESS
    );

    private final EquipmentRepository equipmentRepository;
    private final BreakdownRepository breakdownRepository;
    private final WorkOrderRepository workOrderRepository;
    private final InterventionReportRepository interventionReportRepository;

    public PredictiveMaintenanceService(
            EquipmentRepository equipmentRepository,
            BreakdownRepository breakdownRepository,
            WorkOrderRepository workOrderRepository,
            InterventionReportRepository interventionReportRepository
    ) {
        this.equipmentRepository = equipmentRepository;
        this.breakdownRepository = breakdownRepository;
        this.workOrderRepository = workOrderRepository;
        this.interventionReportRepository = interventionReportRepository;
    }

    @Transactional(readOnly = true)
    public List<PredictiveRiskResponse> getEquipmentsRisk() {
        List<Equipment> equipments = equipmentRepository.findAll();
        if (equipments.isEmpty()) {
            return List.of();
        }

        RiskComputationContext context = buildRiskComputationContext();
        return computeRiskResponses(equipments, context);
    }

    @Transactional(readOnly = true)
    public PredictiveRiskResponse getEquipmentRisk(Long equipmentId) {
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new EquipmentNotFoundException(equipmentId));

        RiskComputationContext context = buildRiskComputationContext();
        return computeRiskForEquipment(equipment, context);
    }

    @Transactional(readOnly = true)
    public PredictiveDashboardResponse getDashboard() {
        List<Equipment> equipments = equipmentRepository.findAll();
        if (equipments.isEmpty()) {
            return PredictiveDashboardResponse.builder()
                    .lowCount(0)
                    .mediumCount(0)
                    .highCount(0)
                    .criticalCount(0)
                    .averageRiskScore(0.0)
                    .topRiskEquipments(List.of())
                    .build();
        }

        RiskComputationContext context = buildRiskComputationContext();
        List<PredictiveRiskResponse> risks = computeRiskResponses(equipments, context);

        long lowCount = risks.stream().filter(item -> item.getRiskLevel() == PredictiveRiskLevel.LOW).count();
        long mediumCount = risks.stream().filter(item -> item.getRiskLevel() == PredictiveRiskLevel.MEDIUM).count();
        long highCount = risks.stream().filter(item -> item.getRiskLevel() == PredictiveRiskLevel.HIGH).count();
        long criticalCount = risks.stream().filter(item -> item.getRiskLevel() == PredictiveRiskLevel.CRITICAL).count();

        double averageScore = risks.stream()
                .mapToInt(PredictiveRiskResponse::getRiskScore)
                .average()
                .orElse(0.0);

        List<PredictiveRiskResponse> topRiskEquipments = risks.stream().limit(5).toList();

        return PredictiveDashboardResponse.builder()
                .lowCount(lowCount)
                .mediumCount(mediumCount)
                .highCount(highCount)
                .criticalCount(criticalCount)
                .averageRiskScore(roundToOneDecimal(averageScore))
                .topRiskEquipments(topRiskEquipments)
                .build();
    }

    private RiskComputationContext buildRiskComputationContext() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lookbackDate = now.minusDays(LOOKBACK_DAYS);

        Map<Long, List<Breakdown>> breakdownsByEquipment = breakdownRepository.findAll().stream()
                .filter(breakdown -> breakdown.getEquipment() != null && breakdown.getEquipment().getId() != null)
                .collect(Collectors.groupingBy(breakdown -> breakdown.getEquipment().getId()));

        Map<Long, List<WorkOrder>> workOrdersByEquipment = workOrderRepository.findAll().stream()
                .filter(workOrder -> workOrder.getEquipment() != null && workOrder.getEquipment().getId() != null)
                .collect(Collectors.groupingBy(workOrder -> workOrder.getEquipment().getId()));

        return new RiskComputationContext(now, lookbackDate, breakdownsByEquipment, workOrdersByEquipment);
    }

    private List<PredictiveRiskResponse> computeRiskResponses(List<Equipment> equipments, RiskComputationContext context) {
        return equipments.stream()
                .map(equipment -> computeRiskForEquipment(equipment, context))
                .sorted(Comparator
                        .comparingInt(PredictiveRiskResponse::getRiskScore).reversed()
                        .thenComparing(PredictiveRiskResponse::getEquipmentCode, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    private PredictiveRiskResponse computeRiskForEquipment(Equipment equipment, RiskComputationContext context) {
        List<PredictiveRiskReason> reasons = new ArrayList<>();
        int score = 0;

        int criticalityPoints = pointsForCriticality(equipment.getCriticality());
        score += addReason(
                reasons,
                "CRITICALITY",
                detailForCriticality(equipment.getCriticality()),
                criticalityPoints
        );

        int statusPoints = pointsForStatus(equipment.getStatus());
        score += addReason(
                reasons,
                "STATUS",
                detailForStatus(equipment.getStatus()),
                statusPoints
        );

        List<Breakdown> equipmentBreakdowns = context.breakdownsByEquipmentId()
                .getOrDefault(equipment.getId(), List.of());
        List<WorkOrder> equipmentWorkOrders = context.workOrdersByEquipmentId()
                .getOrDefault(equipment.getId(), List.of());

        List<Breakdown> recentBreakdowns = equipmentBreakdowns.stream()
                .filter(breakdown -> breakdown.getDeclaredAt() != null && !breakdown.getDeclaredAt().isBefore(context.lookbackDate()))
                .toList();

        int breakdownPoints = pointsForRecentBreakdownVolume(recentBreakdowns.size());
        score += addReason(
                reasons,
                "BREAKDOWNS_LAST_90_DAYS",
                recentBreakdowns.size() + " panne(s) recente(s) sur les 90 derniers jours.",
                breakdownPoints
        );

        int severityPoints = pointsForRecentBreakdownSeverity(recentBreakdowns);
        score += addReason(
                reasons,
                "BREAKDOWN_SEVERITY",
                detailForRecentBreakdownSeverity(recentBreakdowns),
                severityPoints
        );

        int repetitionPoints = pointsForRepeatedBreakdownType(recentBreakdowns);
        score += addReason(
                reasons,
                "REPEATED_BREAKDOWN_TYPE",
                detailForRepeatedBreakdownType(recentBreakdowns),
                repetitionPoints
        );

        long openWorkOrders = equipmentWorkOrders.stream()
                .filter(workOrder -> OPEN_WORK_ORDER_STATUSES.contains(workOrder.getStatus()))
                .count();
        int openWorkOrderPoints = pointsForOpenWorkOrders(openWorkOrders);
        score += addReason(
                reasons,
                "OPEN_WORK_ORDERS",
                "Ordres de travail ouverts: " + openWorkOrders + ".",
                openWorkOrderPoints
        );

        long overdueWorkOrders = equipmentWorkOrders.stream()
                .filter(workOrder -> OPEN_WORK_ORDER_STATUSES.contains(workOrder.getStatus()))
                .filter(workOrder -> workOrder.getPlannedDate() != null && workOrder.getPlannedDate().isBefore(context.now()))
                .count();
        int overduePoints = pointsForOverdueWorkOrders(overdueWorkOrders);
        score += addReason(
                reasons,
                "OVERDUE_WORK_ORDERS",
                overdueWorkOrders + " ordre(s) de travail en retard (date planifiee depassee).",
                overduePoints
        );

        int preventiveMaintenancePoints = pointsForPreventiveMaintenanceOverdue(equipmentWorkOrders, context.now());
        score += addReason(
                reasons,
                "PREVENTIVE_MAINTENANCE_OVERDUE",
                detailForPreventiveMaintenanceOverdue(equipmentWorkOrders, context.now()),
                preventiveMaintenancePoints
        );

        List<InterventionReport> recentInterventionReports = findRecentInterventionReports(
                equipment,
                context.lookbackDate()
        );
        score += addInterventionReportReasons(reasons, recentInterventionReports);

        int cappedScore = Math.min(score, 100);
        PredictiveRiskLevel riskLevel = toRiskLevel(cappedScore);
        reasons.sort(Comparator.comparingInt(PredictiveRiskReason::getPoints).reversed());

        return PredictiveRiskResponse.builder()
                .equipmentId(equipment.getId())
                .equipmentCode(equipment.getCode())
                .equipmentName(equipment.getName())
                .category(equipment.getCategory())
                .location(equipment.getLocation())
                .criticality(equipment.getCriticality())
                .status(equipment.getStatus())
                .riskScore(cappedScore)
                .riskLevel(riskLevel)
                .reasons(reasons)
                .recommendedAction(recommendedActionFor(riskLevel))
                .build();
    }

    private int addReason(List<PredictiveRiskReason> reasons, String criterion, String detail, int points) {
        if (points <= 0) {
            return 0;
        }

        reasons.add(PredictiveRiskReason.builder()
                .criterion(criterion)
                .detail(detail)
                .points(points)
                .build());
        return points;
    }

    private List<InterventionReport> findRecentInterventionReports(Equipment equipment, LocalDateTime lookbackDate) {
        if (equipment.getId() == null) {
            return List.of();
        }

        List<InterventionReport> reports = interventionReportRepository
                .findTop5ByEquipmentIdOrderByClosedAtDesc(equipment.getId());
        if (reports == null || reports.isEmpty()) {
            return List.of();
        }

        return reports.stream()
                .filter(report -> report.getClosedAt() != null && !report.getClosedAt().isBefore(lookbackDate))
                .toList();
    }

    private int addInterventionReportReasons(
            List<PredictiveRiskReason> reasons,
            List<InterventionReport> recentReports
    ) {
        if (recentReports.isEmpty()) {
            return 0;
        }

        InterventionReport latestReport = recentReports.get(0);
        int points = 0;

        points += addReason(
                reasons,
                "INTERVENTION_REPORT_HISTORY",
                "Historique d'intervention recent disponible: " + recentReports.size() + " rapport(s).",
                1
        );

        if (hasDocumentedRootCause(recentReports)) {
            points += addReason(
                    reasons,
                    "INTERVENTION_REPORT_ROOT_CAUSE",
                    "Cause racine documentee dans le rapport d'intervention.",
                    1
            );
        }

        if (hasText(latestReport.getFutureRecommendations())) {
            points += addReason(
                    reasons,
                    "INTERVENTION_REPORT_RECOMMENDATION",
                    detailForFutureRecommendations(latestReport.getFutureRecommendations()),
                    3
            );
        }

        if (finalResultRequiresMonitoring(latestReport.getFinalResult())) {
            points += addReason(
                    reasons,
                    "INTERVENTION_REPORT_FINAL_RESULT",
                    detailForFinalResult(latestReport.getFinalResult()),
                    5
            );
        }

        return points;
    }

    private boolean hasDocumentedRootCause(List<InterventionReport> reports) {
        return reports.stream().anyMatch(report -> hasText(report.getRootCause()));
    }

    private String detailForFutureRecommendations(String futureRecommendations) {
        if (containsAnyNormalized(futureRecommendations, "surveillance", "a surveiller", "surveiller", "suivi")) {
            return "Dernier rapport recommande une surveillance.";
        }
        return "Dernier rapport contient des recommandations futures.";
    }

    private boolean finalResultRequiresMonitoring(String finalResult) {
        return containsAnyNormalized(finalResult, "surveillance", "a surveiller", "non resolu", "recurrent");
    }

    private String detailForFinalResult(String finalResult) {
        if (containsAnyNormalized(finalResult, "non resolu")) {
            return "Dernier rapport signale un resultat non resolu.";
        }
        if (containsAnyNormalized(finalResult, "recurrent")) {
            return "Dernier rapport signale un probleme recurrent.";
        }
        return "Dernier rapport recommande une surveillance.";
    }

    private boolean containsAnyNormalized(String value, String... keywords) {
        String normalizedValue = normalizeForMatching(value);
        if (normalizedValue.isBlank()) {
            return false;
        }

        for (String keyword : keywords) {
            if (normalizedValue.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String normalizeForMatching(String value) {
        if (value == null) {
            return "";
        }
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private int pointsForCriticality(EquipmentCriticality criticality) {
        if (criticality == null) {
            return 0;
        }

        return switch (criticality) {
            case LOW -> 0;
            case MEDIUM -> 7;
            case HIGH -> 15;
            case CRITICAL -> 22;
        };
    }

    private int pointsForStatus(EquipmentStatus status) {
        if (status == null) {
            return 0;
        }

        return switch (status) {
            case OPERATIONAL -> 0;
            case MAINTENANCE -> 14;
            case OUT_OF_SERVICE -> 26;
        };
    }

    private int pointsForRecentBreakdownVolume(long breakdownCount) {
        if (breakdownCount <= 0) {
            return 0;
        }
        if (breakdownCount <= 2) {
            return 4;
        }
        if (breakdownCount <= 5) {
            return 8;
        }
        return 12;
    }

    private int pointsForRecentBreakdownSeverity(List<Breakdown> recentBreakdowns) {
        int weightedSeverity = recentBreakdowns.stream()
                .map(Breakdown::getPriority)
                .mapToInt(this::pointsForBreakdownPriority)
                .sum();

        return Math.min(weightedSeverity, 30);
    }

    private int pointsForBreakdownPriority(BreakdownPriority priority) {
        if (priority == null) {
            return 0;
        }

        return switch (priority) {
            case LOW -> 1;
            case MEDIUM -> 3;
            case HIGH -> 7;
            case CRITICAL -> 10;
        };
    }

    private String detailForRecentBreakdownSeverity(List<Breakdown> recentBreakdowns) {
        long lowCount = countBreakdownsByPriority(recentBreakdowns, BreakdownPriority.LOW);
        long mediumCount = countBreakdownsByPriority(recentBreakdowns, BreakdownPriority.MEDIUM);
        long highCount = countBreakdownsByPriority(recentBreakdowns, BreakdownPriority.HIGH);
        long criticalCount = countBreakdownsByPriority(recentBreakdowns, BreakdownPriority.CRITICAL);
        long severeCount = highCount + criticalCount;

        if (severeCount >= 2) {
            return "Plusieurs pannes critiques recentes: " + severeCount + " panne(s) HIGH/CRITICAL.";
        }
        if (severeCount == 1) {
            return "Une panne recente a forte priorite detectee.";
        }
        if (mediumCount > 0) {
            return "Pannes recentes de gravite moyenne: " + mediumCount + " panne(s) MEDIUM.";
        }
        return "Pannes recentes majoritairement mineures: " + lowCount + " panne(s) LOW.";
    }

    private long countBreakdownsByPriority(List<Breakdown> breakdowns, BreakdownPriority priority) {
        return breakdowns.stream()
                .filter(breakdown -> breakdown.getPriority() == priority)
                .count();
    }

    private int pointsForRepeatedBreakdownType(List<Breakdown> recentBreakdowns) {
        Optional<BreakdownType> repeatedType = findDominantRepeatedBreakdownType(recentBreakdowns);
        if (repeatedType.isEmpty()) {
            return 0;
        }

        long repeatedCount = countBreakdownsByType(recentBreakdowns, repeatedType.get());
        long severeRepeatedCount = recentBreakdowns.stream()
                .filter(breakdown -> breakdown.getType() == repeatedType.get())
                .filter(breakdown -> breakdown.getPriority() == BreakdownPriority.HIGH
                        || breakdown.getPriority() == BreakdownPriority.CRITICAL)
                .count();

        if (severeRepeatedCount >= 2) {
            return 14;
        }
        if (severeRepeatedCount == 1) {
            return 10;
        }
        if (repeatedCount >= 3) {
            return 6;
        }
        return 0;
    }

    private String detailForRepeatedBreakdownType(List<Breakdown> recentBreakdowns) {
        Optional<BreakdownType> repeatedType = findDominantRepeatedBreakdownType(recentBreakdowns);
        if (repeatedType.isEmpty()) {
            return "Aucune repetition significative du meme type de panne.";
        }

        long repeatedCount = countBreakdownsByType(recentBreakdowns, repeatedType.get());
        long severeRepeatedCount = recentBreakdowns.stream()
                .filter(breakdown -> breakdown.getType() == repeatedType.get())
                .filter(breakdown -> breakdown.getPriority() == BreakdownPriority.HIGH
                        || breakdown.getPriority() == BreakdownPriority.CRITICAL)
                .count();

        if (severeRepeatedCount > 0) {
            return "Repetition du meme type de panne: " + repeatedCount + " panne(s) "
                    + repeatedType.get() + ", dont " + severeRepeatedCount + " forte(s).";
        }
        return "Pannes mineures repetees: " + repeatedCount + " panne(s) " + repeatedType.get() + ".";
    }

    private Optional<BreakdownType> findDominantRepeatedBreakdownType(List<Breakdown> recentBreakdowns) {
        return recentBreakdowns.stream()
                .filter(breakdown -> breakdown.getType() != null)
                .collect(Collectors.groupingBy(Breakdown::getType, Collectors.counting()))
                .entrySet()
                .stream()
                .filter(entry -> entry.getValue() >= 3)
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey);
    }

    private long countBreakdownsByType(List<Breakdown> breakdowns, BreakdownType type) {
        return breakdowns.stream()
                .filter(breakdown -> breakdown.getType() == type)
                .count();
    }

    private int pointsForOpenWorkOrders(long openWorkOrderCount) {
        if (openWorkOrderCount <= 0) {
            return 0;
        }
        if (openWorkOrderCount <= 2) {
            return 5;
        }
        if (openWorkOrderCount <= 4) {
            return 9;
        }
        return 12;
    }

    private int pointsForOverdueWorkOrders(long overdueWorkOrderCount) {
        if (overdueWorkOrderCount <= 0) {
            return 0;
        }
        if (overdueWorkOrderCount == 1) {
            return 5;
        }
        if (overdueWorkOrderCount == 2) {
            return 8;
        }
        return 10;
    }

    private int pointsForPreventiveMaintenanceOverdue(List<WorkOrder> workOrders, LocalDateTime now) {
        long overduePreventiveOrders = countOverduePreventiveWorkOrders(workOrders, now);
        if (overduePreventiveOrders > 0) {
            return overduePreventiveOrders == 1 ? 8 : 12;
        }

        Optional<LocalDateTime> lastPreventiveMaintenanceDate = findLastPreventiveMaintenanceDate(workOrders);
        if (lastPreventiveMaintenanceDate.isEmpty()) {
            return 10;
        }

        long days = ChronoUnit.DAYS.between(lastPreventiveMaintenanceDate.get().toLocalDate(), now.toLocalDate());
        if (days > 180) {
            return 12;
        }
        if (days > 120) {
            return 8;
        }
        if (days > 90) {
            return 5;
        }
        return 0;
    }

    private String detailForPreventiveMaintenanceOverdue(List<WorkOrder> workOrders, LocalDateTime now) {
        long overduePreventiveOrders = countOverduePreventiveWorkOrders(workOrders, now);
        if (overduePreventiveOrders > 0) {
            return "Maintenance preventive en retard: " + overduePreventiveOrders
                    + " OT preventive/inspection depasse(s).";
        }

        Optional<LocalDateTime> lastPreventiveMaintenanceDate = findLastPreventiveMaintenanceDate(workOrders);
        if (lastPreventiveMaintenanceDate.isEmpty()) {
            return "Maintenance preventive en retard: aucun historique preventive/inspection termine.";
        }

        long days = ChronoUnit.DAYS.between(lastPreventiveMaintenanceDate.get().toLocalDate(), now.toLocalDate());
        return "Maintenance preventive en retard: derniere preventive/inspection il y a " + days + " jour(s).";
    }

    private long countOverduePreventiveWorkOrders(List<WorkOrder> workOrders, LocalDateTime now) {
        return workOrders.stream()
                .filter(workOrder -> OPEN_WORK_ORDER_STATUSES.contains(workOrder.getStatus()))
                .filter(workOrder -> workOrder.getType() == WorkOrderType.PREVENTIVE
                        || workOrder.getType() == WorkOrderType.INSPECTION)
                .filter(workOrder -> workOrder.getPlannedDate() != null && workOrder.getPlannedDate().isBefore(now))
                .count();
    }

    private Optional<LocalDateTime> findLastPreventiveMaintenanceDate(List<WorkOrder> workOrders) {
        return workOrders.stream()
                .filter(workOrder -> workOrder.getStatus() == WorkOrderStatus.COMPLETED)
                .filter(workOrder -> workOrder.getCompletedAt() != null)
                .filter(workOrder -> workOrder.getType() == WorkOrderType.PREVENTIVE
                        || workOrder.getType() == WorkOrderType.INSPECTION)
                .map(WorkOrder::getCompletedAt)
                .max(LocalDateTime::compareTo);
    }

    private String detailForCriticality(EquipmentCriticality criticality) {
        if (criticality == EquipmentCriticality.CRITICAL || criticality == EquipmentCriticality.HIGH) {
            return "Criticite elevee de l'equipement: " + criticality + ".";
        }
        return "Criticite " + criticality + " de l'equipement.";
    }

    private String detailForStatus(EquipmentStatus status) {
        if (status == EquipmentStatus.OUT_OF_SERVICE) {
            return "Equipement actuellement hors service.";
        }
        if (status == EquipmentStatus.MAINTENANCE) {
            return "Equipement actuellement en maintenance.";
        }
        return "Statut actuel " + status + ".";
    }

    private PredictiveRiskLevel toRiskLevel(int riskScore) {
        if (riskScore <= 30) {
            return PredictiveRiskLevel.LOW;
        }
        if (riskScore <= 60) {
            return PredictiveRiskLevel.MEDIUM;
        }
        if (riskScore <= 80) {
            return PredictiveRiskLevel.HIGH;
        }
        return PredictiveRiskLevel.CRITICAL;
    }

    private String recommendedActionFor(PredictiveRiskLevel riskLevel) {
        return switch (riskLevel) {
            case LOW -> "Surveillance normale.";
            case MEDIUM -> "Planifier un controle preventif.";
            case HIGH -> "Intervention prioritaire recommandee.";
            case CRITICAL -> "Intervention urgente recommandee.";
        };
    }

    private double roundToOneDecimal(double value) {
        return BigDecimal.valueOf(value)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private record RiskComputationContext(
            LocalDateTime now,
            LocalDateTime lookbackDate,
            Map<Long, List<Breakdown>> breakdownsByEquipmentId,
            Map<Long, List<WorkOrder>> workOrdersByEquipmentId
    ) {
    }
}
