package com.edi.gmao.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "intervention_reports",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_intervention_reports_work_order", columnNames = "work_order_id")
        }
)
public class InterventionReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "work_order_id", nullable = false, foreignKey = @ForeignKey(name = "fk_intervention_reports_work_order"))
    private WorkOrder workOrder;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipment_id", nullable = false, foreignKey = @ForeignKey(name = "fk_intervention_reports_equipment"))
    private Equipment equipment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "breakdown_id", foreignKey = @ForeignKey(name = "fk_intervention_reports_breakdown"))
    private Breakdown breakdown;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "technician_id", nullable = false, foreignKey = @ForeignKey(name = "fk_intervention_reports_technician"))
    private User technician;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "equipment_document_id",
            foreignKey = @ForeignKey(name = "fk_intervention_reports_equipment_document")
    )
    private EquipmentDocument equipmentDocument;

    @NotBlank
    @Lob
    @Column(name = "performed_tasks", nullable = false, columnDefinition = "TEXT")
    private String performedTasks;

    @Lob
    @Column(name = "real_diagnosis", columnDefinition = "TEXT")
    private String realDiagnosis;

    @Lob
    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    @Lob
    @Column(name = "used_parts", columnDefinition = "TEXT")
    private String usedParts;

    @PositiveOrZero
    @Column(name = "intervention_duration_minutes")
    private Integer interventionDurationMinutes;

    @NotBlank
    @Lob
    @Column(name = "final_result", nullable = false, columnDefinition = "TEXT")
    private String finalResult;

    @Lob
    @Column(name = "future_recommendations", columnDefinition = "TEXT")
    private String futureRecommendations;

    @NotNull
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @NotNull
    @Column(name = "closed_at", nullable = false)
    private LocalDateTime closedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
