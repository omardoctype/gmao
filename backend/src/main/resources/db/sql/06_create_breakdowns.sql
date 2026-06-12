CREATE TABLE IF NOT EXISTS breakdowns (
    id BIGINT NOT NULL AUTO_INCREMENT,
    reference VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    type VARCHAR(30) NOT NULL,
    priority VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    declared_at DATETIME(6) NOT NULL,
    equipment_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_breakdowns_reference UNIQUE (reference),
    CONSTRAINT fk_breakdowns_equipment FOREIGN KEY (equipment_id) REFERENCES equipments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
