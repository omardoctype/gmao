CREATE TABLE IF NOT EXISTS equipments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NULL,
    model VARCHAR(100) NULL,
    serial_number VARCHAR(100) NULL,
    location VARCHAR(150) NULL,
    status VARCHAR(30) NOT NULL,
    criticality VARCHAR(30) NOT NULL,
    installation_date DATE NULL,
    description VARCHAR(2000) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_equipments_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
