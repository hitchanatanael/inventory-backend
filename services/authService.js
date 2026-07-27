const db = require('../config/db');
const {
  ROLE_SUPER_ADMIN,
  ROLE_ADMIN,
  ALLOWED_ROLES,
} = require('../constants/roles');

const userSelectWithPassword = `
  SELECT
    u.id,
    u.id_role,
    u.id_lokasi,
    u.nama,
    u.username,
    u.password_hash,
    u.is_active,
    r.nama_role,
    l.nama_lokasi
  FROM users u
  JOIN roles r ON r.id = u.id_role
  LEFT JOIN lokasi l ON l.id = u.id_lokasi
`;

const safeUserSelect = `
  SELECT
    u.id,
    u.id_role,
    u.id_lokasi,
    u.nama,
    u.username,
    u.is_active,
    r.nama_role,
    l.nama_lokasi,
    u.created_at,
    u.updated_at
  FROM users u
  JOIN roles r ON r.id = u.id_role
  LEFT JOIN lokasi l ON l.id = u.id_lokasi
`;

const isPositiveInteger = (value) => {
  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0;
};

const findUserByUsername = async (username) => {
  const [rows] = await db.query(
    `${userSelectWithPassword}
     WHERE u.username = ?
     LIMIT 1`,
    [username]
  );

  return rows[0] || null;
};

const findUserById = async (id) => {
  const [rows] = await db.query(
    `${safeUserSelect}
     WHERE u.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findRoleByName = async (namaRole) => {
  const [rows] = await db.query(
    `SELECT
      id,
      nama_role,
      created_at,
      updated_at
     FROM roles
     WHERE nama_role = ?
     LIMIT 1`,
    [namaRole]
  );

  return rows[0] || null;
};

const validateUserRoleLocation = (user) => {
  if (!user || !ALLOWED_ROLES.includes(user.nama_role)) {
    return {
      isValid: false,
      message: 'Role pengguna tidak valid',
    };
  }

  if (user.nama_role === ROLE_SUPER_ADMIN) {
    if (user.id_lokasi !== null) {
      return {
        isValid: false,
        message: 'Role pengguna tidak valid',
      };
    }

    return {
      isValid: true,
    };
  }

  if (user.nama_role === ROLE_ADMIN) {
    if (!isPositiveInteger(user.id_lokasi) || !user.nama_lokasi) {
      return {
        isValid: false,
        message: 'Akun belum memiliki lokasi yang valid',
      };
    }

    return {
      isValid: true,
    };
  }

  return {
    isValid: false,
    message: 'Role pengguna tidak valid',
  };
};

const buildAuthUser = (user, includeIsActive = false) => {
  const authUser = {
    id: user.id,
    id_role: user.id_role,
    id_lokasi: user.id_lokasi,
    nama: user.nama,
    username: user.username,
    nama_role: user.nama_role,
    nama_lokasi: user.nama_lokasi,
  };

  if (includeIsActive) {
    authUser.is_active = user.is_active;
  }

  return authUser;
};

const createSuperAdmin = async (payload) => {
  const { id_role, nama, username, password_hash } = payload;

  const [result] = await db.query(
    `INSERT INTO users
      (id_role, id_lokasi, nama, username, password_hash, is_active)
     VALUES (?, NULL, ?, ?, ?, 1)`,
    [id_role, nama, username, password_hash]
  );

  return findUserById(result.insertId);
};

module.exports = {
  findUserByUsername,
  findUserById,
  findRoleByName,
  validateUserRoleLocation,
  buildAuthUser,
  createSuperAdmin,
};
