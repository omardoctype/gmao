CREATE TABLE IF NOT EXISTS media_attachments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NULL,
    mime_type VARCHAR(150) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    uploaded_at TIMESTAMP NOT NULL,
    uploaded_by_id BIGINT NOT NULL,
    entity_type VARCHAR(40) NOT NULL,
    entity_id BIGINT NOT NULL,
    category VARCHAR(60) NOT NULL,
    description VARCHAR(1000) NULL,
    display_order INT NOT NULL DEFAULT 0,
    storage_path VARCHAR(500) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_media_attachments_stored_file_name UNIQUE (stored_file_name),
    CONSTRAINT fk_media_attachments_uploaded_by
        FOREIGN KEY (uploaded_by_id) REFERENCES users(id),
    INDEX idx_media_attachments_entity (entity_type, entity_id),
    INDEX idx_media_attachments_uploaded_by (uploaded_by_id),
    INDEX idx_media_attachments_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
