CREATE TABLE IF NOT EXISTS maintenance_plans (
    id BIGINT NOT NULL AUTO_INCREMENT,
    type VARCHAR(30) NOT NULL,
    frequency VARCHAR(30) NOT NULL,
    next_execution_date DATE NOT NULL,
    description VARCHAR(2000) NOT NULL,
    equipment_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_maintenance_plans_equipment FOREIGN KEY (equipment_id) REFERENCES equipments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
