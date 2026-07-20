const db = require('../config/db');

const baseSelectQuery = `
  SELECT
    mb.id,
    mb.kode_barang,
    mb.nama_barang,
    mb.satuan,
    mb.id_lokasi,
    l.nama_lokasi,
    mb.harga_satuan,
    mb.created_at,
    mb.updated_at
  FROM master_barang mb
  LEFT JOIN lokasi l ON l.id = mb.id_lokasi
`;

const getAllMasterBarang = async () => {
  const [rows] = await db.query(
    `${baseSelectQuery}
     ORDER BY mb.nama_barang ASC`
  );

  return rows;
};

const getMasterBarangById = async (id) => {
  const [rows] = await db.query(
    `${baseSelectQuery}
     WHERE mb.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const createMasterBarang = async (payload) => {
  const { kode_barang, nama_barang, satuan, id_lokasi, harga_satuan } = payload;

  const [result] = await db.query(
    `INSERT INTO master_barang
      (kode_barang, nama_barang, satuan, id_lokasi, harga_satuan)
     VALUES (?, ?, ?, ?, ?)`,
    [kode_barang, nama_barang, satuan, id_lokasi, harga_satuan]
  );

  return getMasterBarangById(result.insertId);
};

const updateMasterBarang = async (id, payload) => {
  const existingBarang = await getMasterBarangById(id);

  if (!existingBarang) {
    return null;
  }

  const { kode_barang, nama_barang, satuan, id_lokasi, harga_satuan } = payload;

  await db.query(
    `UPDATE master_barang
     SET
      kode_barang = ?,
      nama_barang = ?,
      satuan = ?,
      id_lokasi = ?,
      harga_satuan = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [kode_barang, nama_barang, satuan, id_lokasi, harga_satuan, id]
  );

  return getMasterBarangById(id);
};

const deleteMasterBarang = async (id) => {
  const [result] = await db.query(
    'DELETE FROM master_barang WHERE id = ?',
    [id]
  );

  return result.affectedRows > 0;
};

module.exports = {
  getAllMasterBarang,
  getMasterBarangById,
  createMasterBarang,
  updateMasterBarang,
  deleteMasterBarang,
};
