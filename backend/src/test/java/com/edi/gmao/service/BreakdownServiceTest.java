package com.edi.gmao.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.edi.gmao.dto.breakdown.BreakdownRequest;
import com.edi.gmao.dto.breakdown.BreakdownResponse;
import com.edi.gmao.dto.breakdown.BreakdownStatusUpdateRequest;
import com.edi.gmao.entity.Breakdown;
import com.edi.gmao.entity.BreakdownPriority;
import com.edi.gmao.entity.BreakdownStatus;
import com.edi.gmao.entity.BreakdownType;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentStatus;
import com.edi.gmao.mapper.BreakdownMapper;
import com.edi.gmao.repository.BreakdownRepository;
import com.edi.gmao.repository.EquipmentRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BreakdownServiceTest {

    @Mock
    private BreakdownRepository breakdownRepository;
    @Mock
    private EquipmentRepository equipmentRepository;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private NotificationService notificationService;

    private BreakdownService breakdownService;

    @BeforeEach
    void setUp() {
        breakdownService = new BreakdownService(
                breakdownRepository,
                equipmentRepository,
                new BreakdownMapper(),
                auditLogService,
                notificationService
        );
    }

    @Test
    void create_shouldSaveBreakdownAndRecordAudit() {
        Equipment equipment = new Equipment();
        equipment.setId(5L);
        equipment.setCode("EQ-005");
        equipment.setName("Convoyeur");
        equipment.setCategory("Production");
        equipment.setStatus(EquipmentStatus.OPERATIONAL);
        equipment.setCriticality(EquipmentCriticality.HIGH);

        BreakdownRequest request = new BreakdownRequest();
        request.setReference(" br-101 ");
        request.setTitle("Arret convoyeur");
        request.setDescription("Blocage mecanique");
        request.setType(BreakdownType.MECHANICAL);
        request.setPriority(BreakdownPriority.HIGH);
        request.setStatus(BreakdownStatus.DECLARED);
        request.setEquipmentId(5L);

        when(breakdownRepository.existsByReferenceIgnoreCase("BR-101")).thenReturn(false);
        when(equipmentRepository.findById(5L)).thenReturn(Optional.of(equipment));
        when(breakdownRepository.save(any(Breakdown.class))).thenAnswer(invocation -> {
            Breakdown breakdown = invocation.getArgument(0);
            breakdown.setId(20L);
            return breakdown;
        });

        BreakdownResponse response = breakdownService.create(request);

        assertEquals(20L, response.getId());
        assertEquals("BR-101", response.getReference());
        assertEquals("EQ-005", response.getEquipmentCode());
        verify(auditLogService).record(
                eq("BREAKDOWN_DECLARED"),
                eq("BREAKDOWN"),
                eq(20L),
                eq("Breakdown BR-101 declared on equipment EQ-005")
        );
        verify(notificationService).notifyCriticalBreakdown(any(Breakdown.class));
    }

    @Test
    void patchStatus_shouldUpdateBreakdownStatus() {
        Equipment equipment = new Equipment();
        equipment.setId(5L);
        equipment.setCode("EQ-005");
        equipment.setName("Convoyeur");
        equipment.setCategory("Production");
        equipment.setStatus(EquipmentStatus.OPERATIONAL);
        equipment.setCriticality(EquipmentCriticality.HIGH);

        Breakdown breakdown = new Breakdown();
        breakdown.setId(30L);
        breakdown.setReference("BR-200");
        breakdown.setTitle("Panne hydraulique");
        breakdown.setDescription("Fuite");
        breakdown.setType(BreakdownType.HYDRAULIC);
        breakdown.setPriority(BreakdownPriority.CRITICAL);
        breakdown.setStatus(BreakdownStatus.DECLARED);
        breakdown.setEquipment(equipment);

        BreakdownStatusUpdateRequest request = new BreakdownStatusUpdateRequest();
        request.setStatus(BreakdownStatus.RESOLVED);

        when(breakdownRepository.findById(30L)).thenReturn(Optional.of(breakdown));
        when(breakdownRepository.save(any(Breakdown.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BreakdownResponse response = breakdownService.patchStatus(30L, request);

        assertEquals(BreakdownStatus.RESOLVED, response.getStatus());
    }
}
