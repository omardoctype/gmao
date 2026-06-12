package com.edi.gmao.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.edi.gmao.dto.equipmentdocument.EquipmentDocumentDownloadPayload;
import com.edi.gmao.dto.equipmentdocument.EquipmentDocumentResponse;
import com.edi.gmao.entity.EquipmentDocumentType;
import com.edi.gmao.security.JwtAuthenticationFilter;
import com.edi.gmao.service.EquipmentDocumentService;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
        controllers = EquipmentDocumentController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = JwtAuthenticationFilter.class
        )
)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class EquipmentDocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EquipmentDocumentService equipmentDocumentService;

    @Test
    void upload_shouldReturnCreatedDocument() throws Exception {
        EquipmentDocumentResponse response = EquipmentDocumentResponse.builder()
                .id(1L)
                .originalFileName("fiche-technique.pdf")
                .storedFileName("ab1234.pdf")
                .contentType("application/pdf")
                .size(1024L)
                .documentType(EquipmentDocumentType.FICHE_TECHNIQUE)
                .storagePath("1/ab1234.pdf")
                .uploadedAt(Instant.parse("2026-05-23T10:00:00Z"))
                .generatedByAi(false)
                .build();
        when(equipmentDocumentService.upload(eq(1L), any())).thenReturn(response);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "fiche-technique.pdf",
                "application/pdf",
                "dummy-content".getBytes()
        );

        mockMvc.perform(multipart("/api/equipments/1/documents")
                        .file(file)
                        .param("documentType", "FICHE_TECHNIQUE")
                        .param("generatedByAi", "false"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.message").value("Equipment document uploaded successfully"))
                .andExpect(jsonPath("$.data.originalFileName").value("fiche-technique.pdf"));
    }

    @Test
    void list_shouldReturnDocuments() throws Exception {
        EquipmentDocumentResponse response = EquipmentDocumentResponse.builder()
                .id(9L)
                .originalFileName("photo.jpg")
                .storedFileName("uuid.jpg")
                .contentType("image/jpeg")
                .size(2048L)
                .documentType(EquipmentDocumentType.PHOTO)
                .storagePath("1/uuid.jpg")
                .uploadedAt(Instant.parse("2026-05-23T11:00:00Z"))
                .generatedByAi(false)
                .build();
        when(equipmentDocumentService.list(1L)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/equipments/1/documents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].id").value(9))
                .andExpect(jsonPath("$.data[0].documentType").value("PHOTO"));
    }

    @Test
    void generateAiDocument_shouldReturnCreatedDocument() throws Exception {
        EquipmentDocumentResponse response = EquipmentDocumentResponse.builder()
                .id(22L)
                .originalFileName("equipment_EQ-001_ai_document.md")
                .storedFileName("uuid-ai.md")
                .contentType("text/markdown")
                .size(4096L)
                .documentType(EquipmentDocumentType.AI_GENERATED_TECHNICAL_NOTE)
                .storagePath("1/uuid-ai.md")
                .uploadedAt(Instant.parse("2026-05-23T11:30:00Z"))
                .generatedByAi(true)
                .build();
        when(equipmentDocumentService.generateAiDocument(1L)).thenReturn(response);

        mockMvc.perform(post("/api/equipments/1/documents/generate-ai"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.message").value("AI equipment document generated successfully"))
                .andExpect(jsonPath("$.data.documentType").value("AI_GENERATED_TECHNICAL_NOTE"))
                .andExpect(jsonPath("$.data.generatedByAi").value(true));
    }

    @Test
    void download_shouldReturnFileContent() throws Exception {
        byte[] fileContent = "maintenance-report".getBytes();
        EquipmentDocumentDownloadPayload payload = new EquipmentDocumentDownloadPayload(
                fileContent,
                "text/plain",
                "rapport.txt",
                fileContent.length
        );
        when(equipmentDocumentService.download(1L, 2L)).thenReturn(payload);

        mockMvc.perform(get("/api/equipments/1/documents/2/download"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/plain"))
                .andExpect(content().bytes(fileContent));
    }

    @Test
    void getMetadata_shouldReturnDocumentMetadata() throws Exception {
        EquipmentDocumentResponse response = EquipmentDocumentResponse.builder()
                .id(2L)
                .originalFileName("manuel.pdf")
                .storedFileName("uuid-manuel.pdf")
                .contentType("application/pdf")
                .size(5000L)
                .documentType(EquipmentDocumentType.MANUEL_MACHINE)
                .storagePath("1/uuid-manuel.pdf")
                .uploadedAt(Instant.parse("2026-05-23T12:00:00Z"))
                .generatedByAi(false)
                .build();
        when(equipmentDocumentService.getMetadata(1L, 2L)).thenReturn(response);

        mockMvc.perform(get("/api/equipments/1/documents/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.id").value(2))
                .andExpect(jsonPath("$.data.documentType").value("MANUEL_MACHINE"));
    }

    @Test
    void delete_shouldReturnOk() throws Exception {
        doNothing().when(equipmentDocumentService).delete(1L, 4L);

        mockMvc.perform(delete("/api/equipments/1/documents/4"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Equipment document deleted successfully"));
    }
}
