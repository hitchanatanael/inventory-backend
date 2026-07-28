const lokasiService = require('../services/lokasiService');
const response = require('../utils/response');
const {
  normalizeLokasiPayload,
  validateLokasiPayload,
  validateLokasiId,
  validateLokasiQuery,
} = require('../validators/lokasiValidator');

const handleServiceError = (res, error, fallbackMessage) => {
  if (error.statusCode) {
    return response.error(res, error.message, error.statusCode);
  }

  return response.error(res, fallbackMessage);
};

const getAllLokasi = async (req, res) => {
  try {
    const { filters, error } = validateLokasiQuery(req.query);

    if (error) {
      return response.error(res, error, 400);
    }

    const result = await lokasiService.getAllLokasi(
      filters,
      req.locationScope
    );

    return response.success(res, 'Data lokasi berhasil diambil', {
      lokasi: result.rows,
      pagination: result.pagination,
    });
  } catch (error) {
    return response.error(res, 'Gagal mengambil data lokasi');
  }
};

const getDropdownLokasi = async (req, res) => {
  try {
    const data = await lokasiService.getDropdownLokasi(req.locationScope);

    return response.success(res, 'Dropdown lokasi berhasil diambil', data);
  } catch (error) {
    return response.error(res, 'Gagal mengambil dropdown lokasi');
  }
};

const getLokasiById = async (req, res) => {
  try {
    const idValidation = validateLokasiId(req.params.id);

    if (idValidation.error) {
      return response.error(res, idValidation.error, 400);
    }

    const data = await lokasiService.getLokasiById(
      idValidation.id,
      req.locationScope
    );

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
    const payload = normalizeLokasiPayload(req.body);
    const validationMessage = validateLokasiPayload(payload);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const data = await lokasiService.createLokasi(payload);

    return response.success(res, 'Data lokasi berhasil dibuat', data, 201);
  } catch (error) {
    return handleServiceError(res, error, 'Gagal membuat data lokasi');
  }
};

const updateLokasi = async (req, res) => {
  try {
    const idValidation = validateLokasiId(req.params.id);

    if (idValidation.error) {
      return response.error(res, idValidation.error, 400);
    }

    const payload = normalizeLokasiPayload(req.body);
    const validationMessage = validateLokasiPayload(payload);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const data = await lokasiService.updateLokasi(idValidation.id, payload);

    if (!data) {
      return response.error(res, 'Data lokasi tidak ditemukan', 404);
    }

    return response.success(res, 'Data lokasi berhasil diperbarui', data);
  } catch (error) {
    return handleServiceError(res, error, 'Gagal memperbarui data lokasi');
  }
};

const deleteLokasi = async (req, res) => {
  try {
    const idValidation = validateLokasiId(req.params.id);

    if (idValidation.error) {
      return response.error(res, idValidation.error, 400);
    }

    const isDeleted = await lokasiService.deleteLokasi(idValidation.id);

    if (!isDeleted) {
      return response.error(res, 'Data lokasi tidak ditemukan', 404);
    }

    return response.success(res, 'Data lokasi berhasil dihapus');
  } catch (error) {
    return handleServiceError(res, error, 'Gagal menghapus data lokasi');
  }
};

module.exports = {
  getAllLokasi,
  getDropdownLokasi,
  getLokasiById,
  createLokasi,
  updateLokasi,
  deleteLokasi,
};
