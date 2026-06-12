CREATE TABLE IF NOT EXISTS equipment_documents (
    id BIGINT NOT NULL AUTO_INCREMENT,
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(150) NOT NULL,
    size BIGINT NOT NULL,
    document_type VARCHAR(60) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL,
    generated_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
    equipment_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_equipment_documents_stored_file_name UNIQUE (stored_file_name),
    CONSTRAINT fk_equipment_documents_equipment
        FOREIGN KEY (equipment_id) REFERENCES equipments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
