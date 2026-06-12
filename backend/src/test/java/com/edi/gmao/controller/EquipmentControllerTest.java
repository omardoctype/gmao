package com.edi.gmao.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.edi.gmao.dto.equipment.EquipmentResponse;
import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentStatus;
import com.edi.gmao.security.JwtAuthenticationFilter;
import com.edi.gmao.service.EquipmentService;
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
        controllers = EquipmentController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = JwtAuthenticationFilter.class
        )
)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class EquipmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EquipmentService equipmentService;

    @Test
    void create_shouldReturnCreated() throws Exception {
        EquipmentResponse response = EquipmentResponse.builder()
                .id(1L)
                .code("EQ-001")
                .name("Compresseur A")
                .category("Production")
                .status(EquipmentStatus.OPERATIONAL)
                .criticality(EquipmentCriticality.HIGH)
                .build();
        when(equipmentService.create(any())).thenReturn(response);

        String body = """
                {
                  "code": "EQ-001",
                  "name": "Compresseur A",
                  "category": "Production",
                  "status": "OPERATIONAL",
                  "criticality": "HIGH"
                }
                """;

        mockMvc.perform(post("/api/equipments")
                        .contentType(APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.message").value("Equipment created successfully"))
                .andExpect(jsonPath("$.data.code").value("EQ-001"));
    }

    @Test
    void findById_shouldReturnEquipment() throws Exception {
        EquipmentResponse response = EquipmentResponse.builder()
                .id(2L)
                .code("EQ-002")
                .name("Pompe B")
                .category("Utilites")
                .status(EquipmentStatus.MAINTENANCE)
                .criticality(EquipmentCriticality.MEDIUM)
                .build();
        when(equipmentService.findById(2L)).thenReturn(response);

        mockMvc.perform(get("/api/equipments/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Equipment fetched successfully"))
                .andExpect(jsonPath("$.data.id").value(2))
                .andExpect(jsonPath("$.data.code").value("EQ-002"));
    }
}
