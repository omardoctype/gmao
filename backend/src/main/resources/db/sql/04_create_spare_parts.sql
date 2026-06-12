CREATE TABLE IF NOT EXISTS spare_parts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    reference VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity_in_stock INT NOT NULL,
    minimum_threshold INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_spare_parts_reference UNIQUE (reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
