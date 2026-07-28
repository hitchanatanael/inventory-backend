const barangMasukService = require('../services/barangMasukService');
const response = require('../utils/response');
const {
  validatePaginationQuery,
} = require('../validators/paginationValidator');
const {
  validateBarangMasukPayload,
} = require('../validators/barangMasukValidator');

const buildBarangMasukFilters = (query, scope) => {
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

  if (query.status !== undefined && query.status !== '') {
    filters.status = String(query.status).trim();
  }

  if (query.search !== undefined && query.search !== '') {
    filters.search = String(query.search).trim();
  }

  const paginationResult = validatePaginationQuery(query, { optional: true });

  if (paginationResult.error) {
    return {
      error: paginationResult.error,
    };
  }

  if (paginationResult.enabled) {
    filters.pagination = paginationResult.pagination;
  }

  if (!scope || scope.isSuperAdmin) {
    const locationFilter = query.tp !== undefined && query.tp !== ''
      ? query.tp
      : query.id_lokasi;

    if (locationFilter !== undefined && locationFilter !== '') {
      const tp = Number(locationFilter);

      if (!Number.isInteger(tp) || tp < 1) {
        return {
          error: 'Filter TP harus berupa id_lokasi yang valid',
        };
      }

      filters.tp = tp;
    }
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

const getAllBarangMasuk = async (req, res) => {
  try {
    const { filters, error } = buildBarangMasukFilters(
      req.query,
      req.locationScope
    );

    if (error) {
      return response.error(res, error, 400);
    }

    const result = await barangMasukService.getAllBarangMasuk(
      filters,
      req.locationScope
    );
    const data = result.pagination
      ? {
          barang_masuk: result.rows,
          pagination: result.pagination,
        }
      : result.rows;

    return response.success(res, 'Data barang masuk berhasil diambil', data);
  } catch (error) {
    return response.error(res, 'Gagal mengambil data barang masuk');
  }
};

const getBarangMasukById = async (req, res) => {
  try {
    const data = await barangMasukService.getBarangMasukById(
      req.params.id,
      req.locationScope
    );

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
    const payload = resolveScopedPayload(req.body, req.locationScope);
    const validationMessage = validateBarangMasukPayload(payload);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const data = await barangMasukService.createBarangMasuk(
      payload,
      req.locationScope
    );

    return response.success(res, 'Data barang masuk berhasil dibuat', data, 201);
  } catch (error) {
    return response.error(res, 'Gagal membuat data barang masuk');
  }
};

const updateBarangMasuk = async (req, res) => {
  try {
    const payload = resolveScopedPayload(req.body, req.locationScope);
    const validationMessage = validateBarangMasukPayload(payload);

    if (validationMessage) {
      return response.error(res, validationMessage, 400);
    }

    const data = await barangMasukService.updateBarangMasuk(
      req.params.id,
      payload,
      req.locationScope
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
    const isDeleted = await barangMasukService.deleteBarangMasuk(
      req.params.id,
      req.locationScope
    );

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
