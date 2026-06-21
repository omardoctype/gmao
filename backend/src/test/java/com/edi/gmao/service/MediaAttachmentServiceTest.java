package com.edi.gmao.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.edi.gmao.config.DocumentStorageProperties;
import com.edi.gmao.dto.attachment.AttachmentResponse;
import com.edi.gmao.dto.attachment.AttachmentUploadRequest;
import com.edi.gmao.entity.AttachmentCategory;
import com.edi.gmao.entity.AttachmentEntityType;
import com.edi.gmao.entity.Breakdown;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.MediaAttachment;
import com.edi.gmao.entity.User;
import com.edi.gmao.entity.WorkOrder;
import com.edi.gmao.exception.ApiException;
import com.edi.gmao.exception.InvalidDocumentUploadException;
import com.edi.gmao.mapper.MediaAttachmentMapper;
import com.edi.gmao.repository.BreakdownRepository;
import com.edi.gmao.repository.EquipmentRepository;
import com.edi.gmao.repository.InterventionReportRepository;
import com.edi.gmao.repository.MediaAttachmentRepository;
import com.edi.gmao.repository.UserRepository;
import com.edi.gmao.repository.WorkOrderRepository;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@ExtendWith(MockitoExtension.class)
class MediaAttachmentServiceTest {

    @TempDir
    private Path tempDir;

    @Mock
    private MediaAttachmentRepository mediaAttachmentRepository;
    @Mock
    private EquipmentRepository equipmentRepository;
    @Mock
    private BreakdownRepository breakdownRepository;
    @Mock
    private WorkOrderRepository workOrderRepository;
    @Mock
    private InterventionReportRepository interventionReportRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AuditLogService auditLogService;

    private DocumentStorageProperties storageProperties;
    private MediaAttachmentService service;

    @BeforeEach
    void setUp() {
        storageProperties = new DocumentStorageProperties();
        storageProperties.setStorageDir(tempDir.toString());
        storageProperties.setMaxFileSizeBytes(10 * 1024 * 1024);
        service = new MediaAttachmentService(
                mediaAttachmentRepository,
                equipmentRepository,
                breakdownRepository,
                workOrderRepository,
                interventionReportRepository,
                userRepository,
                new MediaAttachmentMapper(),
                storageProperties,
                auditLogService
        );
        lenient().when(mediaAttachmentRepository.save(any(MediaAttachment.class))).thenAnswer(invocation -> {
            MediaAttachment attachment = invocation.getArgument(0);
            if (attachment.getId() == null) {
                attachment.setId(100L);
            }
            return attachment;
        });
    }

    @Test
    void upload_shouldAllowAuthorizedEquipmentImageUpload() {
        User admin = user(1L, "admin@gmao.com");
        Equipment equipment = equipment(10L, "EQ-010");
        when(userRepository.findByEmailIgnoreCase("admin@gmao.com")).thenReturn(Optional.of(admin));
        when(equipmentRepository.findById(10L)).thenReturn(Optional.of(equipment));
        when(mediaAttachmentRepository.findMaxDisplayOrder(AttachmentEntityType.EQUIPMENT, 10L)).thenReturn(-1);

        List<AttachmentResponse> responses = service.upload(
                uploadRequest(AttachmentEntityType.EQUIPMENT, 10L, AttachmentCategory.EQUIPMENT_PHOTO, pngFile("photo.png")),
                authentication("admin@gmao.com", "ROLE_ADMIN")
        );

        assertEquals(1, responses.size());
        assertEquals("photo.png", responses.get(0).getOriginalFileName());
        assertEquals("image/png", responses.get(0).getMimeType());
        assertEquals("/api/attachments/100/content", responses.get(0).getFileUrl());
        verify(auditLogService).record(
                any(String.class),
                any(String.class),
                any(Long.class),
                any(String.class)
        );
    }

    @Test
    void upload_shouldAllowAuthorizedBreakdownImageUpload() {
        User operator = user(2L, "operator@gmao.com");
        Breakdown breakdown = new Breakdown();
        breakdown.setId(20L);
        breakdown.setReference("BRK-020");
        when(userRepository.findByEmailIgnoreCase("operator@gmao.com")).thenReturn(Optional.of(operator));
        when(breakdownRepository.findById(20L)).thenReturn(Optional.of(breakdown));
        when(mediaAttachmentRepository.findMaxDisplayOrder(AttachmentEntityType.BREAKDOWN, 20L)).thenReturn(-1);

        List<AttachmentResponse> responses = service.upload(
                uploadRequest(AttachmentEntityType.BREAKDOWN, 20L, AttachmentCategory.BREAKDOWN_PHOTO, jpgFile("leak.jpg")),
                authentication("operator@gmao.com", "ROLE_OPERATOR")
        );

        assertEquals(AttachmentCategory.BREAKDOWN_PHOTO, responses.get(0).getCategory());
        assertEquals(AttachmentEntityType.BREAKDOWN, responses.get(0).getEntityType());
    }

    @Test
    void upload_shouldAllowTechnicianForAssignedWorkOrder() {
        User technician = user(3L, "tech@gmao.com");
        WorkOrder workOrder = new WorkOrder();
        workOrder.setId(30L);
        workOrder.setReference("OT-030");
        workOrder.setAssignedTechnician(technician);
        when(userRepository.findByEmailIgnoreCase("tech@gmao.com")).thenReturn(Optional.of(technician));
        when(workOrderRepository.findById(30L)).thenReturn(Optional.of(workOrder));
        when(mediaAttachmentRepository.findMaxDisplayOrder(AttachmentEntityType.WORK_ORDER, 30L)).thenReturn(-1);

        List<AttachmentResponse> responses = service.upload(
                uploadRequest(AttachmentEntityType.WORK_ORDER, 30L, AttachmentCategory.BEFORE_INTERVENTION, pngFile("before.png")),
                authentication("tech@gmao.com", "ROLE_TECHNICIAN")
        );

        assertEquals(AttachmentCategory.BEFORE_INTERVENTION, responses.get(0).getCategory());
    }

    @Test
    void upload_shouldDenyTechnicianForAnotherTechniciansWorkOrder() {
        User assignedTechnician = user(4L, "assigned@gmao.com");
        User otherTechnician = user(5L, "other@gmao.com");
        WorkOrder workOrder = new WorkOrder();
        workOrder.setId(40L);
        workOrder.setReference("OT-040");
        workOrder.setAssignedTechnician(assignedTechnician);
        when(userRepository.findByEmailIgnoreCase("other@gmao.com")).thenReturn(Optional.of(otherTechnician));
        when(workOrderRepository.findById(40L)).thenReturn(Optional.of(workOrder));

        ApiException exception = assertThrows(ApiException.class, () -> service.upload(
                uploadRequest(AttachmentEntityType.WORK_ORDER, 40L, AttachmentCategory.BEFORE_INTERVENTION, pngFile("before.png")),
                authentication("other@gmao.com", "ROLE_TECHNICIAN")
        ));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    }

    @Test
    void upload_shouldRejectUnsupportedFile() {
        User admin = user(6L, "admin@gmao.com");
        when(userRepository.findByEmailIgnoreCase("admin@gmao.com")).thenReturn(Optional.of(admin));
        when(equipmentRepository.findById(10L)).thenReturn(Optional.of(equipment(10L, "EQ-010")));

        MockMultipartFile file = new MockMultipartFile("files", "script.svg", "image/svg+xml", "<svg />".getBytes());

        assertThrows(InvalidDocumentUploadException.class, () -> service.upload(
                uploadRequest(AttachmentEntityType.EQUIPMENT, 10L, AttachmentCategory.EQUIPMENT_PHOTO, file),
                authentication("admin@gmao.com", "ROLE_ADMIN")
        ));
    }

    @Test
    void upload_shouldRejectOversizedFile() {
        storageProperties.setMaxFileSizeBytes(3);
        User admin = user(7L, "admin@gmao.com");
        when(userRepository.findByEmailIgnoreCase("admin@gmao.com")).thenReturn(Optional.of(admin));
        when(equipmentRepository.findById(10L)).thenReturn(Optional.of(equipment(10L, "EQ-010")));

        assertThrows(InvalidDocumentUploadException.class, () -> service.upload(
                uploadRequest(AttachmentEntityType.EQUIPMENT, 10L, AttachmentCategory.EQUIPMENT_PHOTO, pngFile("photo.png")),
                authentication("admin@gmao.com", "ROLE_ADMIN")
        ));
    }

    @Test
    void upload_shouldSaveExpectedMetadata() {
        User admin = user(8L, "admin@gmao.com");
        when(userRepository.findByEmailIgnoreCase("admin@gmao.com")).thenReturn(Optional.of(admin));
        when(equipmentRepository.findById(10L)).thenReturn(Optional.of(equipment(10L, "EQ-010")));
        when(mediaAttachmentRepository.findMaxDisplayOrder(AttachmentEntityType.EQUIPMENT, 10L)).thenReturn(4);

        AttachmentResponse response = service.upload(
                uploadRequest(AttachmentEntityType.EQUIPMENT, 10L, AttachmentCategory.NAMEPLATE, pngFile("plate.png")),
                authentication("admin@gmao.com", "ROLE_ADMIN")
        ).get(0);

        assertEquals(100L, response.getId());
        assertEquals(5, response.getDisplayOrder());
        assertEquals(8L, response.getUploadedById());
        assertNotNull(response.getStoredFileName());
        assertFalse(response.getStoredFileName().contains("plate"));
    }

    @Test
    void getContent_shouldRejectUnauthorizedUser() {
        User assignedTechnician = user(9L, "assigned@gmao.com");
        User otherTechnician = user(10L, "other@gmao.com");
        WorkOrder workOrder = new WorkOrder();
        workOrder.setId(50L);
        workOrder.setReference("OT-050");
        workOrder.setAssignedTechnician(assignedTechnician);
        MediaAttachment attachment = attachment(200L, AttachmentEntityType.WORK_ORDER, 50L, assignedTechnician);
        when(mediaAttachmentRepository.findById(200L)).thenReturn(Optional.of(attachment));
        when(userRepository.findByEmailIgnoreCase("other@gmao.com")).thenReturn(Optional.of(otherTechnician));
        when(workOrderRepository.findById(50L)).thenReturn(Optional.of(workOrder));

        ApiException exception = assertThrows(ApiException.class, () ->
                service.getContent(200L, authentication("other@gmao.com", "ROLE_TECHNICIAN")));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    }

    @Test
    void delete_shouldRejectAssignedTechnicianUploader() {
        User technician = user(12L, "tech@gmao.com");
        WorkOrder workOrder = new WorkOrder();
        workOrder.setId(60L);
        workOrder.setReference("OT-060");
        workOrder.setAssignedTechnician(technician);
        MediaAttachment attachment = attachment(250L, AttachmentEntityType.WORK_ORDER, 60L, technician);
        when(mediaAttachmentRepository.findById(250L)).thenReturn(Optional.of(attachment));
        when(userRepository.findByEmailIgnoreCase("tech@gmao.com")).thenReturn(Optional.of(technician));
        when(workOrderRepository.findById(60L)).thenReturn(Optional.of(workOrder));

        ApiException exception = assertThrows(ApiException.class, () ->
                service.delete(250L, authentication("tech@gmao.com", "ROLE_TECHNICIAN")));

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    }

    @Test
    void delete_shouldRemoveMetadataAndPhysicalFile() throws Exception {
        User admin = user(11L, "admin@gmao.com");
        Path storageRoot = tempDir.resolve("media-attachments");
        Path filePath = storageRoot.resolve("equipment").resolve("10").resolve("stored.png");
        Files.createDirectories(filePath.getParent());
        Files.write(filePath, pngBytes());

        MediaAttachment attachment = attachment(300L, AttachmentEntityType.EQUIPMENT, 10L, admin);
        attachment.setStoragePath("equipment/10/stored.png");
        when(mediaAttachmentRepository.findById(300L)).thenReturn(Optional.of(attachment));
        when(userRepository.findByEmailIgnoreCase("admin@gmao.com")).thenReturn(Optional.of(admin));
        when(equipmentRepository.findById(10L)).thenReturn(Optional.of(equipment(10L, "EQ-010")));

        service.delete(300L, authentication("admin@gmao.com", "ROLE_ADMIN"));

        assertFalse(Files.exists(filePath));
        verify(mediaAttachmentRepository).delete(attachment);
    }

    private AttachmentUploadRequest uploadRequest(
            AttachmentEntityType entityType,
            Long entityId,
            AttachmentCategory category,
            MockMultipartFile file
    ) {
        AttachmentUploadRequest request = new AttachmentUploadRequest();
        request.setEntityType(entityType);
        request.setEntityId(entityId);
        request.setCategory(category);
        request.setDescription("Photo terrain");
        request.setFiles(List.of(file));
        return request;
    }

    private MediaAttachment attachment(Long id, AttachmentEntityType entityType, Long entityId, User uploadedBy) {
        MediaAttachment attachment = new MediaAttachment();
        attachment.setId(id);
        attachment.setOriginalFileName("photo.png");
        attachment.setStoredFileName("stored.png");
        attachment.setFileUrl("/api/attachments/" + id + "/content");
        attachment.setMimeType("image/png");
        attachment.setFileSizeBytes((long) pngBytes().length);
        attachment.setUploadedBy(uploadedBy);
        attachment.setEntityType(entityType);
        attachment.setEntityId(entityId);
        attachment.setCategory(AttachmentCategory.GENERAL);
        attachment.setDisplayOrder(0);
        attachment.setStoragePath(entityType.name().toLowerCase() + "/" + entityId + "/stored.png");
        return attachment;
    }

    private Equipment equipment(Long id, String code) {
        Equipment equipment = new Equipment();
        equipment.setId(id);
        equipment.setCode(code);
        equipment.setName("Machine");
        return equipment;
    }

    private User user(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setFirstName("User");
        user.setLastName("Test");
        user.setEmail(email);
        user.setActive(true);
        return user;
    }

    private UsernamePasswordAuthenticationToken authentication(String email, String... roles) {
        return new UsernamePasswordAuthenticationToken(
                email,
                null,
                Set.of(roles).stream().map(SimpleGrantedAuthority::new).toList()
        );
    }

    private MockMultipartFile pngFile(String fileName) {
        return new MockMultipartFile("files", fileName, "image/png", pngBytes());
    }

    private MockMultipartFile jpgFile(String fileName) {
        return new MockMultipartFile("files", fileName, "image/jpeg", jpgBytes());
    }

    private byte[] pngBytes() {
        return new byte[] {
                (byte) 0x89, 0x50, 0x4E, 0x47,
                0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x0D
        };
    }

    private byte[] jpgBytes() {
        return new byte[] {
                (byte) 0xFF, (byte) 0xD8, (byte) 0xFF,
                0x00, 0x01, 0x02, 0x03
        };
    }
}
