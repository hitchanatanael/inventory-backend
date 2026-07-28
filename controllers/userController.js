const bcrypt = require('bcryptjs');

const { ROLE_ADMIN, ROLE_SUPER_ADMIN } = require('../constants/roles');
const userService = require('../services/userService');
const response = require('../utils/response');
const {
  normalizeUserPayload,
  validateCreateUserPayload,
  validateUpdateUserPayload,
  validateStatusPayload,
  validatePasswordPayload,
  validateUserQuery,
  normalizeActiveValue,
} = require('../validators/userValidator');

const getSaltRounds = () => Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

const normalizeId = (id) => Number(id);

const isSameUser = (req, userId) => Number(req.user.id) === Number(userId);

const isInvalidId = (id) => !Number.isInteger(id) || id < 1;

const validateRoleLocation = async (payload) => {
  const role = await userService.findRoleById(payload.id_role);

  if (!role) {
    return {
      error: 'Role tidak valid',
    };
  }

  if (role.nama_role === ROLE_SUPER_ADMIN) {
    return {
      payload: {
        ...payload,
        id_lokasi: null,
      },
      role,
    };
  }

  if (role.nama_role === ROLE_ADMIN) {
    if (payload.id_lokasi === null) {
      return {
        error: 'Lokasi wajib diisi',
      };
    }

    const lokasi = await userService.findLokasiById(payload.id_lokasi);

    if (!lokasi) {
      return {
        error: 'Lokasi tidak valid',
      };
    }

    return {
      payload,
      role,
    };
  }

  return {
    error: 'Role tidak valid',
  };
};

const ensureUsernameAvailable = async (username, currentUserId = null) => {
  const existingUser = await userService.findUserByUsername(username);

  if (existingUser && Number(existingUser.id) !== Number(currentUserId)) {
    return 'Username sudah digunakan';
  }

  return null;
};

const getAllUsers = async (req, res) => {
  try {
    const { error, filters } = validateUserQuery(req.query);

    if (error) {
      return response.error(res, error, 400);
    }

    const result = await userService.getAllUsers(filters);

    return response.success(res, 'Data pengguna berhasil diambil', {
      users: result.rows,
      pagination: result.pagination,
    });
  } catch (error) {
    return response.error(res, 'Gagal mengambil data pengguna');
  }
};

const getRoleDropdown = async (req, res) => {
  try {
    const roles = await userService.getRoleDropdown();

    return response.success(res, 'Dropdown role berhasil diambil', roles);
  } catch (error) {
    return response.error(res, 'Gagal mengambil dropdown role');
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = normalizeId(req.params.id);

    if (isInvalidId(userId)) {
      return response.error(res, 'ID pengguna harus berupa angka positif', 400);
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      return response.error(res, 'Data pengguna tidak ditemukan', 404);
    }

    return response.success(res, 'Detail pengguna berhasil diambil', user);
  } catch (error) {
    return response.error(res, 'Gagal mengambil detail pengguna');
  }
};

const createUser = async (req, res) => {
  try {
    const payload = normalizeUserPayload(req.body);
    const validationMessage = validateCreateUserPayload(payload);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const roleLocationValidation = await validateRoleLocation(payload);

    if (roleLocationValidation.error) {
      return response.error(res, roleLocationValidation.error, 400);
    }

    const usernameMessage = await ensureUsernameAvailable(payload.username);

    if (usernameMessage) {
      return response.error(res, usernameMessage, 409);
    }

    const passwordHash = await bcrypt.hash(payload.password, getSaltRounds());
    const user = await userService.createUser({
      ...roleLocationValidation.payload,
      password_hash: passwordHash,
    });

    return response.success(res, 'Data pengguna berhasil dibuat', user, 201);
  } catch (error) {
    return response.error(res, 'Gagal membuat data pengguna');
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = normalizeId(req.params.id);

    if (isInvalidId(userId)) {
      return response.error(res, 'ID pengguna harus berupa angka positif', 400);
    }

    const existingUser = await userService.getUserById(userId);

    if (!existingUser) {
      return response.error(res, 'Data pengguna tidak ditemukan', 404);
    }

    const payload = normalizeUserPayload(req.body);
    const validationMessage = validateUpdateUserPayload(payload);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const roleLocationValidation = await validateRoleLocation(payload);

    if (roleLocationValidation.error) {
      return response.error(res, roleLocationValidation.error, 400);
    }

    if (
      isSameUser(req, userId) &&
      existingUser.nama_role === ROLE_SUPER_ADMIN &&
      roleLocationValidation.role.nama_role !== ROLE_SUPER_ADMIN
    ) {
      return response.error(
        res,
        'Akun yang sedang digunakan tidak dapat mengubah role sendiri',
        400
      );
    }

    if (
      existingUser.nama_role === ROLE_SUPER_ADMIN &&
      roleLocationValidation.role.nama_role !== ROLE_SUPER_ADMIN
    ) {
      const superAdminCount = await userService.countSuperAdmins();

      if (superAdminCount <= 1) {
        return response.error(
          res,
          'Super Admin terakhir tidak dapat diubah menjadi Admin',
          400
        );
      }
    }

    const usernameMessage = await ensureUsernameAvailable(payload.username, userId);

    if (usernameMessage) {
      return response.error(res, usernameMessage, 409);
    }

    const user = await userService.updateUser(userId, roleLocationValidation.payload);

    return response.success(res, 'Data pengguna berhasil diperbarui', user);
  } catch (error) {
    return response.error(res, 'Gagal memperbarui data pengguna');
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const userId = normalizeId(req.params.id);

    if (isInvalidId(userId)) {
      return response.error(res, 'ID pengguna harus berupa angka positif', 400);
    }

    const validationMessage = validateStatusPayload(req.body);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const existingUser = await userService.getUserById(userId);

    if (!existingUser) {
      return response.error(res, 'Data pengguna tidak ditemukan', 404);
    }

    const isActive = normalizeActiveValue(req.body.is_active);

    if (isSameUser(req, userId) && isActive === 0) {
      return response.error(
        res,
        'Akun yang sedang digunakan tidak dapat dinonaktifkan',
        400
      );
    }

    if (
      existingUser.nama_role === ROLE_SUPER_ADMIN &&
      Number(existingUser.is_active) === 1 &&
      isActive === 0
    ) {
      const activeSuperAdminCount = await userService.countActiveSuperAdmins();

      if (activeSuperAdminCount <= 1) {
        return response.error(
          res,
          'Super Admin aktif terakhir tidak dapat dinonaktifkan',
          400
        );
      }
    }

    const user = await userService.updateUserStatus(userId, isActive);

    return response.success(res, 'Status pengguna berhasil diperbarui', user);
  } catch (error) {
    return response.error(res, 'Gagal memperbarui status pengguna');
  }
};

const updateUserPassword = async (req, res) => {
  try {
    const userId = normalizeId(req.params.id);

    if (isInvalidId(userId)) {
      return response.error(res, 'ID pengguna harus berupa angka positif', 400);
    }

    const validationMessage = validatePasswordPayload(req.body);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const existingUser = await userService.getUserById(userId);

    if (!existingUser) {
      return response.error(res, 'Data pengguna tidak ditemukan', 404);
    }

    const passwordHash = await bcrypt.hash(req.body.password, getSaltRounds());
    await userService.updateUserPassword(userId, passwordHash);

    return response.success(res, 'Password pengguna berhasil diubah');
  } catch (error) {
    return response.error(res, 'Gagal mengubah password pengguna');
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = normalizeId(req.params.id);

    if (isInvalidId(userId)) {
      return response.error(res, 'ID pengguna harus berupa angka positif', 400);
    }

    if (isSameUser(req, userId)) {
      return response.error(
        res,
        'Akun yang sedang digunakan tidak dapat dihapus',
        400
      );
    }

    const existingUser = await userService.getUserById(userId);

    if (!existingUser) {
      return response.error(res, 'Data pengguna tidak ditemukan', 404);
    }

    if (existingUser.nama_role === ROLE_SUPER_ADMIN) {
      const superAdminCount = await userService.countSuperAdmins();

      if (superAdminCount <= 1) {
        return response.error(
          res,
          'Super Admin terakhir tidak dapat dihapus',
          400
        );
      }
    }

    const userUsage = await userService.getUserUsage(userId);

    if (userUsage.length > 0) {
      return response.error(
        res,
        'User tidak dapat dihapus karena masih memiliki riwayat data. Nonaktifkan akun sebagai gantinya.',
        409
      );
    }

    const isDeleted = await userService.deleteUser(userId);

    if (!isDeleted) {
      return response.error(res, 'Data pengguna tidak ditemukan', 404);
    }

    return response.success(res, 'Data pengguna berhasil dihapus');
  } catch (error) {
    return response.error(res, 'Gagal menghapus data pengguna');
  }
};

module.exports = {
  getAllUsers,
  getRoleDropdown,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserPassword,
  deleteUser,
};
