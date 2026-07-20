const db = require('../config/db');

const baseSelectQuery = `
  SELECT
    id,
    nomor_anggota,
    nama_anggota,
    keterangan,
    created_at,
    updated_at
  FROM master_anggota
`;

const getAllMasterAnggota = async () => {
  const [rows] = await db.query(
    `${baseSelectQuery}
     ORDER BY nama_anggota ASC`
  );

  return rows;
};

const getMasterAnggotaById = async (id) => {
  const [rows] = await db.query(
    `${baseSelectQuery}
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const createMasterAnggota = async (payload) => {
  const { nomor_anggota, nama_anggota, keterangan = null } = payload;

  const [result] = await db.query(
    `INSERT INTO master_anggota
      (nomor_anggota, nama_anggota, keterangan)
     VALUES (?, ?, ?)`,
    [nomor_anggota, nama_anggota, keterangan]
  );

  return getMasterAnggotaById(result.insertId);
};

const updateMasterAnggota = async (id, payload) => {
  const existingAnggota = await getMasterAnggotaById(id);

  if (!existingAnggota) {
    return null;
  }

  const { nomor_anggota, nama_anggota, keterangan = null } = payload;

  await db.query(
    `UPDATE master_anggota
     SET
      nomor_anggota = ?,
      nama_anggota = ?,
      keterangan = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [nomor_anggota, nama_anggota, keterangan, id]
  );

  return getMasterAnggotaById(id);
};

const deleteMasterAnggota = async (id) => {
  const [result] = await db.query(
    'DELETE FROM master_anggota WHERE id = ?',
    [id]
  );

  return result.affectedRows > 0;
};

module.exports = {
  getAllMasterAnggota,
  getMasterAnggotaById,
  createMasterAnggota,
  updateMasterAnggota,
  deleteMasterAnggota,
};
