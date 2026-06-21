package com.edi.gmao.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.edi.gmao.dto.interventionreport.InterventionReportResponse;
import com.edi.gmao.dto.workorder.WorkOrderResponse;
import com.edi.gmao.entity.WorkOrderPriority;
import com.edi.gmao.entity.WorkOrderStatus;
import com.edi.gmao.entity.WorkOrderType;
import com.edi.gmao.security.JwtAuthenticationFilter;
import com.edi.gmao.service.WorkOrderService;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
        controllers = WorkOrderController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = JwtAuthenticationFilter.class
        )
)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class WorkOrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private WorkOrderService workOrderService;

    @Test
    void create_shouldReturnCreatedWorkOrder() throws Exception {
        WorkOrderResponse response = WorkOrderResponse.builder()
                .id(50L)
                .reference("OT-050")
                .type(WorkOrderType.CORRECTIVE)
                .status(WorkOrderStatus.CREATED)
                .priority(WorkOrderPriority.HIGH)
                .createdAt(LocalDateTime.now())
                .equipmentId(1L)
                .equipmentCode("EQ-001")
                .equipmentName("Compresseur")
                .description("Intervention corrective")
                .build();
        when(workOrderService.create(any())).thenReturn(response);

        String body = """
                {
                  "reference": "OT-050",
                  "type": "CORRECTIVE",
                  "priority": "HIGH",
                  "description": "Intervention corrective",
                  "equipmentId": 1
                }
                """;

        mockMvc.perform(post("/api/work-orders")
                        .contentType(APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.data.reference").value("OT-050"));
    }

    @Test
    void assign_shouldReturnAssignedWorkOrder() throws Exception {
        WorkOrderResponse response = WorkOrderResponse.builder()
                .id(50L)
                .reference("OT-050")
                .type(WorkOrderType.CORRECTIVE)
                .status(WorkOrderStatus.ASSIGNED)
                .priority(WorkOrderPriority.HIGH)
                .createdAt(LocalDateTime.now())
                .equipmentId(1L)
                .equipmentCode("EQ-001")
                .equipmentName("Compresseur")
                .assignedTechnicianId(7L)
                .assignedTechnicianName("Ali Mansour")
                .description("Intervention corrective")
                .build();
        when(workOrderService.assignTechnician(any(Long.class), any(Long.class))).thenReturn(response);

        mockMvc.perform(patch("/api/work-orders/50/assign/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.data.assignedTechnicianId").value(7));
    }

    @Test
    void accept_shouldReturnAcceptedWorkOrder() throws Exception {
        WorkOrderResponse response = WorkOrderResponse.builder()
                .id(50L)
                .reference("OT-050")
                .type(WorkOrderType.CORRECTIVE)
                .status(WorkOrderStatus.ACCEPTED)
                .priority(WorkOrderPriority.HIGH)
                .createdAt(LocalDateTime.now())
                .acceptedAt(LocalDateTime.now())
                .equipmentId(1L)
                .equipmentCode("EQ-001")
                .equipmentName("Compresseur")
                .assignedTechnicianId(7L)
                .assignedTechnicianName("Ali Mansour")
                .description("Intervention corrective")
                .build();
        when(workOrderService.accept(any(Long.class), any())).thenReturn(response);

        mockMvc.perform(post("/api/work-orders/50/accept"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.data.acceptedAt").exists());
    }

    @Test
    void start_shouldReturnStartedWorkOrder() throws Exception {
        WorkOrderResponse response = WorkOrderResponse.builder()
                .id(50L)
                .reference("OT-050")
                .type(WorkOrderType.CORRECTIVE)
                .status(WorkOrderStatus.IN_PROGRESS)
                .priority(WorkOrderPriority.HIGH)
                .createdAt(LocalDateTime.now())
                .acceptedAt(LocalDateTime.now().minusMinutes(10))
                .startedAt(LocalDateTime.now())
                .equipmentId(1L)
                .equipmentCode("EQ-001")
                .equipmentName("Compresseur")
                .assignedTechnicianId(7L)
                .assignedTechnicianName("Ali Mansour")
                .description("Intervention corrective")
                .build();
        when(workOrderService.start(any(Long.class), any())).thenReturn(response);

        mockMvc.perform(post("/api/work-orders/50/start"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.data.startedAt").exists());
    }

    @Test
    void close_shouldReturnClosedWorkOrder() throws Exception {
        WorkOrderResponse response = WorkOrderResponse.builder()
                .id(50L)
                .reference("OT-050")
                .type(WorkOrderType.CORRECTIVE)
                .status(WorkOrderStatus.COMPLETED)
                .priority(WorkOrderPriority.HIGH)
                .createdAt(LocalDateTime.now())
                .completedAt(LocalDateTime.now())
                .equipmentId(1L)
                .equipmentCode("EQ-001")
                .equipmentName("Compresseur")
                .description("Intervention corrective")
                .build();
        when(workOrderService.close(any(Long.class))).thenReturn(response);

        mockMvc.perform(patch("/api/work-orders/50/close"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));
    }

    @Test
    void closeWithReport_shouldReturnInterventionReport() throws Exception {
        InterventionReportResponse response = InterventionReportResponse.builder()
                .id(77L)
                .workOrderId(50L)
                .workOrderReference("OT-050")
                .equipmentId(1L)
                .equipmentCode("EQ-001")
                .equipmentName("Compresseur")
                .technicianId(7L)
                .technicianName("Ali Mansour")
                .performedTasks("Controle, remplacement et essais.")
                .finalResult("Equipement remis en service.")
                .closedAt(LocalDateTime.now())
                .build();
        when(workOrderService.closeWithReport(any(Long.class), any(), any())).thenReturn(response);

        String body = """
                {
                  "performedTasks": "Controle, remplacement et essais.",
                  "finalResult": "Equipement remis en service.",
                  "interventionDurationMinutes": 60
                }
                """;

        mockMvc.perform(patch("/api/work-orders/50/close-with-report")
                        .contentType(APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(77))
                .andExpect(jsonPath("$.data.workOrderReference").value("OT-050"));
    }

    @Test
    void complete_shouldReturnInterventionReport() throws Exception {
        InterventionReportResponse response = InterventionReportResponse.builder()
                .id(88L)
                .workOrderId(50L)
                .workOrderReference("OT-050")
                .equipmentId(1L)
                .equipmentCode("EQ-001")
                .equipmentName("Compresseur")
                .technicianId(7L)
                .technicianName("Ali Mansour")
                .performedTasks("Controle, remplacement et essais.")
                .finalResult("Equipement remis en service.")
                .closedAt(LocalDateTime.now())
                .build();
        when(workOrderService.closeWithReport(any(Long.class), any(), any())).thenReturn(response);

        String body = """
                {
                  "performedTasks": "Controle, remplacement et essais.",
                  "finalResult": "Equipement remis en service.",
                  "interventionDurationMinutes": 60
                }
                """;

        mockMvc.perform(post("/api/work-orders/50/complete")
                        .contentType(APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(88))
                .andExpect(jsonPath("$.data.workOrderReference").value("OT-050"));
    }
}
