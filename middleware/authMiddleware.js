const jwt = require('jsonwebtoken');

const authService = require('../services/authService');
const response = require('../utils/response');
const { ROLE_SUPER_ADMIN, ROLE_ADMIN } = require('../constants/roles');

const getJwtSecret = () => process.env.JWT_SECRET;

const authenticateToken = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;

    if (
      !authorizationHeader ||
      !authorizationHeader.startsWith('Bearer ') ||
      authorizationHeader.split(' ').length !== 2
    ) {
      return response.error(res, 'Token autentikasi diperlukan', 401);
    }

    const jwtSecret = getJwtSecret();

    if (!jwtSecret) {
      return response.error(res, 'Konfigurasi autentikasi belum lengkap', 500);
    }

    const token = authorizationHeader.split(' ')[1];
    let decodedToken;

    try {
      decodedToken = jwt.verify(token, jwtSecret);
    } catch (error) {
      return response.error(res, 'Token tidak valid atau telah kedaluwarsa', 401);
    }

    const user = await authService.findUserById(decodedToken.id);

    if (!user) {
      return response.error(res, 'Pengguna tidak ditemukan', 401);
    }

    if (!user.is_active) {
      return response.error(res, 'Akun tidak aktif', 403);
    }

    const roleValidation = authService.validateUserRoleLocation(user);

    if (!roleValidation.isValid) {
      return response.error(res, roleValidation.message, 403);
    }

    req.user = authService.buildAuthUser(user);

    return next();
  } catch (error) {
    return response.error(res, 'Gagal memverifikasi autentikasi');
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.nama_role)) {
      return response.error(res, 'Anda tidak memiliki akses ke fitur ini', 403);
    }

    return next();
  };
};

const attachLocationScope = (req, res, next) => {
  if (!req.user) {
    return response.error(res, 'Token autentikasi diperlukan', 401);
  }

  if (req.user.nama_role === ROLE_SUPER_ADMIN) {
    req.locationScope = {
      isSuperAdmin: true,
      id_lokasi: null,
    };

    return next();
  }

  if (req.user.nama_role === ROLE_ADMIN) {
    if (!Number.isInteger(Number(req.user.id_lokasi)) || Number(req.user.id_lokasi) < 1) {
      return response.error(res, 'Akun belum memiliki lokasi yang valid', 403);
    }

    req.locationScope = {
      isSuperAdmin: false,
      id_lokasi: req.user.id_lokasi,
    };

    return next();
  }

  return response.error(res, 'Role pengguna tidak valid', 403);
};

module.exports = {
  authenticateToken,
  requireRole,
  attachLocationScope,
};
