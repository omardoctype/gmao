SET @schema_name = DATABASE();

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'work_orders'
      AND COLUMN_NAME = 'assigned_at'
);
SET @ddl = IF(@column_exists = 0,
    'ALTER TABLE work_orders ADD COLUMN assigned_at DATETIME(6) NULL AFTER planned_date',
    'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'work_orders'
      AND COLUMN_NAME = 'accepted_at'
);
SET @ddl = IF(@column_exists = 0,
    'ALTER TABLE work_orders ADD COLUMN accepted_at DATETIME(6) NULL AFTER assigned_at',
    'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'work_orders'
      AND COLUMN_NAME = 'estimated_duration_minutes'
);
SET @ddl = IF(@column_exists = 0,
    'ALTER TABLE work_orders ADD COLUMN estimated_duration_minutes INT NULL AFTER completed_at',
    'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @schema_name
      AND TABLE_NAME = 'work_orders'
      AND COLUMN_NAME = 'actual_duration_minutes'
);
SET @ddl = IF(@column_exists = 0,
    'ALTER TABLE work_orders ADD COLUMN actual_duration_minutes INT NULL AFTER estimated_duration_minutes',
    'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE work_orders
SET actual_duration_minutes = TIMESTAMPDIFF(MINUTE, started_at, completed_at)
WHERE actual_duration_minutes IS NULL
  AND started_at IS NOT NULL
  AND completed_at IS NOT NULL
  AND completed_at >= started_at;
