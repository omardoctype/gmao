package com.edi.gmao.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.edi.gmao.dto.stock.StockMovementResponse;
import com.edi.gmao.entity.StockMovementType;
import com.edi.gmao.security.JwtAuthenticationFilter;
import com.edi.gmao.service.SparePartService;
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
        controllers = SparePartController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = JwtAuthenticationFilter.class
        )
)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class SparePartControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SparePartService sparePartService;

    @Test
    void stockIn_shouldReturnCreatedMovement() throws Exception {
        StockMovementResponse response = StockMovementResponse.builder()
                .id(100L)
                .type(StockMovementType.IN)
                .quantity(5)
                .sparePartId(1L)
                .sparePartReference("SP-001")
                .sparePartName("Roulement")
                .quantityInStockAfterMovement(15)
                .build();
        when(sparePartService.stockIn(any(Long.class), any())).thenReturn(response);

        String body = """
                {
                  "quantity": 5
                }
                """;

        mockMvc.perform(post("/api/spare-parts/1/stock-in")
                        .contentType(APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.message").value("Stock-in movement recorded successfully"))
                .andExpect(jsonPath("$.data.type").value("IN"))
                .andExpect(jsonPath("$.data.quantityInStockAfterMovement").value(15));
    }

    @Test
    void stockOut_shouldReturnCreatedMovement() throws Exception {
        StockMovementResponse response = StockMovementResponse.builder()
                .id(101L)
                .type(StockMovementType.OUT)
                .quantity(3)
                .sparePartId(1L)
                .sparePartReference("SP-001")
                .sparePartName("Roulement")
                .quantityInStockAfterMovement(7)
                .build();
        when(sparePartService.stockOut(any(Long.class), any())).thenReturn(response);

        String body = """
                {
                  "quantity": 3
                }
                """;

        mockMvc.perform(post("/api/spare-parts/1/stock-out")
                        .contentType(APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.message").value("Stock-out movement recorded successfully"))
                .andExpect(jsonPath("$.data.type").value("OUT"))
                .andExpect(jsonPath("$.data.quantityInStockAfterMovement").value(7));
    }
}
