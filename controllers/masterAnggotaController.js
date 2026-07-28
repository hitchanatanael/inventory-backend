const masterAnggotaService = require('../services/masterAnggotaService');
const response = require('../utils/response');
const {
  validateMasterAnggotaPayload,
  validateMasterAnggotaQuery,
} = require('../validators/masterAnggotaValidator');

const getAllMasterAnggota = async (req, res) => {
  try {
    const { filters, error } = validateMasterAnggotaQuery(req.query);

    if (error) {
      return response.error(res, error, 400);
    }

    const result = await masterAnggotaService.getAllMasterAnggota(filters);

    return response.success(res, 'Data master anggota berhasil diambil', {
      anggota: result.rows,
      pagination: result.pagination,
    });
  } catch (error) {
    return response.error(res, 'Gagal mengambil data master anggota');
  }
};

const getMasterAnggotaById = async (req, res) => {
  try {
    const data = await masterAnggotaService.getMasterAnggotaById(req.params.id);

    if (!data) {
      return response.error(res, 'Data master anggota tidak ditemukan', 404);
    }

    return response.success(res, 'Detail master anggota berhasil diambil', data);
  } catch (error) {
    return response.error(res, 'Gagal mengambil detail master anggota');
  }
};

const createMasterAnggota = async (req, res) => {
  try {
    const validationMessage = validateMasterAnggotaPayload(req.body);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const data = await masterAnggotaService.createMasterAnggota(req.body);

    return response.success(res, 'Data master anggota berhasil dibuat', data, 201);
  } catch (error) {
    return response.error(res, 'Gagal membuat data master anggota');
  }
};

const updateMasterAnggota = async (req, res) => {
  try {
    const validationMessage = validateMasterAnggotaPayload(req.body);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const data = await masterAnggotaService.updateMasterAnggota(
      req.params.id,
      req.body
    );

    if (!data) {
      return response.error(res, 'Data master anggota tidak ditemukan', 404);
    }

    return response.success(res, 'Data master anggota berhasil diperbarui', data);
  } catch (error) {
    return response.error(res, 'Gagal memperbarui data master anggota');
  }
};

const deleteMasterAnggota = async (req, res) => {
  try {
    const isDeleted = await masterAnggotaService.deleteMasterAnggota(req.params.id);

    if (!isDeleted) {
      return response.error(res, 'Data master anggota tidak ditemukan', 404);
    }

    return response.success(res, 'Data master anggota berhasil dihapus');
  } catch (error) {
    return response.error(res, 'Gagal menghapus data master anggota');
  }
};

module.exports = {
  getAllMasterAnggota,
  getMasterAnggotaById,
  createMasterAnggota,
  updateMasterAnggota,
  deleteMasterAnggota,
};
