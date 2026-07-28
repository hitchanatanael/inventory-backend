const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authService = require('../services/authService');
const response = require('../utils/response');
const {
  normalizeLoginPayload,
  validateLoginPayload,
} = require('../validators/authValidator');

const getJwtSecret = () => process.env.JWT_SECRET;
const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '8h';

const login = async (req, res) => {
  try {
    const validationMessage = validateLoginPayload(req.body);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const { username, password } = normalizeLoginPayload(req.body);
    const user = await authService.findUserByUsername(username);

    if (!user) {
      return response.error(res, 'Username atau password salah', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return response.error(res, 'Username atau password salah', 401);
    }

    if (!user.is_active) {
      return response.error(res, 'Akun tidak aktif. Hubungi Super Admin.', 403);
    }

    const roleValidation = authService.validateUserRoleLocation(user);

    if (!roleValidation.isValid) {
      return response.error(res, roleValidation.message, 403);
    }

    const jwtSecret = getJwtSecret();

    if (!jwtSecret) {
      return response.error(res, 'Konfigurasi autentikasi belum lengkap', 500);
    }

    const token = jwt.sign({ id: user.id }, jwtSecret, {
      expiresIn: getJwtExpiresIn(),
    });

    return response.success(res, 'Login berhasil', {
      token,
      user: authService.buildAuthUser(user),
    });
  } catch (error) {
    return response.error(res, 'Gagal login');
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await authService.findUserById(req.user.id);

    if (!user) {
      return response.error(res, 'Pengguna tidak ditemukan', 401);
    }

    return response.success(
      res,
      'Data pengguna berhasil diambil',
      authService.buildAuthUser(user, true)
    );
  } catch (error) {
    return response.error(res, 'Gagal mengambil data pengguna');
  }
};

module.exports = {
  login,
  getCurrentUser,
};
