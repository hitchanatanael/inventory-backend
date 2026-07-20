const barangMasukService = require('../services/barangMasukService');
const response = require('../utils/response');
const {
  validateBarangMasukPayload,
} = require('../validators/barangMasukValidator');

const getAllBarangMasuk = async (req, res) => {
  try {
    const data = await barangMasukService.getAllBarangMasuk();

    return response.success(res, 'Data barang masuk berhasil diambil', data);
  } catch (error) {
    return response.error(res, 'Gagal mengambil data barang masuk');
  }
};

const getBarangMasukById = async (req, res) => {
  try {
    const data = await barangMasukService.getBarangMasukById(req.params.id);

    if (!data) {
      return response.error(res, 'Data barang masuk tidak ditemukan', 404);
    }

    return response.success(res, 'Detail barang masuk berhasil diambil', data);
  } catch (error) {
    return response.error(res, 'Gagal mengambil detail barang masuk');
  }
};

const createBarangMasuk = async (req, res) => {
  try {
    const validationMessage = validateBarangMasukPayload(req.body);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const data = await barangMasukService.createBarangMasuk(req.body);

    return response.success(res, 'Data barang masuk berhasil dibuat', data, 201);
  } catch (error) {
    return response.error(res, 'Gagal membuat data barang masuk');
  }
};

const updateBarangMasuk = async (req, res) => {
  try {
    const validationMessage = validateBarangMasukPayload(req.body);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const data = await barangMasukService.updateBarangMasuk(
      req.params.id,
      req.body
    );

    if (!data) {
      return response.error(res, 'Data barang masuk tidak ditemukan', 404);
    }

    return response.success(res, 'Data barang masuk berhasil diperbarui', data);
  } catch (error) {
    return response.error(res, 'Gagal memperbarui data barang masuk');
  }
};

const deleteBarangMasuk = async (req, res) => {
  try {
    const isDeleted = await barangMasukService.deleteBarangMasuk(req.params.id);

    if (!isDeleted) {
      return response.error(res, 'Data barang masuk tidak ditemukan', 404);
    }

    return response.success(res, 'Data barang masuk berhasil dihapus');
  } catch (error) {
    return response.error(res, 'Gagal menghapus data barang masuk');
  }
};

module.exports = {
  getAllBarangMasuk,
  getBarangMasukById,
  createBarangMasuk,
  updateBarangMasuk,
  deleteBarangMasuk,
};
