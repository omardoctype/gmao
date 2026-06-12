package com.edi.gmao.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.edi.gmao.dto.breakdown.BreakdownResponse;
import com.edi.gmao.entity.BreakdownPriority;
import com.edi.gmao.entity.BreakdownStatus;
import com.edi.gmao.entity.BreakdownType;
import com.edi.gmao.security.JwtAuthenticationFilter;
import com.edi.gmao.service.BreakdownService;
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
        controllers = BreakdownController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = JwtAuthenticationFilter.class
        )
)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class BreakdownControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BreakdownService breakdownService;

    @Test
    void create_shouldReturnCreatedBreakdown() throws Exception {
        BreakdownResponse response = BreakdownResponse.builder()
                .id(12L)
                .reference("BR-012")
                .title("Arret ligne")
                .description("Panne critique")
                .type(BreakdownType.MECHANICAL)
                .priority(BreakdownPriority.HIGH)
                .status(BreakdownStatus.DECLARED)
                .declaredAt(LocalDateTime.now())
                .equipmentId(2L)
                .equipmentCode("EQ-002")
                .equipmentName("Convoyeur")
                .build();
        when(breakdownService.create(any())).thenReturn(response);

        String body = """
                {
                  "reference": "BR-012",
                  "title": "Arret ligne",
                  "description": "Panne critique",
                  "type": "MECHANICAL",
                  "priority": "HIGH",
                  "status": "DECLARED",
                  "equipmentId": 2
                }
                """;

        mockMvc.perform(post("/api/breakdowns")
                        .contentType(APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.data.reference").value("BR-012"));
    }

    @Test
    void patchStatus_shouldReturnUpdatedBreakdown() throws Exception {
        BreakdownResponse response = BreakdownResponse.builder()
                .id(12L)
                .reference("BR-012")
                .title("Arret ligne")
                .description("Panne resolue")
                .type(BreakdownType.MECHANICAL)
                .priority(BreakdownPriority.HIGH)
                .status(BreakdownStatus.RESOLVED)
                .declaredAt(LocalDateTime.now())
                .equipmentId(2L)
                .equipmentCode("EQ-002")
                .equipmentName("Convoyeur")
                .build();
        when(breakdownService.patchStatus(any(Long.class), any())).thenReturn(response);

        String body = """
                {
                  "status": "RESOLVED"
                }
                """;

        mockMvc.perform(patch("/api/breakdowns/12/status")
                        .contentType(APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.status").value("RESOLVED"));
    }
}
