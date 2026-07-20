const barangKeluarService = require('../services/barangKeluarService');
const response = require('../utils/response');
const {
  validateBarangKeluarPayload,
} = require('../validators/barangKeluarValidator');

const getAllBarangKeluar = async (req, res) => {
  try {
    const data = await barangKeluarService.getAllBarangKeluar();

    return response.success(res, 'Data barang keluar berhasil diambil', data);
  } catch (error) {
    return response.error(res, 'Gagal mengambil data barang keluar');
  }
};

const getBarangKeluarById = async (req, res) => {
  try {
    const data = await barangKeluarService.getBarangKeluarById(req.params.id);

    if (!data) {
      return response.error(res, 'Data barang keluar tidak ditemukan', 404);
    }

    return response.success(res, 'Detail barang keluar berhasil diambil', data);
  } catch (error) {
    return response.error(res, 'Gagal mengambil detail barang keluar');
  }
};

const createBarangKeluar = async (req, res) => {
  try {
    const validationMessage = validateBarangKeluarPayload(req.body);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const data = await barangKeluarService.createBarangKeluar(req.body);

    if (!data) {
      return response.error(res, 'Data master barang tidak ditemukan', 404);
    }

    return response.success(res, 'Data barang keluar berhasil dibuat', data, 201);
  } catch (error) {
    return response.error(res, 'Gagal membuat data barang keluar');
  }
};

const updateBarangKeluar = async (req, res) => {
  try {
    const validationMessage = validateBarangKeluarPayload(req.body);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const data = await barangKeluarService.updateBarangKeluar(
      req.params.id,
      req.body
    );

    if (!data) {
      return response.error(res, 'Data barang keluar tidak ditemukan', 404);
    }

    return response.success(res, 'Data barang keluar berhasil diperbarui', data);
  } catch (error) {
    return response.error(res, 'Gagal memperbarui data barang keluar');
  }
};

const deleteBarangKeluar = async (req, res) => {
  try {
    const isDeleted = await barangKeluarService.deleteBarangKeluar(req.params.id);

    if (!isDeleted) {
      return response.error(res, 'Data barang keluar tidak ditemukan', 404);
    }

    return response.success(res, 'Data barang keluar berhasil dihapus');
  } catch (error) {
    return response.error(res, 'Gagal menghapus data barang keluar');
  }
};

module.exports = {
  getAllBarangKeluar,
  getBarangKeluarById,
  createBarangKeluar,
  updateBarangKeluar,
  deleteBarangKeluar,
};
