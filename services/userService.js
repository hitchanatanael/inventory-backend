const db = require('../config/db');
const { ROLE_SUPER_ADMIN } = require('../constants/roles');

const safeSelectQuery = `
  SELECT
    u.id,
    u.nama,
    u.username,
    u.id_role,
    r.nama_role,
    r.nama_role AS role,
    u.id_lokasi,
    l.nama_lokasi,
    l.nama_lokasi AS lokasi,
    u.is_active,
    u.created_at,
    u.updated_at
  FROM users u
  JOIN roles r ON r.id = u.id_role
  LEFT JOIN lokasi l ON l.id = u.id_lokasi
`;

const buildUserConditions = (filters = {}) => {
  const conditions = [];
  const params = [];

  if (filters.search) {
    conditions.push(`
      (
        u.nama LIKE ?
        OR u.username LIKE ?
        OR r.nama_role LIKE ?
        OR l.nama_lokasi LIKE ?
      )
    `);

    const keyword = `%${filters.search}%`;
    params.push(keyword, keyword, keyword, keyword);
  }

  if (filters.id_role !== undefined) {
    conditions.push('u.id_role = ?');
    params.push(filters.id_role);
  }

  if (filters.id_lokasi !== undefined) {
    conditions.push('u.id_lokasi = ?');
    params.push(filters.id_lokasi);
  }

  if (filters.is_active !== undefined) {
    conditions.push('u.is_active = ?');
    params.push(filters.is_active);
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

const getAllUsers = async (filters = {}) => {
  const { whereClause, params } = buildUserConditions(filters);
  const [rows] = await db.query(
    `${safeSelectQuery}
     ${whereClause}
     ORDER BY u.id ASC
     LIMIT ? OFFSET ?`,
    [...params, filters.limit, filters.offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM users u
     JOIN roles r ON r.id = u.id_role
     LEFT JOIN lokasi l ON l.id = u.id_lokasi
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

const getUserById = async (id) => {
  const [rows] = await db.query(
    `${safeSelectQuery}
     WHERE u.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findUserByUsername = async (username) => {
  const [rows] = await db.query(
    `SELECT
      id,
      username
     FROM users
     WHERE LOWER(username) = LOWER(?)
     LIMIT 1`,
    [username]
  );

  return rows[0] || null;
};

const getRoleDropdown = async () => {
  const [rows] = await db.query(
    `SELECT
      id,
      nama_role AS nama
     FROM roles
     ORDER BY nama_role ASC, id ASC`
  );

  return rows;
};

const findRoleById = async (id) => {
  const [rows] = await db.query(
    `SELECT
      id,
      nama_role
     FROM roles
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findLokasiById = async (id) => {
  const [rows] = await db.query(
    `SELECT
      id,
      nama_lokasi
     FROM lokasi
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const createUser = async (payload) => {
  const {
    nama,
    username,
    id_role,
    id_lokasi,
    is_active = 1,
    password_hash,
  } = payload;
  const [result] = await db.query(
    `INSERT INTO users
      (id_role, id_lokasi, nama, username, password_hash, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id_role, id_lokasi, nama, username, password_hash, is_active]
  );

  return getUserById(result.insertId);
};

const updateUser = async (id, payload) => {
  const {
    nama,
    username,
    id_role,
    id_lokasi,
  } = payload;

  const [result] = await db.query(
    `UPDATE users
     SET
      nama = ?,
      username = ?,
      id_role = ?,
      id_lokasi = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [nama, username, id_role, id_lokasi, id]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return getUserById(id);
};

const updateUserStatus = async (id, isActive) => {
  const [result] = await db.query(
    `UPDATE users
     SET
      is_active = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [isActive, id]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return getUserById(id);
};

const updateUserPassword = async (id, passwordHash) => {
  const [result] = await db.query(
    `UPDATE users
     SET
      password_hash = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [passwordHash, id]
  );

  return result.affectedRows > 0;
};

const deleteUser = async (id) => {
  const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);

  return result.affectedRows > 0;
};

const countActiveSuperAdmins = async () => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM users u
     JOIN roles r ON r.id = u.id_role
     WHERE r.nama_role = ?
      AND u.is_active = 1`,
    [ROLE_SUPER_ADMIN]
  );

  return Number(rows[0].total || 0);
};

const countSuperAdmins = async () => {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM users u
     JOIN roles r ON r.id = u.id_role
     WHERE r.nama_role = ?`,
    [ROLE_SUPER_ADMIN]
  );

  return Number(rows[0].total || 0);
};

const getUserUsage = async () => [];

module.exports = {
  getAllUsers,
  getUserById,
  findUserByUsername,
  findRoleById,
  getRoleDropdown,
  findLokasiById,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserPassword,
  deleteUser,
  countActiveSuperAdmins,
  countSuperAdmins,
  getUserUsage,
};
