package com.edi.gmao.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.edi.gmao.dto.equipment.EquipmentRequest;
import com.edi.gmao.dto.equipment.EquipmentResponse;
import com.edi.gmao.entity.Equipment;
import com.edi.gmao.entity.EquipmentCriticality;
import com.edi.gmao.entity.EquipmentStatus;
import com.edi.gmao.mapper.EquipmentMapper;
import com.edi.gmao.repository.EquipmentRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EquipmentServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;
    @Mock
    private AuditLogService auditLogService;

    private EquipmentService equipmentService;

    @BeforeEach
    void setUp() {
        equipmentService = new EquipmentService(equipmentRepository, new EquipmentMapper(), auditLogService);
    }

    @Test
    void create_shouldNormalizeCodeAndPersistEquipment() {
        EquipmentRequest request = new EquipmentRequest();
        request.setCode(" eq-001 ");
        request.setName("Compresseur A");
        request.setCategory("Production");
        request.setStatus(EquipmentStatus.OPERATIONAL);
        request.setCriticality(EquipmentCriticality.HIGH);

        when(equipmentRepository.existsByCodeIgnoreCase("EQ-001")).thenReturn(false);
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(invocation -> {
            Equipment equipment = invocation.getArgument(0);
            equipment.setId(10L);
            return equipment;
        });

        EquipmentResponse response = equipmentService.create(request);

        assertEquals(10L, response.getId());
        assertEquals("EQ-001", response.getCode());
        assertEquals("Compresseur A", response.getName());

        ArgumentCaptor<Equipment> captor = ArgumentCaptor.forClass(Equipment.class);
        verify(equipmentRepository).save(captor.capture());
        assertEquals("EQ-001", captor.getValue().getCode());
        verify(auditLogService).record(
                eq("EQUIPMENT_CREATED"),
                eq("EQUIPMENT"),
                eq(10L),
                eq("Equipment EQ-001 created")
        );
    }

    @Test
    void findById_shouldReturnEquipmentResponse() {
        Equipment equipment = new Equipment();
        equipment.setId(1L);
        equipment.setCode("EQ-002");
        equipment.setName("Pompe B");
        equipment.setCategory("Utilites");
        equipment.setStatus(EquipmentStatus.MAINTENANCE);
        equipment.setCriticality(EquipmentCriticality.MEDIUM);

        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(equipment));

        EquipmentResponse response = equipmentService.findById(1L);

        assertEquals(1L, response.getId());
        assertEquals("EQ-002", response.getCode());
        assertEquals("Pompe B", response.getName());
    }
}
