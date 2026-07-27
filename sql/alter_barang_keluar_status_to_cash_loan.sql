-- Update barang_keluar.status to the Cash/Loan contract.
-- Do not run this automatically from application startup.
--
-- Current schema observed locally:
--   enum('C','LUNAS','PIUTANG','LOAN') NOT NULL DEFAULT 'C'
--
-- Legacy mapping:
--   LUNAS   -> C
--   PIUTANG -> L
--   LOAN    -> L

UPDATE barang_keluar
SET status = 'C'
WHERE status = 'LUNAS';

ALTER TABLE barang_keluar
  MODIFY COLUMN status ENUM('C', 'L', 'PIUTANG', 'LOAN') NOT NULL DEFAULT 'C';

UPDATE barang_keluar
SET status = 'L'
WHERE status IN ('PIUTANG', 'LOAN');

ALTER TABLE barang_keluar
  MODIFY COLUMN status ENUM('C', 'L') NOT NULL DEFAULT 'C';
