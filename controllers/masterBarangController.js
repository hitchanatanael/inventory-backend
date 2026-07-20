const masterBarangService = require('../services/masterBarangService');
const response = require('../utils/response');
const {
  validateMasterBarangPayload,
} = require('../validators/masterBarangValidator');

const getAllMasterBarang = async (req, res) => {
  try {
    const data = await masterBarangService.getAllMasterBarang();

    return response.success(res, 'Data master barang berhasil diambil', data);
  } catch (error) {
    return response.error(res, 'Gagal mengambil data master barang');
  }
};

const getMasterBarangById = async (req, res) => {
  try {
    const data = await masterBarangService.getMasterBarangById(req.params.id);

    if (!data) {
      return response.error(res, 'Data master barang tidak ditemukan', 404);
    }

    return response.success(res, 'Detail master barang berhasil diambil', data);
  } catch (error) {
    return response.error(res, 'Gagal mengambil detail master barang');
  }
};

const createMasterBarang = async (req, res) => {
  try {
    const validationMessage = validateMasterBarangPayload(req.body);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const data = await masterBarangService.createMasterBarang(req.body);

    return response.success(res, 'Data master barang berhasil dibuat', data, 201);
  } catch (error) {
    return response.error(res, 'Gagal membuat data master barang');
  }
};

const updateMasterBarang = async (req, res) => {
  try {
    const validationMessage = validateMasterBarangPayload(req.body);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const data = await masterBarangService.updateMasterBarang(
      req.params.id,
      req.body
    );

    if (!data) {
      return response.error(res, 'Data master barang tidak ditemukan', 404);
    }

    return response.success(res, 'Data master barang berhasil diperbarui', data);
  } catch (error) {
    return response.error(res, 'Gagal memperbarui data master barang');
  }
};

const deleteMasterBarang = async (req, res) => {
  try {
    const isDeleted = await masterBarangService.deleteMasterBarang(req.params.id);

    if (!isDeleted) {
      return response.error(res, 'Data master barang tidak ditemukan', 404);
    }

    return response.success(res, 'Data master barang berhasil dihapus');
  } catch (error) {
    return response.error(res, 'Gagal menghapus data master barang');
  }
};

module.exports = {
  getAllMasterBarang,
  getMasterBarangById,
  createMasterBarang,
  updateMasterBarang,
  deleteMasterBarang,
};
