package com.edi.gmao.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.edi.gmao.dto.interventionreport.InterventionReportRequest;
import com.edi.gmao.dto.interventionreport.InterventionReportResponse;
import com.edi.gmao.dto.workorder.WorkOrderRequest;
import com.edi.gmao.dto.workorder.WorkOrderResponse;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentDocument;
import com.edi.gmao.entity.EquipmentStatus;
import com.edi.gmao.entity.InterventionReport;
import com.edi.gmao.entity.Role;
import com.edi.gmao.entity.User;
import com.edi.gmao.entity.WorkOrder;
import com.edi.gmao.entity.WorkOrderPriority;
import com.edi.gmao.entity.WorkOrderStatus;
import com.edi.gmao.entity.WorkOrderType;
import com.edi.gmao.exception.ApiException;
import com.edi.gmao.mapper.EquipmentDocumentMapper;
import com.edi.gmao.mapper.InterventionReportMapper;
import com.edi.gmao.mapper.WorkOrderMapper;
import com.edi.gmao.repository.BreakdownRepository;
import com.edi.gmao.repository.EquipmentRepository;
import com.edi.gmao.repository.InterventionReportRepository;
import com.edi.gmao.repository.UserRepository;
import com.edi.gmao.repository.WorkOrderRepository;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@ExtendWith(MockitoExtension.class)
class WorkOrderServiceTest {

    @Mock
    private WorkOrderRepository workOrderRepository;
    @Mock
    private EquipmentRepository equipmentRepository;
    @Mock
    private BreakdownRepository breakdownRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private InterventionReportRepository interventionReportRepository;
    @Mock
    private EquipmentDocumentService equipmentDocumentService;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private NotificationService notificationService;

    private WorkOrderService workOrderService;

    @BeforeEach
    void setUp() {
        workOrderService = new WorkOrderService(
                workOrderRepository,
                equipmentRepository,
                breakdownRepository,
                userRepository,
                interventionReportRepository,
                new WorkOrderMapper(),
                new InterventionReportMapper(new EquipmentDocumentMapper()),
                equipmentDocumentService,
                auditLogService,
                notificationService
        );
    }

    @Test
    void create_shouldSaveWorkOrderAndRecordAudit() {
        Equipment equipment = buildEquipment(1L, "EQ-001", "Compresseur");

        WorkOrderRequest request = new WorkOrderRequest();
        request.setReference(" ot-001 ");
        request.setType(WorkOrderType.CORRECTIVE);
        request.setPriority(WorkOrderPriority.HIGH);
        request.setDescription("Intervention corrective");
        request.setEquipmentId(1L);

        when(workOrderRepository.existsByReferenceIgnoreCase("OT-001")).thenReturn(false);
        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(equipment));
        when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(invocation -> {
            WorkOrder workOrder = invocation.getArgument(0);
            workOrder.setId(100L);
            return workOrder;
        });

        WorkOrderResponse response = workOrderService.create(request);

        assertEquals(100L, response.getId());
        assertEquals("OT-001", response.getReference());
        verify(auditLogService).record(
                eq("WORK_ORDER_CREATED"),
                eq("WORK_ORDER"),
                eq(100L),
                eq("Work order OT-001 created")
        );
    }

    @Test
    void assignTechnician_shouldAssignAndRecordAudit() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setId(200L);
        workOrder.setReference("OT-200");
        workOrder.setStatus(WorkOrderStatus.CREATED);
        workOrder.setEquipment(buildEquipment(2L, "EQ-002", "Pompe"));

        Role technicianRole = new Role();
        technicianRole.setName("TECHNICIAN");

        User technician = new User();
        technician.setId(9L);
        technician.setFirstName("Ali");
        technician.setLastName("Mansour");
        technician.setEmail("ali@gmao.com");
        technician.setActive(true);
        technician.setRoles(Set.of(technicianRole));

        when(workOrderRepository.findById(200L)).thenReturn(Optional.of(workOrder));
        when(userRepository.findById(9L)).thenReturn(Optional.of(technician));
        when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WorkOrderResponse response = workOrderService.assignTechnician(200L, 9L);

        assertEquals(WorkOrderStatus.ASSIGNED, response.getStatus());
        assertEquals(9L, response.getAssignedTechnicianId());
        verify(auditLogService).record(
                eq("WORK_ORDER_ASSIGNED"),
                eq("WORK_ORDER"),
                eq(200L),
                eq("Technician ali@gmao.com assigned to work order OT-200")
        );
    }

    @Test
    void accept_shouldSetAcceptedStatusTimestampAuditAndNotification() {
        Equipment equipment = buildEquipment(5L, "EQ-005", "Pompe");
        User technician = buildTechnician(21L, "tech@gmao.com");

        WorkOrder workOrder = new WorkOrder();
        workOrder.setId(500L);
        workOrder.setReference("OT-500");
        workOrder.setStatus(WorkOrderStatus.ASSIGNED);
        workOrder.setEquipment(equipment);
        workOrder.setAssignedTechnician(technician);

        when(workOrderRepository.findById(500L)).thenReturn(Optional.of(workOrder));
        when(userRepository.findByEmailIgnoreCase("tech@gmao.com")).thenReturn(Optional.of(technician));
        when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WorkOrderResponse response = workOrderService.accept(500L, authenticationFor("tech@gmao.com"));

        assertEquals(WorkOrderStatus.ACCEPTED, response.getStatus());
        assertNotNull(response.getAcceptedAt());
        verify(auditLogService).record(
                eq("WORK_ORDER_ACCEPTED"),
                eq("WORK_ORDER"),
                eq(500L),
                eq("Ordre de travail pris en charge par le technicien.")
        );
        verify(notificationService).notifyWorkOrderAccepted(any(WorkOrder.class));
    }

    @Test
    void start_shouldRequireAcceptedWorkOrderAndSetStartedAt() {
        Equipment equipment = buildEquipment(6L, "EQ-006", "Moteur");
        User technician = buildTechnician(22L, "tech@gmao.com");

        WorkOrder workOrder = new WorkOrder();
        workOrder.setId(600L);
        workOrder.setReference("OT-600");
        workOrder.setStatus(WorkOrderStatus.ACCEPTED);
        workOrder.setAcceptedAt(java.time.LocalDateTime.now().minusMinutes(10));
        workOrder.setEquipment(equipment);
        workOrder.setAssignedTechnician(technician);

        when(workOrderRepository.findById(600L)).thenReturn(Optional.of(workOrder));
        when(userRepository.findByEmailIgnoreCase("tech@gmao.com")).thenReturn(Optional.of(technician));
        when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WorkOrderResponse response = workOrderService.start(600L, authenticationFor("tech@gmao.com"));

        assertEquals(WorkOrderStatus.IN_PROGRESS, response.getStatus());
        assertNotNull(response.getStartedAt());
        verify(auditLogService).record(
                eq("WORK_ORDER_STARTED"),
                eq("WORK_ORDER"),
                eq(600L),
                eq("Intervention demarree.")
        );
        verify(notificationService).notifyWorkOrderStarted(any(WorkOrder.class));
    }

    @Test
    void accept_shouldRejectWorkOrderAssignedToAnotherTechnician() {
        User assignedTechnician = buildTechnician(31L, "assigned@gmao.com");
        User otherTechnician = buildTechnician(32L, "other@gmao.com");

        WorkOrder workOrder = new WorkOrder();
        workOrder.setId(700L);
        workOrder.setReference("OT-700");
        workOrder.setStatus(WorkOrderStatus.ASSIGNED);
        workOrder.setEquipment(buildEquipment(7L, "EQ-007", "Four"));
        workOrder.setAssignedTechnician(assignedTechnician);

        when(workOrderRepository.findById(700L)).thenReturn(Optional.of(workOrder));
        when(userRepository.findByEmailIgnoreCase("other@gmao.com")).thenReturn(Optional.of(otherTechnician));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> workOrderService.accept(700L, authenticationFor("other@gmao.com"))
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    }

    @Test
    void start_shouldRejectBeforeAcceptance() {
        User technician = buildTechnician(41L, "tech@gmao.com");

        WorkOrder workOrder = new WorkOrder();
        workOrder.setId(800L);
        workOrder.setReference("OT-800");
        workOrder.setStatus(WorkOrderStatus.ASSIGNED);
        workOrder.setEquipment(buildEquipment(8L, "EQ-008", "Robot"));
        workOrder.setAssignedTechnician(technician);

        when(workOrderRepository.findById(800L)).thenReturn(Optional.of(workOrder));
        when(userRepository.findByEmailIgnoreCase("tech@gmao.com")).thenReturn(Optional.of(technician));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> workOrderService.start(800L, authenticationFor("tech@gmao.com"))
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
    }

    @Test
    void close_shouldCompleteWorkOrderAndRecordAudit() {
        WorkOrder workOrder = new WorkOrder();
        workOrder.setId(300L);
        workOrder.setReference("OT-300");
        workOrder.setStatus(WorkOrderStatus.IN_PROGRESS);
        workOrder.setStartedAt(java.time.LocalDateTime.now().minusMinutes(145));
        workOrder.setEquipment(buildEquipment(3L, "EQ-003", "Convoyeur"));

        when(workOrderRepository.findById(300L)).thenReturn(Optional.of(workOrder));
        when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WorkOrderResponse response = workOrderService.close(300L);

        assertEquals(WorkOrderStatus.COMPLETED, response.getStatus());
        assertNotNull(response.getCompletedAt());
        assertEquals(145, response.getActualDurationMinutes());
        verify(notificationService).notifyWorkOrderCompleted(any(WorkOrder.class));
        verify(auditLogService).record(
                eq("WORK_ORDER_CLOSED"),
                eq("WORK_ORDER"),
                eq(300L),
                eq("Work order OT-300 closed")
        );
    }

    @Test
    void closeWithReport_shouldCompleteWorkOrderSaveReportAndAttachDocument() {
        Equipment equipment = buildEquipment(4L, "EQ-004", "Moteur");

        User technician = new User();
        technician.setId(12L);
        technician.setFirstName("Tech");
        technician.setLastName("Gmao");
        technician.setEmail("tech@gmao.com");

        WorkOrder workOrder = new WorkOrder();
        workOrder.setId(400L);
        workOrder.setReference("OT-400");
        workOrder.setStatus(WorkOrderStatus.IN_PROGRESS);
        workOrder.setStartedAt(java.time.LocalDateTime.now().minusMinutes(75));
        workOrder.setEquipment(equipment);
        workOrder.setAssignedTechnician(technician);

        InterventionReportRequest request = new InterventionReportRequest();
        request.setPerformedTasks("Controle moteur et remplacement courroie.");
        request.setFinalResult("Equipement remis en service.");
        request.setInterventionDurationMinutes(75);

        EquipmentDocument document = new EquipmentDocument();
        document.setId(88L);
        document.setOriginalFileName("rapport_intervention_EQ-004_OT-400.md");
        document.setStoredFileName("stored.md");
        document.setContentType("text/markdown");
        document.setSize(500L);
        document.setDocumentType(com.edi.gmao.entity.EquipmentDocumentType.RAPPORT_INTERVENTION);
        document.setStoragePath("4/stored.md");
        document.setUploadedAt(java.time.Instant.now());
        document.setEquipment(equipment);

        when(workOrderRepository.findById(400L)).thenReturn(Optional.of(workOrder));
        when(userRepository.findByEmailIgnoreCase("tech@gmao.com")).thenReturn(Optional.of(technician));
        when(interventionReportRepository.existsByWorkOrderId(400L)).thenReturn(false);
        when(workOrderRepository.save(any(WorkOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(interventionReportRepository.save(any(InterventionReport.class))).thenAnswer(invocation -> {
            InterventionReport report = invocation.getArgument(0);
            if (report.getId() == null) {
                report.setId(501L);
            }
            if (report.getCreatedAt() == null) {
                report.setCreatedAt(report.getClosedAt());
            }
            return report;
        });
        when(equipmentDocumentService.createInterventionReportDocument(eq(equipment), any(String.class), any(String.class)))
                .thenReturn(document);

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                "tech@gmao.com",
                null,
                Set.of(new SimpleGrantedAuthority("ROLE_TECHNICIAN"))
        );

        InterventionReportResponse response = workOrderService.closeWithReport(400L, request, authentication);

        assertEquals(WorkOrderStatus.COMPLETED, workOrder.getStatus());
        assertNotNull(workOrder.getCompletedAt());
        assertEquals(75, workOrder.getActualDurationMinutes());
        assertEquals(501L, response.getId());
        assertEquals(400L, response.getWorkOrderId());
        assertEquals(88L, response.getEquipmentDocument().getId());
        verify(auditLogService).record(
                eq("WORK_ORDER_CLOSED_WITH_REPORT"),
                eq("WORK_ORDER"),
                eq(400L),
                eq("Work order OT-400 closed with intervention report 501")
        );
        verify(notificationService).notifyWorkOrderCompleted(any(WorkOrder.class));
    }

    @Test
    void closeWithReport_shouldRejectCompletionBeforeStart() {
        User technician = buildTechnician(51L, "tech@gmao.com");

        WorkOrder workOrder = new WorkOrder();
        workOrder.setId(900L);
        workOrder.setReference("OT-900");
        workOrder.setStatus(WorkOrderStatus.IN_PROGRESS);
        workOrder.setEquipment(buildEquipment(9L, "EQ-009", "Ventilation"));
        workOrder.setAssignedTechnician(technician);

        InterventionReportRequest request = new InterventionReportRequest();
        request.setPerformedTasks("Controle general.");
        request.setFinalResult("Equipement remis en service.");

        when(workOrderRepository.findById(900L)).thenReturn(Optional.of(workOrder));
        when(userRepository.findByEmailIgnoreCase("tech@gmao.com")).thenReturn(Optional.of(technician));
        when(interventionReportRepository.existsByWorkOrderId(900L)).thenReturn(false);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> workOrderService.closeWithReport(900L, request, authenticationFor("tech@gmao.com"))
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
    }

    private Equipment buildEquipment(Long id, String code, String name) {
        Equipment equipment = new Equipment();
        equipment.setId(id);
        equipment.setCode(code);
        equipment.setName(name);
        equipment.setCategory("Production");
        equipment.setStatus(EquipmentStatus.OPERATIONAL);
        equipment.setCriticality(EquipmentCriticality.MEDIUM);
        return equipment;
    }

    private User buildTechnician(Long id, String email) {
        User technician = new User();
        technician.setId(id);
        technician.setFirstName("Tech");
        technician.setLastName("Gmao");
        technician.setEmail(email);
        technician.setActive(true);
        return technician;
    }

    private UsernamePasswordAuthenticationToken authenticationFor(String email) {
        return new UsernamePasswordAuthenticationToken(
                email,
                null,
                Set.of(new SimpleGrantedAuthority("ROLE_TECHNICIAN"))
        );
    }
}
