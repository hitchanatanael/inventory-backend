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

const getScopedLocationId = (scope, requestedLocationId) => {
  if (scope && !scope.isSuperAdmin) {
    return scope.id_lokasi;
  }

  return requestedLocationId;
};

const addScopeCondition = (conditions, params, scope) => {
  if (scope && !scope.isSuperAdmin) {
    conditions.push('mb.id_lokasi = ?');
    params.push(scope.id_lokasi);
  }
};

const getAllMasterBarang = async (filters = {}, scope = null) => {
  const conditions = [];
  const params = [];
  const scopedLocationId = getScopedLocationId(scope, filters.id_lokasi);

  if (scopedLocationId !== undefined) {
    conditions.push('mb.id_lokasi = ?');
    params.push(scopedLocationId);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const [rows] = await db.query(
    `${baseSelectQuery}
     ${whereClause}
     ORDER BY mb.id ASC`,
    params
  );

  return rows;
};

const getMasterBarangById = async (id, scope = null) => {
  const conditions = ['mb.id = ?'];
  const params = [id];

  addScopeCondition(conditions, params, scope);

  const [rows] = await db.query(
    `${baseSelectQuery}
     WHERE ${conditions.join(' AND ')}
     LIMIT 1`,
    params
  );

  return rows[0] || null;
};

const createMasterBarang = async (payload, scope = null) => {
  const { kode_barang, nama_barang, satuan, harga_satuan } = payload;
  const id_lokasi = getScopedLocationId(scope, payload.id_lokasi);

  const [result] = await db.query(
    `INSERT INTO master_barang
      (kode_barang, nama_barang, satuan, id_lokasi, harga_satuan)
     VALUES (?, ?, ?, ?, ?)`,
    [kode_barang, nama_barang, satuan, id_lokasi, harga_satuan]
  );

  return getMasterBarangById(result.insertId, scope);
};

const updateMasterBarang = async (id, payload, scope = null) => {
  const existingBarang = await getMasterBarangById(id, scope);

  if (!existingBarang) {
    return null;
  }

  const { kode_barang, nama_barang, satuan, harga_satuan } = payload;
  const id_lokasi = getScopedLocationId(scope, payload.id_lokasi);

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

  return getMasterBarangById(id, scope);
};

const deleteMasterBarang = async (id, scope = null) => {
  const conditions = ['id = ?'];
  const params = [id];

  if (scope && !scope.isSuperAdmin) {
    conditions.push('id_lokasi = ?');
    params.push(scope.id_lokasi);
  }

  const [result] = await db.query(
    `DELETE FROM master_barang WHERE ${conditions.join(' AND ')}`,
    params
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
