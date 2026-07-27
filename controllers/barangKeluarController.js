const barangKeluarService = require('../services/barangKeluarService');
const response = require('../utils/response');
const {
  validateBarangKeluarPayload,
} = require('../validators/barangKeluarValidator');

const buildBarangKeluarFilters = (query) => {
  const filters = {};

  if (query.bulan !== undefined && query.bulan !== '') {
    const bulan = Number(query.bulan);

    if (!Number.isInteger(bulan) || bulan < 1 || bulan > 12) {
      return {
        error: 'Filter bulan harus berupa angka 1 sampai 12',
      };
    }

    filters.bulan = bulan;
  }

  if (query.tahun !== undefined && query.tahun !== '') {
    const tahun = Number(query.tahun);

    if (!Number.isInteger(tahun) || tahun < 1) {
      return {
        error: 'Filter tahun harus berupa angka positif',
      };
    }

    filters.tahun = tahun;
  }

  if (query.id_lokasi !== undefined && query.id_lokasi !== '') {
    const idLokasi = Number(query.id_lokasi);

    if (!Number.isInteger(idLokasi) || idLokasi < 1) {
      return {
        error: 'Filter id_lokasi harus berupa angka positif',
      };
    }

    filters.id_lokasi = idLokasi;
  }

  if (query.search !== undefined && query.search !== '') {
    filters.search = String(query.search).trim();
  }

  return { filters };
};

const handleServiceError = (res, error, fallbackMessage) => {
  if (error.statusCode) {
    return response.error(res, error.message, error.statusCode);
  }

  return response.error(res, fallbackMessage);
};

const getAllBarangKeluar = async (req, res) => {
  try {
    const { filters, error } = buildBarangKeluarFilters(req.query);

    if (error) {
      return response.error(res, error, 400);
    }

    const data = await barangKeluarService.getAllBarangKeluar(filters);

    return response.success(res, 'Data barang keluar berhasil diambil', data);
  } catch (error) {
    return handleServiceError(res, error, 'Gagal mengambil data barang keluar');
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
    return handleServiceError(res, error, 'Gagal mengambil detail barang keluar');
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
    return handleServiceError(res, error, 'Gagal membuat data barang keluar');
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
    return handleServiceError(res, error, 'Gagal memperbarui data barang keluar');
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
    return handleServiceError(res, error, 'Gagal menghapus data barang keluar');
  }
};

module.exports = {
  getAllBarangKeluar,
  getBarangKeluarById,
  createBarangKeluar,
  updateBarangKeluar,
  deleteBarangKeluar,
};
