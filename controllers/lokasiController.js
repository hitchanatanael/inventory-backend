const lokasiService = require('../services/lokasiService');
const response = require('../utils/response');
const { validateLokasiPayload } = require('../validators/lokasiValidator');

const getAllLokasi = async (req, res) => {
  try {
    const data = await lokasiService.getAllLokasi();

    return response.success(res, 'Data lokasi berhasil diambil', data);
  } catch (error) {
    return response.error(res, 'Gagal mengambil data lokasi');
  }
};

const getLokasiById = async (req, res) => {
  try {
    const data = await lokasiService.getLokasiById(req.params.id);

    if (!data) {
      return response.error(res, 'Data lokasi tidak ditemukan', 404);
    }

    return response.success(res, 'Detail lokasi berhasil diambil', data);
  } catch (error) {
    return response.error(res, 'Gagal mengambil detail lokasi');
  }
};

const createLokasi = async (req, res) => {
  try {
    const validationMessage = validateLokasiPayload(req.body);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const data = await lokasiService.createLokasi(req.body);

    return response.success(res, 'Data lokasi berhasil dibuat', data, 201);
  } catch (error) {
    return response.error(res, 'Gagal membuat data lokasi');
  }
};

const updateLokasi = async (req, res) => {
  try {
    const validationMessage = validateLokasiPayload(req.body);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const data = await lokasiService.updateLokasi(req.params.id, req.body);

    if (!data) {
      return response.error(res, 'Data lokasi tidak ditemukan', 404);
    }

    return response.success(res, 'Data lokasi berhasil diperbarui', data);
  } catch (error) {
    return response.error(res, 'Gagal memperbarui data lokasi');
  }
};

const deleteLokasi = async (req, res) => {
  try {
    const isDeleted = await lokasiService.deleteLokasi(req.params.id);

    if (!isDeleted) {
      return response.error(res, 'Data lokasi tidak ditemukan', 404);
    }

    return response.success(res, 'Data lokasi berhasil dihapus');
  } catch (error) {
    return response.error(res, 'Gagal menghapus data lokasi');
  }
};

module.exports = {
  getAllLokasi,
  getLokasiById,
  createLokasi,
  updateLokasi,
  deleteLokasi,
};
