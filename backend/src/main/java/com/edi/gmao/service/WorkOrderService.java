package com.edi.gmao.service;

import com.edi.gmao.dto.PagedResponse;
import com.edi.gmao.dto.PagedResponseMapper;
import com.edi.gmao.dto.interventionreport.InterventionReportRequest;
import com.edi.gmao.dto.interventionreport.InterventionReportResponse;
import com.edi.gmao.dto.workorder.WorkOrderRequest;
import com.edi.gmao.dto.workorder.WorkOrderResponse;
import com.edi.gmao.entity.Breakdown;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.EquipmentDocument;
import com.edi.gmao.entity.InterventionReport;
import com.edi.gmao.entity.Role;
import com.edi.gmao.entity.User;
import com.edi.gmao.entity.WorkOrder;
import com.edi.gmao.entity.WorkOrderPriority;
import com.edi.gmao.entity.WorkOrderStatus;
import com.edi.gmao.entity.WorkOrderType;
import com.edi.gmao.exception.ApiException;
import com.edi.gmao.exception.WorkOrderNotFoundException;
import com.edi.gmao.exception.WorkOrderReferenceConflictException;
import com.edi.gmao.mapper.InterventionReportMapper;
import com.edi.gmao.mapper.WorkOrderMapper;
import com.edi.gmao.repository.BreakdownRepository;
import com.edi.gmao.repository.EquipmentRepository;
import com.edi.gmao.repository.InterventionReportRepository;
import com.edi.gmao.repository.UserRepository;
import com.edi.gmao.repository.WorkOrderRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final EquipmentRepository equipmentRepository;
    private final BreakdownRepository breakdownRepository;
    private final UserRepository userRepository;
    private final InterventionReportRepository interventionReportRepository;
    private final WorkOrderMapper workOrderMapper;
    private final InterventionReportMapper interventionReportMapper;
    private final EquipmentDocumentService equipmentDocumentService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public WorkOrderService(
            WorkOrderRepository workOrderRepository,
            EquipmentRepository equipmentRepository,
            BreakdownRepository breakdownRepository,
            UserRepository userRepository,
            InterventionReportRepository interventionReportRepository,
            WorkOrderMapper workOrderMapper,
            InterventionReportMapper interventionReportMapper,
            EquipmentDocumentService equipmentDocumentService,
            AuditLogService auditLogService,
            NotificationService notificationService
    ) {
        this.workOrderRepository = workOrderRepository;
        this.equipmentRepository = equipmentRepository;
        this.breakdownRepository = breakdownRepository;
        this.userRepository = userRepository;
        this.interventionReportRepository = interventionReportRepository;
        this.workOrderMapper = workOrderMapper;
        this.interventionReportMapper = interventionReportMapper;
        this.equipmentDocumentService = equipmentDocumentService;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    @Transactional
    public WorkOrderResponse create(WorkOrderRequest request) {
        validateInitialStatus(request.getStatus());
        String normalizedReference = normalizeReference(request.getReference());
        if (workOrderRepository.existsByReferenceIgnoreCase(normalizedReference)) {
            throw new WorkOrderReferenceConflictException(normalizedReference);
        }

        Equipment equipment = getEquipmentOrThrow(request.getEquipmentId());
        Breakdown breakdown = getBreakdownOrNull(request.getBreakdownId(), equipment.getId());

        WorkOrder workOrder = workOrderMapper.toEntity(request, equipment, breakdown);
        workOrder.setReference(normalizedReference);
        if (workOrder.getStatus() == null) {
            workOrder.setStatus(WorkOrderStatus.CREATED);
        }

        WorkOrder savedWorkOrder = workOrderRepository.save(workOrder);
        auditLogService.record(
                "WORK_ORDER_CREATED",
                "WORK_ORDER",
                savedWorkOrder.getId(),
                "Work order " + savedWorkOrder.getReference() + " created"
        );
        return workOrderMapper.toResponse(savedWorkOrder);
    }

    @Transactional(readOnly = true)
    public PagedResponse<WorkOrderResponse> findAll(
            Authentication authentication,
            String search,
            WorkOrderStatus status,
            WorkOrderPriority priority,
            WorkOrderType type,
            Pageable pageable
    ) {
        Specification<WorkOrder> specification = Specification.where(hasSearch(search))
                .and(hasStatus(status))
                .and(hasPriority(priority))
                .and(hasType(type));

        if (hasAnyRole(authentication, "ROLE_ADMIN", "ROLE_RESPONSABLE_MAINTENANCE")) {
            Page<WorkOrderResponse> page = workOrderRepository.findAll(specification, pageable)
                    .map(workOrderMapper::toResponse);
            return PagedResponseMapper.fromPage(page);
        }

        if (hasRole(authentication, "ROLE_TECHNICIAN")) {
            Long technicianId = getCurrentUser(authentication).getId();
            Page<WorkOrderResponse> page = workOrderRepository.findAll(
                            specification.and(hasAssignedTechnician(technicianId)),
                            pageable
                    )
                    .map(workOrderMapper::toResponse);
            return PagedResponseMapper.fromPage(page);
        }

        throw new ApiException(HttpStatus.FORBIDDEN, "You are not allowed to access work orders");
    }

    @Transactional(readOnly = true)
    public WorkOrderResponse findById(Long id, Authentication authentication) {
        WorkOrder workOrder = getWorkOrderOrThrow(id);

        validateWorkOrderViewPermission(workOrder, authentication);

        return workOrderMapper.toResponse(workOrder);
    }

    @Transactional(readOnly = true)
    public InterventionReportResponse findReportByWorkOrderId(Long workOrderId, Authentication authentication) {
        WorkOrder workOrder = getWorkOrderOrThrow(workOrderId);
        validateWorkOrderViewPermission(workOrder, authentication);

        InterventionReport report = interventionReportRepository.findByWorkOrderId(workOrderId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Intervention report not found for work order id: " + workOrderId
                ));

        return interventionReportMapper.toResponse(report);
    }

    @Transactional
    public WorkOrderResponse update(Long id, WorkOrderRequest request) {
        WorkOrder existingWorkOrder = getWorkOrderOrThrow(id);
        Integer previousEstimatedDurationMinutes = existingWorkOrder.getEstimatedDurationMinutes();
        WorkOrderStatus previousStatus = existingWorkOrder.getStatus();
        validateStatusUpdate(previousStatus, request.getStatus());
        String requestedReference = normalizeReference(request.getReference());

        workOrderRepository.findByReferenceIgnoreCase(requestedReference)
                .filter(workOrder -> !workOrder.getId().equals(id))
                .ifPresent(workOrder -> {
                    throw new WorkOrderReferenceConflictException(requestedReference);
                });

        Equipment equipment = getEquipmentOrThrow(request.getEquipmentId());
        Breakdown breakdown = getBreakdownOrNull(request.getBreakdownId(), equipment.getId());

        workOrderMapper.applyRequestToEntity(request, existingWorkOrder, equipment, breakdown);
        existingWorkOrder.setReference(requestedReference);
        if (request.getStatus() == null) {
            existingWorkOrder.setStatus(previousStatus);
        }
        if (existingWorkOrder.getStatus() == null) {
            existingWorkOrder.setStatus(WorkOrderStatus.CREATED);
        }

        WorkOrder updatedWorkOrder = workOrderRepository.save(existingWorkOrder);
        recordEstimatedDurationChangeIfNeeded(
                updatedWorkOrder,
                previousEstimatedDurationMinutes,
                updatedWorkOrder.getEstimatedDurationMinutes()
        );
        return workOrderMapper.toResponse(updatedWorkOrder);
    }

    @Transactional
    public WorkOrderResponse assignTechnician(Long workOrderId, Long technicianId) {
        WorkOrder workOrder = getWorkOrderOrThrow(workOrderId);
        if (workOrder.getStatus() != WorkOrderStatus.CREATED && workOrder.getStatus() != WorkOrderStatus.ASSIGNED) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Technician can only be assigned while the work order is CREATED or ASSIGNED"
            );
        }

        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Technician not found with id: " + technicianId));

        boolean isTechnician = technician.getRoles().stream()
                .map(Role::getName)
                .anyMatch("TECHNICIAN"::equals);
        if (!isTechnician) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User is not a technician");
        }
        if (!technician.isActive()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Technician account is inactive");
        }

        workOrder.setAssignedTechnician(technician);
        if (workOrder.getAssignedAt() == null) {
            workOrder.setAssignedAt(LocalDateTime.now());
        }
        if (workOrder.getStatus() == WorkOrderStatus.CREATED) {
            workOrder.setStatus(WorkOrderStatus.ASSIGNED);
        }

        WorkOrder updatedWorkOrder = workOrderRepository.save(workOrder);
        auditLogService.record(
                "WORK_ORDER_ASSIGNED",
                "WORK_ORDER",
                updatedWorkOrder.getId(),
                "Technician " + technician.getEmail() + " assigned to work order " + updatedWorkOrder.getReference()
        );
        return workOrderMapper.toResponse(updatedWorkOrder);
    }

    @Transactional
    public WorkOrderResponse accept(Long workOrderId, Authentication authentication) {
        WorkOrder workOrder = getWorkOrderOrThrow(workOrderId);
        User currentUser = getCurrentUser(authentication);
        validateAssignedTechnician(workOrder, currentUser, "You can only accept your assigned work orders");

        if (workOrder.getStatus() != WorkOrderStatus.ASSIGNED) {
            throw new ApiException(HttpStatus.CONFLICT, "Only ASSIGNED work order can be accepted");
        }
        if (workOrder.getAcceptedAt() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "Work order acceptance timestamp is already set");
        }

        workOrder.setStatus(WorkOrderStatus.ACCEPTED);
        workOrder.setAcceptedAt(LocalDateTime.now());

        WorkOrder updatedWorkOrder = workOrderRepository.save(workOrder);
        auditLogService.record(
                "WORK_ORDER_ACCEPTED",
                "WORK_ORDER",
                updatedWorkOrder.getId(),
                "Ordre de travail pris en charge par le technicien."
        );
        notificationService.notifyWorkOrderAccepted(updatedWorkOrder);
        return workOrderMapper.toResponse(updatedWorkOrder);
    }

    @Transactional
    public WorkOrderResponse start(Long workOrderId, Authentication authentication) {
        WorkOrder workOrder = getWorkOrderOrThrow(workOrderId);
        User currentUser = getCurrentUser(authentication);
        validateAssignedTechnician(workOrder, currentUser, "You can only start your assigned work orders");

        if (workOrder.getStatus() != WorkOrderStatus.ACCEPTED) {
            throw new ApiException(HttpStatus.CONFLICT, "Only ACCEPTED work order can be started");
        }
        if (workOrder.getAcceptedAt() == null) {
            throw new ApiException(HttpStatus.CONFLICT, "Work order must be accepted before it can be started");
        }
        if (workOrder.getStartedAt() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "Work order start timestamp is already set");
        }

        workOrder.setStatus(WorkOrderStatus.IN_PROGRESS);
        workOrder.setStartedAt(LocalDateTime.now());

        WorkOrder updatedWorkOrder = workOrderRepository.save(workOrder);
        auditLogService.record(
                "WORK_ORDER_STARTED",
                "WORK_ORDER",
                updatedWorkOrder.getId(),
                "Intervention demarree."
        );
        notificationService.notifyWorkOrderStarted(updatedWorkOrder);
        return workOrderMapper.toResponse(updatedWorkOrder);
    }

    @Transactional
    public WorkOrderResponse close(Long workOrderId) {
        WorkOrder workOrder = getWorkOrderOrThrow(workOrderId);

        completeWorkOrder(workOrder, LocalDateTime.now());

        WorkOrder updatedWorkOrder = workOrderRepository.save(workOrder);
        recordCompletionAudit(updatedWorkOrder);
        notificationService.notifyWorkOrderCompleted(updatedWorkOrder);
        auditLogService.record(
                "WORK_ORDER_CLOSED",
                "WORK_ORDER",
                updatedWorkOrder.getId(),
                "Work order " + updatedWorkOrder.getReference() + " closed"
        );
        return workOrderMapper.toResponse(updatedWorkOrder);
    }

    @Transactional
    public InterventionReportResponse closeWithReport(
            Long workOrderId,
            InterventionReportRequest request,
            Authentication authentication
    ) {
        WorkOrder workOrder = getWorkOrderOrThrow(workOrderId);
        User currentUser = getCurrentUser(authentication);
        validateAssignedTechnician(workOrder, currentUser, "You can only complete your assigned work orders");

        if (interventionReportRepository.existsByWorkOrderId(workOrderId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Intervention report already exists for this work order");
        }

        LocalDateTime now = LocalDateTime.now();
        completeWorkOrder(workOrder, now);

        InterventionReport report = new InterventionReport();
        report.setWorkOrder(workOrder);
        report.setEquipment(workOrder.getEquipment());
        report.setBreakdown(workOrder.getBreakdown());
        report.setTechnician(currentUser);
        report.setPerformedTasks(normalizeRequiredText(request.getPerformedTasks()));
        report.setRealDiagnosis(normalizeOptionalText(request.getRealDiagnosis()));
        report.setRootCause(normalizeOptionalText(request.getRootCause()));
        report.setUsedParts(normalizeOptionalText(request.getUsedParts()));
        report.setInterventionDurationMinutes(request.getInterventionDurationMinutes());
        report.setFinalResult(normalizeRequiredText(request.getFinalResult()));
        report.setFutureRecommendations(normalizeOptionalText(request.getFutureRecommendations()));
        report.setClosedAt(now);

        workOrderRepository.save(workOrder);
        InterventionReport savedReport = interventionReportRepository.save(report);

        String markdown = buildInterventionReportMarkdown(savedReport);
        String originalFileName = buildInterventionReportFileName(workOrder);
        EquipmentDocument document = equipmentDocumentService.createInterventionReportDocument(
                workOrder.getEquipment(),
                originalFileName,
                markdown
        );
        savedReport.setEquipmentDocument(document);
        InterventionReport completedReport = interventionReportRepository.save(savedReport);

        recordCompletionAudit(workOrder);
        notificationService.notifyWorkOrderCompleted(workOrder);
        auditLogService.record(
                "WORK_ORDER_CLOSED_WITH_REPORT",
                "WORK_ORDER",
                workOrder.getId(),
                "Work order " + workOrder.getReference() + " closed with intervention report "
                        + completedReport.getId()
        );
        return interventionReportMapper.toResponse(completedReport);
    }

    private WorkOrder getWorkOrderOrThrow(Long id) {
        return workOrderRepository.findById(id)
                .orElseThrow(() -> new WorkOrderNotFoundException(id));
    }

    private Equipment getEquipmentOrThrow(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Equipment not found with id: " + id));
    }

    private Breakdown getBreakdownOrNull(Long breakdownId, Long equipmentId) {
        if (breakdownId == null) {
            return null;
        }

        Breakdown breakdown = breakdownRepository.findById(breakdownId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Breakdown not found with id: " + breakdownId));

        if (!breakdown.getEquipment().getId().equals(equipmentId)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Breakdown does not belong to the selected equipment"
            );
        }
        return breakdown;
    }

    private User getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Current user not found"));
    }

    private void validateInitialStatus(WorkOrderStatus requestedStatus) {
        if (requestedStatus == null || requestedStatus == WorkOrderStatus.CREATED
                || requestedStatus == WorkOrderStatus.ASSIGNED || requestedStatus == WorkOrderStatus.CANCELLED) {
            return;
        }

        throw new ApiException(
                HttpStatus.CONFLICT,
                "Intervention status must be changed through accept, start or complete endpoints"
        );
    }

    private void validateStatusUpdate(WorkOrderStatus currentStatus, WorkOrderStatus requestedStatus) {
        if (requestedStatus == null || requestedStatus == currentStatus) {
            return;
        }
        if (currentStatus == WorkOrderStatus.COMPLETED) {
            throw new ApiException(HttpStatus.CONFLICT, "Completed work order status cannot be changed");
        }
        if (requestedStatus == WorkOrderStatus.ACCEPTED
                || requestedStatus == WorkOrderStatus.IN_PROGRESS
                || requestedStatus == WorkOrderStatus.COMPLETED) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Intervention status must be changed through accept, start or complete endpoints"
            );
        }
    }

    private void validateAssignedTechnician(WorkOrder workOrder, User currentUser, String message) {
        if (workOrder.getAssignedTechnician() == null
                || !workOrder.getAssignedTechnician().getId().equals(currentUser.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, message);
        }
    }

    private void validateWorkOrderViewPermission(WorkOrder workOrder, Authentication authentication) {
        if (hasRole(authentication, "ROLE_TECHNICIAN")
                && !hasAnyRole(authentication, "ROLE_ADMIN", "ROLE_RESPONSABLE_MAINTENANCE")) {
            User currentUser = getCurrentUser(authentication);
            if (workOrder.getAssignedTechnician() == null
                    || !workOrder.getAssignedTechnician().getId().equals(currentUser.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "You can only access your assigned work orders");
            }
        }
    }

    private void completeWorkOrder(WorkOrder workOrder, LocalDateTime completedAt) {
        if (workOrder.getStatus() != WorkOrderStatus.IN_PROGRESS) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Only IN_PROGRESS work order can be completed"
            );
        }
        if (workOrder.getStartedAt() == null) {
            throw new ApiException(HttpStatus.CONFLICT, "Work order must be started before it can be completed");
        }
        if (workOrder.getCompletedAt() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "Work order completion timestamp is already set");
        }

        int actualDurationMinutes = calculateActualDurationMinutes(workOrder.getStartedAt(), completedAt);
        workOrder.setStatus(WorkOrderStatus.COMPLETED);
        workOrder.setCompletedAt(completedAt);
        workOrder.setActualDurationMinutes(actualDurationMinutes);
    }

    private int calculateActualDurationMinutes(LocalDateTime startedAt, LocalDateTime completedAt) {
        long minutes = Duration.between(startedAt, completedAt).toMinutes();
        if (minutes < 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Actual duration cannot be negative");
        }
        if (minutes > Integer.MAX_VALUE) {
            throw new ApiException(HttpStatus.CONFLICT, "Actual duration exceeds supported range");
        }
        return (int) minutes;
    }

    private void recordCompletionAudit(WorkOrder workOrder) {
        auditLogService.record(
                "WORK_ORDER_COMPLETED",
                "WORK_ORDER",
                workOrder.getId(),
                "Intervention cloturee. Duree reelle calculee : "
                        + workOrder.getActualDurationMinutes() + " minutes."
        );
        auditLogService.record(
                "WORK_ORDER_ACTUAL_DURATION_CALCULATED",
                "WORK_ORDER",
                workOrder.getId(),
                "Duree reelle calculee : " + workOrder.getActualDurationMinutes() + " minutes."
        );
    }

    private void recordEstimatedDurationChangeIfNeeded(
            WorkOrder workOrder,
            Integer previousEstimatedDurationMinutes,
            Integer updatedEstimatedDurationMinutes
    ) {
        if (Objects.equals(previousEstimatedDurationMinutes, updatedEstimatedDurationMinutes)) {
            return;
        }

        auditLogService.record(
                "WORK_ORDER_ESTIMATED_DURATION_CHANGED",
                "WORK_ORDER",
                workOrder.getId(),
                "Duree estimee modifiee : "
                        + (updatedEstimatedDurationMinutes == null
                        ? "Non renseignee"
                        : updatedEstimatedDurationMinutes + " minutes")
                        + "."
        );
    }

    private String normalizeReference(String reference) {
        return reference == null ? null : reference.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeRequiredText(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String buildInterventionReportFileName(WorkOrder workOrder) {
        return "rapport_intervention_"
                + sanitizeFileNamePart(workOrder.getEquipment().getCode())
                + "_"
                + sanitizeFileNamePart(workOrder.getReference())
                + ".md";
    }

    private String buildInterventionReportMarkdown(InterventionReport report) {
        WorkOrder workOrder = report.getWorkOrder();
        Equipment equipment = report.getEquipment();
        Breakdown breakdown = report.getBreakdown();
        User technician = report.getTechnician();

        StringBuilder markdown = new StringBuilder();
        markdown.append("# Rapport d'intervention - ").append(safeValue(workOrder.getReference())).append("\n\n");
        markdown.append("## Identification\n");
        markdown.append("- Rapport ID: ").append(report.getId()).append("\n");
        markdown.append("- Ordre de travail: ").append(safeValue(workOrder.getReference())).append("\n");
        markdown.append("- Equipement: ")
                .append(safeValue(equipment.getCode()))
                .append(" - ")
                .append(safeValue(equipment.getName()))
                .append("\n");
        markdown.append("- Panne liee: ")
                .append(breakdown == null ? "Non renseignee" : safeValue(breakdown.getReference()))
                .append("\n");
        markdown.append("- Technicien: ").append(formatUserName(technician)).append("\n");
        markdown.append("- Date de cloture: ").append(report.getClosedAt()).append("\n");
        markdown.append("- Duree intervention: ")
                .append(report.getInterventionDurationMinutes() == null
                        ? "Non renseignee"
                        : report.getInterventionDurationMinutes() + " minutes")
                .append("\n\n");

        markdown.append("## Travaux effectues\n");
        markdown.append(safeValue(report.getPerformedTasks())).append("\n\n");

        markdown.append("## Diagnostic reel constate\n");
        markdown.append(safeValue(report.getRealDiagnosis())).append("\n\n");

        markdown.append("## Cause racine\n");
        markdown.append(safeValue(report.getRootCause())).append("\n\n");

        markdown.append("## Pieces utilisees\n");
        markdown.append(safeValue(report.getUsedParts())).append("\n\n");

        markdown.append("## Resultat final\n");
        markdown.append(safeValue(report.getFinalResult())).append("\n\n");

        markdown.append("## Recommandations futures\n");
        markdown.append(safeValue(report.getFutureRecommendations())).append("\n\n");

        markdown.append("## Informations utiles pour le RAG\n");
        markdown.append("- Source: rapport intervention terrain.\n");
        markdown.append("- Identifiants: ")
                .append(safeValue(equipment.getCode()))
                .append(", ")
                .append(safeValue(workOrder.getReference()))
                .append(".\n");
        if (breakdown != null) {
            markdown.append("- Panne: ").append(safeValue(breakdown.getReference())).append(".\n");
        }

        return markdown.toString();
    }

    private String safeValue(String value) {
        if (value == null || value.isBlank()) {
            return "Non renseigne";
        }
        return value.trim();
    }

    private String formatUserName(User user) {
        if (user == null) {
            return "Non renseigne";
        }
        String fullName = (safeValue(user.getFirstName()) + " " + safeValue(user.getLastName())).trim();
        if (fullName.isBlank() || fullName.contains("Non renseigne")) {
            return safeValue(user.getEmail());
        }
        return fullName;
    }

    private String sanitizeFileNamePart(String value) {
        if (value == null || value.isBlank()) {
            return "UNKNOWN";
        }
        String sanitized = value.trim().replaceAll("[^a-zA-Z0-9_-]", "_");
        sanitized = sanitized.replaceAll("_+", "_");
        if (sanitized.isBlank()) {
            return "UNKNOWN";
        }
        return sanitized;
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role::equals);
    }

    private boolean hasAnyRole(Authentication authentication, String... roles) {
        for (String role : roles) {
            if (hasRole(authentication, role)) {
                return true;
            }
        }
        return false;
    }

    private Specification<WorkOrder> hasStatus(WorkOrderStatus status) {
        return (root, query, criteriaBuilder) -> status == null
                ? null
                : criteriaBuilder.equal(root.get("status"), status);
    }

    private Specification<WorkOrder> hasSearch(String search) {
        return (root, query, criteriaBuilder) -> {
            if (search == null || search.isBlank()) {
                return null;
            }

            String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("reference")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("type").as(String.class)), pattern)
            );
        };
    }

    private Specification<WorkOrder> hasPriority(WorkOrderPriority priority) {
        return (root, query, criteriaBuilder) -> priority == null
                ? null
                : criteriaBuilder.equal(root.get("priority"), priority);
    }

    private Specification<WorkOrder> hasType(WorkOrderType type) {
        return (root, query, criteriaBuilder) -> type == null
                ? null
                : criteriaBuilder.equal(root.get("type"), type);
    }

    private Specification<WorkOrder> hasAssignedTechnician(Long technicianId) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(
                root.get("assignedTechnician").get("id"),
                technicianId
        );
    }
}
