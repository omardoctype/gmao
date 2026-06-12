CREATE TABLE IF NOT EXISTS intervention_reports (
    id BIGINT NOT NULL AUTO_INCREMENT,
    work_order_id BIGINT NOT NULL,
    equipment_id BIGINT NOT NULL,
    breakdown_id BIGINT NULL,
    technician_id BIGINT NOT NULL,
    equipment_document_id BIGINT NULL,
    performed_tasks TEXT NOT NULL,
    real_diagnosis TEXT NULL,
    root_cause TEXT NULL,
    used_parts TEXT NULL,
    intervention_duration_minutes INT NULL,
    final_result TEXT NOT NULL,
    future_recommendations TEXT NULL,
    created_at DATETIME(6) NOT NULL,
    closed_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_intervention_reports_work_order UNIQUE (work_order_id),
    CONSTRAINT fk_intervention_reports_work_order
        FOREIGN KEY (work_order_id) REFERENCES work_orders(id),
    CONSTRAINT fk_intervention_reports_equipment
        FOREIGN KEY (equipment_id) REFERENCES equipments(id),
    CONSTRAINT fk_intervention_reports_breakdown
        FOREIGN KEY (breakdown_id) REFERENCES breakdowns(id),
    CONSTRAINT fk_intervention_reports_technician
        FOREIGN KEY (technician_id) REFERENCES users(id),
    CONSTRAINT fk_intervention_reports_equipment_document
        FOREIGN KEY (equipment_document_id) REFERENCES equipment_documents(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
