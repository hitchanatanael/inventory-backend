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

const buildMasterAnggotaConditions = (filters = {}) => {
  const conditions = [];
  const params = [];

  if (filters.search) {
    conditions.push(`
      (
        nomor_anggota LIKE ?
        OR nama_anggota LIKE ?
        OR keterangan LIKE ?
      )
    `);

    const keyword = `%${filters.search}%`;
    params.push(keyword, keyword, keyword);
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

const getAllMasterAnggota = async (filters = {}) => {
  const { whereClause, params } = buildMasterAnggotaConditions(filters);
  const [rows] = await db.query(
    `${baseSelectQuery}
     ${whereClause}
     ORDER BY nama_anggota ASC
     LIMIT ? OFFSET ?`,
    [...params, filters.limit, filters.offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM master_anggota
     ${whereClause}`,
    params
  );

  return {
    rows,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: countRows[0].total,
      total_pages: Math.ceil(countRows[0].total / filters.limit),
    },
  };
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
