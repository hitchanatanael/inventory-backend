const masterBarangService = require('../services/masterBarangService');
const response = require('../utils/response');
const {
  validateMasterBarangPayload,
} = require('../validators/masterBarangValidator');

const buildMasterBarangFilters = (query, scope) => {
  const filters = {};

  if (scope && !scope.isSuperAdmin) {
    return { filters };
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

  return { filters };
};

const resolveScopedPayload = (payload, scope) => {
  if (scope && !scope.isSuperAdmin) {
    return {
      ...payload,
      id_lokasi: scope.id_lokasi,
    };
  }

  return payload;
};

const getAllMasterBarang = async (req, res) => {
  try {
    const { filters, error } = buildMasterBarangFilters(
      req.query,
      req.locationScope
    );

    if (error) {
      return response.error(res, error, 400);
    }

    const data = await masterBarangService.getAllMasterBarang(
      filters,
      req.locationScope
    );

    return response.success(res, 'Data master barang berhasil diambil', data);
  } catch (error) {
    return response.error(res, 'Gagal mengambil data master barang');
  }
};

const getMasterBarangById = async (req, res) => {
  try {
    const data = await masterBarangService.getMasterBarangById(
      req.params.id,
      req.locationScope
    );

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
    const payload = resolveScopedPayload(req.body, req.locationScope);
    const validationMessage = validateMasterBarangPayload(payload);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const data = await masterBarangService.createMasterBarang(
      payload,
      req.locationScope
    );

    return response.success(res, 'Data master barang berhasil dibuat', data, 201);
  } catch (error) {
    return response.error(res, 'Gagal membuat data master barang');
  }
};

const updateMasterBarang = async (req, res) => {
  try {
    const payload = resolveScopedPayload(req.body, req.locationScope);
    const validationMessage = validateMasterBarangPayload(payload);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const data = await masterBarangService.updateMasterBarang(
      req.params.id,
      payload,
      req.locationScope
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
    const isDeleted = await masterBarangService.deleteMasterBarang(
      req.params.id,
      req.locationScope
    );

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
