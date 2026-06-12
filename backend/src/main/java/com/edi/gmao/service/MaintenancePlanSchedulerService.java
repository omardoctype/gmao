package com.edi.gmao.service;

import com.edi.gmao.entity.MaintenancePlan;
import com.edi.gmao.entity.MaintenancePlanFrequency;
import com.edi.gmao.entity.MaintenancePlanType;
import com.edi.gmao.entity.WorkOrder;
import com.edi.gmao.entity.WorkOrderPriority;
import com.edi.gmao.entity.WorkOrderStatus;
import com.edi.gmao.entity.WorkOrderType;
import com.edi.gmao.repository.MaintenancePlanRepository;
import com.edi.gmao.repository.WorkOrderRepository;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class MaintenancePlanSchedulerService {

    private static final Logger LOGGER = LoggerFactory.getLogger(MaintenancePlanSchedulerService.class);

    private final MaintenancePlanRepository maintenancePlanRepository;
    private final WorkOrderRepository workOrderRepository;
    private final AuditLogService auditLogService;

    public MaintenancePlanSchedulerService(
            MaintenancePlanRepository maintenancePlanRepository,
            WorkOrderRepository workOrderRepository,
            AuditLogService auditLogService
    ) {
        this.maintenancePlanRepository = maintenancePlanRepository;
        this.workOrderRepository = workOrderRepository;
        this.auditLogService = auditLogService;
    }

    @Scheduled(
            fixedDelayString = "${app.scheduler.maintenance-plan.fixed-delay-ms:60000}",
            initialDelayString = "${app.scheduler.maintenance-plan.initial-delay-ms:15000}"
    )
    public void generateWorkOrdersForDuePlans() {
        LocalDate today = LocalDate.now();
        List<MaintenancePlan> duePlans = maintenancePlanRepository.findByNextExecutionDateLessThanEqual(today);

        if (duePlans.isEmpty()) {
            LOGGER.debug("Maintenance plan scheduler: no due plans found (<= {}).", today);
            return;
        }

        LOGGER.info("Maintenance plan scheduler: {} due plan(s) found for date <= {}.", duePlans.size(), today);

        for (MaintenancePlan plan : duePlans) {
            try {
                processDuePlan(plan);
            } catch (RuntimeException ex) {
                LOGGER.error(
                        "Maintenance plan scheduler: failed processing plan id={} dueDate={}.",
                        plan.getId(),
                        plan.getNextExecutionDate(),
                        ex
                );
            }
        }
    }

    private void processDuePlan(MaintenancePlan plan) {
        LocalDate dueDate = plan.getNextExecutionDate();
        String reference = buildReference(plan.getId(), dueDate);
        boolean alreadyExists = workOrderRepository.existsByReferenceIgnoreCase(reference);
        boolean generated = false;

        if (alreadyExists) {
            LOGGER.info(
                    "Maintenance plan scheduler: duplicate prevented for plan id={} with reference={}.",
                    plan.getId(),
                    reference
            );
        } else {
            WorkOrder workOrder = buildWorkOrder(plan, dueDate, reference);
            try {
                WorkOrder savedWorkOrder = workOrderRepository.save(workOrder);
                generated = true;
                auditLogService.record(
                        "WORK_ORDER_AUTO_GENERATED",
                        "WORK_ORDER",
                        savedWorkOrder.getId(),
                        "Auto-generated from maintenance plan #" + plan.getId() + " with reference " + savedWorkOrder.getReference()
                );
                LOGGER.info(
                        "Maintenance plan scheduler: work order {} generated from plan id={} dueDate={}.",
                        savedWorkOrder.getReference(),
                        plan.getId(),
                        dueDate
                );
            } catch (DataIntegrityViolationException ex) {
                LOGGER.warn(
                        "Maintenance plan scheduler: duplicate detected during save for plan id={} reference={}.",
                        plan.getId(),
                        reference
                );
            }
        }

        LocalDate nextExecutionDate = calculateNextExecutionDate(dueDate, plan.getFrequency());
        plan.setNextExecutionDate(nextExecutionDate);
        maintenancePlanRepository.save(plan);
        LOGGER.info(
                "Maintenance plan scheduler: plan id={} nextExecutionDate moved from {} to {} (workOrderGenerated={}).",
                plan.getId(),
                dueDate,
                nextExecutionDate,
                generated
        );
    }

    private WorkOrder buildWorkOrder(MaintenancePlan plan, LocalDate dueDate, String reference) {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setReference(reference);
        workOrder.setType(mapToWorkOrderType(plan.getType()));
        workOrder.setStatus(WorkOrderStatus.CREATED);
        workOrder.setPriority(WorkOrderPriority.MEDIUM);
        workOrder.setPlannedDate(dueDate.atStartOfDay());
        workOrder.setDescription(buildDescription(plan, dueDate));
        workOrder.setEquipment(plan.getEquipment());
        return workOrder;
    }

    private WorkOrderType mapToWorkOrderType(MaintenancePlanType planType) {
        return switch (planType) {
            case PREVENTIVE, PREDICTIVE, CONDITION_BASED -> WorkOrderType.PREVENTIVE;
            case LEGAL -> WorkOrderType.INSPECTION;
            case OTHER -> WorkOrderType.OTHER;
        };
    }

    private LocalDate calculateNextExecutionDate(LocalDate currentDate, MaintenancePlanFrequency frequency) {
        return switch (frequency) {
            case DAILY -> currentDate.plusDays(1);
            case WEEKLY -> currentDate.plusWeeks(1);
            case MONTHLY -> currentDate.plusMonths(1);
            case QUARTERLY -> currentDate.plusMonths(3);
            case SEMI_ANNUAL -> currentDate.plusMonths(6);
            case ANNUAL -> currentDate.plusYears(1);
        };
    }

    private String buildReference(Long planId, LocalDate dueDate) {
        String datePart = dueDate.format(DateTimeFormatter.BASIC_ISO_DATE);
        return ("MP-" + planId + "-" + datePart).toUpperCase(Locale.ROOT);
    }

    private String buildDescription(MaintenancePlan plan, LocalDate dueDate) {
        String rawDescription = "Auto-generated from maintenance plan #" + plan.getId()
                + " (" + plan.getType() + ", " + plan.getFrequency() + ") due on " + dueDate
                + ". " + plan.getDescription();
        return rawDescription.length() <= 2000 ? rawDescription : rawDescription.substring(0, 2000);
    }
}
