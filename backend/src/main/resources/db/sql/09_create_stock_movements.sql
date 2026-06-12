CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGINT NOT NULL AUTO_INCREMENT,
    type VARCHAR(20) NOT NULL,
    quantity INT NOT NULL,
    movement_date DATETIME(6) NOT NULL,
    spare_part_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_stock_movements_spare_part FOREIGN KEY (spare_part_id) REFERENCES spare_parts (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
