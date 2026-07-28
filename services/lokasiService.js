const db = require('../config/db');

class ServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const baseSelectQuery = `
  SELECT
    id,
    kode_lokasi,
    nama_lokasi,
    nama_lokasi AS nama,
    created_at,
    updated_at
  FROM lokasi
`;

const dropdownSelectQuery = `
  SELECT
    id,
    nama_lokasi AS nama
  FROM lokasi
`;

const buildLokasiConditions = (filters = {}, scope = null) => {
  const conditions = [];
  const params = [];

  if (scope && !scope.isSuperAdmin) {
    conditions.push('id = ?');
    params.push(scope.id_lokasi);
  }

  if (filters.search) {
    conditions.push('LOWER(nama_lokasi) LIKE LOWER(?)');
    params.push(`%${filters.search}%`);
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

const normalizeNameKey = (name) => String(name).trim().toLowerCase();

const getAllLokasi = async (filters = {}, scope = null) => {
  const { whereClause, params } = buildLokasiConditions(filters, scope);

  const [rows] = await db.query(
    `${baseSelectQuery}
     ${whereClause}
     ORDER BY nama_lokasi ASC, id ASC
     LIMIT ? OFFSET ?`,
    [...params, filters.limit, filters.offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM lokasi
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

const getLokasiById = async (id, scope = null) => {
  const conditions = ['id = ?'];
  const params = [id];

  if (scope && !scope.isSuperAdmin) {
    conditions.push('id = ?');
    params.push(scope.id_lokasi);
  }

  const [rows] = await db.query(
    `${baseSelectQuery}
     WHERE ${conditions.join(' AND ')}
     LIMIT 1`,
    params
  );

  return rows[0] || null;
};

const getDropdownLokasi = async (scope = null) => {
  const { whereClause, params } = buildLokasiConditions({}, scope);
  const [rows] = await db.query(
    `${dropdownSelectQuery}
     ${whereClause}
     ORDER BY nama_lokasi ASC, id ASC`,
    params
  );

  return rows;
};

const findLokasiByNormalizedName = async (name, excludeId = null) => {
  const conditions = ['LOWER(TRIM(nama_lokasi)) = ?'];
  const params = [normalizeNameKey(name)];

  if (excludeId !== null) {
    conditions.push('id <> ?');
    params.push(excludeId);
  }

  const [rows] = await db.query(
    `${baseSelectQuery}
     WHERE ${conditions.join(' AND ')}
     LIMIT 1`,
    params
  );

  return rows[0] || null;
};

const buildKodeLokasiBase = (name) => {
  const words = String(name)
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean);
  const initials = words.map((word) => word.replace(/[^A-Z0-9]/g, '')[0]).join('');
  const fallback = String(name).toUpperCase().replace(/[^A-Z0-9]/g, '');
  const base = initials || fallback || 'LOK';

  return base.slice(0, 10);
};

const isKodeLokasiUsed = async (kodeLokasi) => {
  const [rows] = await db.query(
    'SELECT id FROM lokasi WHERE kode_lokasi = ? LIMIT 1',
    [kodeLokasi]
  );

  return Boolean(rows[0]);
};

const generateKodeLokasi = async (name) => {
  const base = buildKodeLokasiBase(name);

  if (!(await isKodeLokasiUsed(base))) {
    return base;
  }

  for (let suffix = 2; suffix <= 999; suffix += 1) {
    const suffixText = String(suffix);
    const kodeLokasi = `${base.slice(0, 10 - suffixText.length)}${suffixText}`;

    if (!(await isKodeLokasiUsed(kodeLokasi))) {
      return kodeLokasi;
    }
  }

  throw new ServiceError('Kode lokasi otomatis sudah penuh', 409);
};

const createLokasi = async (payload) => {
  const { nama_lokasi } = payload;
  const existingLokasi = await findLokasiByNormalizedName(nama_lokasi);

  if (existingLokasi) {
    throw new ServiceError('Nama lokasi sudah digunakan', 409);
  }

  const kodeLokasi = await generateKodeLokasi(nama_lokasi);

  const [result] = await db.query(
    'INSERT INTO lokasi (kode_lokasi, nama_lokasi) VALUES (?, ?)',
    [kodeLokasi, nama_lokasi]
  );

  return getLokasiById(result.insertId);
};

const updateLokasi = async (id, payload) => {
  const existingLokasi = await getLokasiById(id);

  if (!existingLokasi) {
    return null;
  }

  const { nama_lokasi } = payload;
  const duplicateLokasi = await findLokasiByNormalizedName(nama_lokasi, id);

  if (duplicateLokasi) {
    throw new ServiceError('Nama lokasi sudah digunakan', 409);
  }

  await db.query(
    `UPDATE lokasi
     SET
      nama_lokasi = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [nama_lokasi, id]
  );

  return getLokasiById(id);
};

const getLokasiUsage = async (id) => {
  const [rows] = await db.query(
    `SELECT 'users' AS table_name, COUNT(*) AS total FROM users WHERE id_lokasi = ?
     UNION ALL
     SELECT 'master_barang' AS table_name, COUNT(*) AS total FROM master_barang WHERE id_lokasi = ?
     UNION ALL
     SELECT 'barang_masuk' AS table_name, COUNT(*) AS total FROM barang_masuk WHERE id_lokasi = ?
     UNION ALL
     SELECT 'barang_keluar' AS table_name, COUNT(*) AS total FROM barang_keluar WHERE id_lokasi = ?`,
    [id, id, id, id]
  );

  return rows.filter((row) => Number(row.total) > 0);
};

const deleteLokasi = async (id) => {
  const existingLokasi = await getLokasiById(id);

  if (!existingLokasi) {
    return false;
  }

  const usage = await getLokasiUsage(id);

  if (usage.length > 0) {
    throw new ServiceError(
      'Lokasi tidak dapat dihapus karena masih digunakan oleh user, master barang, atau transaksi.',
      409
    );
  }

  const [result] = await db.query('DELETE FROM lokasi WHERE id = ?', [id]);

  return result.affectedRows > 0;
};

module.exports = {
  ServiceError,
  getAllLokasi,
  getLokasiById,
  getDropdownLokasi,
  createLokasi,
  updateLokasi,
  deleteLokasi,
  getLokasiUsage,
};
