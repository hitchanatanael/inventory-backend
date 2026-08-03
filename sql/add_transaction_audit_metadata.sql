-- Phase 3G: Basic audit metadata for transaction tables.
-- Target database: MySQL / mysql2 backend.
--
-- Observed schema before this migration:
--   users.id: INT NOT NULL AUTO_INCREMENT PRIMARY KEY
--   barang_masuk: created_at and updated_at already exist
--   barang_keluar: created_at and updated_at already exist
--   barang_masuk/barang_keluar: created_by and updated_by do not exist
--
-- Existing historical rows are intentionally left with NULL created_by/updated_by.
-- Future rows must be populated by the authenticated API user.

START TRANSACTION;

SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'barang_masuk'
    AND COLUMN_NAME = 'created_by'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE barang_masuk ADD COLUMN created_by INT NULL AFTER updated_at',
  'SELECT ''barang_masuk.created_by already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'barang_masuk'
    AND COLUMN_NAME = 'updated_by'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE barang_masuk ADD COLUMN updated_by INT NULL AFTER created_by',
  'SELECT ''barang_masuk.updated_by already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'barang_keluar'
    AND COLUMN_NAME = 'created_by'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE barang_keluar ADD COLUMN created_by INT NULL AFTER updated_at',
  'SELECT ''barang_keluar.created_by already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'barang_keluar'
    AND COLUMN_NAME = 'updated_by'
);
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE barang_keluar ADD COLUMN updated_by INT NULL AFTER created_by',
  'SELECT ''barang_keluar.updated_by already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'barang_masuk'
    AND INDEX_NAME = 'idx_barang_masuk_created_by'
);
SET @sql = IF(
  @index_exists = 0,
  'CREATE INDEX idx_barang_masuk_created_by ON barang_masuk (created_by)',
  'SELECT ''idx_barang_masuk_created_by already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'barang_masuk'
    AND INDEX_NAME = 'idx_barang_masuk_updated_by'
);
SET @sql = IF(
  @index_exists = 0,
  'CREATE INDEX idx_barang_masuk_updated_by ON barang_masuk (updated_by)',
  'SELECT ''idx_barang_masuk_updated_by already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'barang_keluar'
    AND INDEX_NAME = 'idx_barang_keluar_created_by'
);
SET @sql = IF(
  @index_exists = 0,
  'CREATE INDEX idx_barang_keluar_created_by ON barang_keluar (created_by)',
  'SELECT ''idx_barang_keluar_created_by already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'barang_keluar'
    AND INDEX_NAME = 'idx_barang_keluar_updated_by'
);
SET @sql = IF(
  @index_exists = 0,
  'CREATE INDEX idx_barang_keluar_updated_by ON barang_keluar (updated_by)',
  'SELECT ''idx_barang_keluar_updated_by already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND CONSTRAINT_NAME = 'fk_barang_masuk_created_by'
);
SET @sql = IF(
  @fk_exists = 0,
  'ALTER TABLE barang_masuk ADD CONSTRAINT fk_barang_masuk_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT',
  'SELECT ''fk_barang_masuk_created_by already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND CONSTRAINT_NAME = 'fk_barang_masuk_updated_by'
);
SET @sql = IF(
  @fk_exists = 0,
  'ALTER TABLE barang_masuk ADD CONSTRAINT fk_barang_masuk_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT',
  'SELECT ''fk_barang_masuk_updated_by already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND CONSTRAINT_NAME = 'fk_barang_keluar_created_by'
);
SET @sql = IF(
  @fk_exists = 0,
  'ALTER TABLE barang_keluar ADD CONSTRAINT fk_barang_keluar_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT',
  'SELECT ''fk_barang_keluar_created_by already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.REFERENTIAL_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND CONSTRAINT_NAME = 'fk_barang_keluar_updated_by'
);
SET @sql = IF(
  @fk_exists = 0,
  'ALTER TABLE barang_keluar ADD CONSTRAINT fk_barang_keluar_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE RESTRICT ON DELETE RESTRICT',
  'SELECT ''fk_barang_keluar_updated_by already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;

-- Rollback:
-- START TRANSACTION;
-- ALTER TABLE barang_masuk DROP FOREIGN KEY fk_barang_masuk_created_by;
-- ALTER TABLE barang_masuk DROP FOREIGN KEY fk_barang_masuk_updated_by;
-- ALTER TABLE barang_keluar DROP FOREIGN KEY fk_barang_keluar_created_by;
-- ALTER TABLE barang_keluar DROP FOREIGN KEY fk_barang_keluar_updated_by;
-- DROP INDEX idx_barang_masuk_created_by ON barang_masuk;
-- DROP INDEX idx_barang_masuk_updated_by ON barang_masuk;
-- DROP INDEX idx_barang_keluar_created_by ON barang_keluar;
-- DROP INDEX idx_barang_keluar_updated_by ON barang_keluar;
-- ALTER TABLE barang_masuk DROP COLUMN created_by, DROP COLUMN updated_by;
-- ALTER TABLE barang_keluar DROP COLUMN created_by, DROP COLUMN updated_by;
-- COMMIT;

-- Verification:
-- SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
-- FROM information_schema.COLUMNS
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND TABLE_NAME IN ('barang_masuk', 'barang_keluar')
--   AND COLUMN_NAME IN ('created_by', 'updated_by', 'created_at', 'updated_at')
-- ORDER BY TABLE_NAME, COLUMN_NAME;
--
-- SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME
-- FROM information_schema.STATISTICS
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND TABLE_NAME IN ('barang_masuk', 'barang_keluar')
--   AND COLUMN_NAME IN ('created_by', 'updated_by')
-- ORDER BY TABLE_NAME, INDEX_NAME;
--
-- SELECT rc.CONSTRAINT_NAME, rc.TABLE_NAME, kcu.COLUMN_NAME,
--        kcu.REFERENCED_TABLE_NAME, kcu.REFERENCED_COLUMN_NAME,
--        rc.UPDATE_RULE, rc.DELETE_RULE
-- FROM information_schema.REFERENTIAL_CONSTRAINTS rc
-- JOIN information_schema.KEY_COLUMN_USAGE kcu
--   ON kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
--  AND kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
--  AND kcu.TABLE_NAME = rc.TABLE_NAME
-- WHERE rc.CONSTRAINT_SCHEMA = DATABASE()
--   AND rc.TABLE_NAME IN ('barang_masuk', 'barang_keluar')
--   AND kcu.REFERENCED_TABLE_NAME = 'users'
-- ORDER BY rc.TABLE_NAME, kcu.COLUMN_NAME;
