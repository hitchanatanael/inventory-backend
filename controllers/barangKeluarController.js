const barangKeluarService = require("../services/barangKeluarService");
const response = require("../utils/response");
const {
    validatePaginationQuery,
} = require("../validators/paginationValidator");
const {
    validateBarangKeluarPayload,
} = require("../validators/barangKeluarValidator");

const buildBarangKeluarFilters = (query, scope) => {
    const filters = {};

    if (query.bulan !== undefined && query.bulan !== "") {
        const bulan = Number(query.bulan);

        if (!Number.isInteger(bulan) || bulan < 1 || bulan > 12) {
            return {
                error: "Filter bulan harus berupa angka 1 sampai 12",
            };
        }

        filters.bulan = bulan;
    }

    if (query.tahun !== undefined && query.tahun !== "") {
        const tahun = Number(query.tahun);

        if (!Number.isInteger(tahun) || tahun < 1) {
            return {
                error: "Filter tahun harus berupa angka positif",
            };
        }

        filters.tahun = tahun;
    }

    if (
        (!scope || scope.isSuperAdmin) &&
        query.id_lokasi !== undefined &&
        query.id_lokasi !== ""
    ) {
        const idLokasi = Number(query.id_lokasi);

        if (!Number.isInteger(idLokasi) || idLokasi < 1) {
            return {
                error: "Filter id_lokasi harus berupa angka positif",
            };
        }

        filters.id_lokasi = idLokasi;
    }

    if (query.search !== undefined && query.search !== "") {
        filters.search = String(query.search).trim();
    }

    if (query.status !== undefined && query.status !== "") {
        filters.status = String(query.status).trim();
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

const handleServiceError = (res, error, fallbackMessage) => {
    if (error.statusCode) {
        return response.error(res, error.message, error.statusCode);
    }

    return response.error(res, fallbackMessage);
};

const getAllBarangKeluar = async (req, res) => {
    try {
        const { filters, error } = buildBarangKeluarFilters(
            req.query,
            req.locationScope,
        );

        if (error) {
            return response.error(res, error, 400);
        }

        const result = await barangKeluarService.getAllBarangKeluar(
            filters,
            req.locationScope,
        );
        const data = result.pagination
            ? {
                  barang_keluar: result.rows,
                  pagination: result.pagination,
              }
            : result.rows;

        return response.success(
            res,
            "Data barang keluar berhasil diambil",
            data,
        );
    } catch (error) {
        return handleServiceError(
            res,
            error,
            "Gagal mengambil data barang keluar",
        );
    }
};

const getBarangKeluarById = async (req, res) => {
    try {
        const data = await barangKeluarService.getBarangKeluarById(
            req.params.id,
            req.locationScope,
        );

        if (!data) {
            return response.error(
                res,
                "Data barang keluar tidak ditemukan",
                404,
            );
        }

        return response.success(
            res,
            "Detail barang keluar berhasil diambil",
            data,
        );
    } catch (error) {
        return handleServiceError(
            res,
            error,
            "Gagal mengambil detail barang keluar",
        );
    }
};

const createBarangKeluar = async (req, res) => {
    try {
        const payload = resolveScopedPayload(req.body, req.locationScope);
        const validationMessage = validateBarangKeluarPayload(payload);

        if (validationMessage) {
            return response.error(res, validationMessage, 400);
        }

        const data = await barangKeluarService.createBarangKeluar(
            payload,
            req.locationScope,
        );

        if (!data) {
            return response.error(
                res,
                "Data master barang tidak ditemukan",
                404,
            );
        }

        return response.success(
            res,
            "Data barang keluar berhasil dibuat",
            data,
            201,
        );
    } catch (error) {
        return handleServiceError(
            res,
            error,
            "Gagal membuat data barang keluar",
        );
    }
};

const updateBarangKeluar = async (req, res) => {
    try {
        const payload = resolveScopedPayload(req.body, req.locationScope);
        const validationMessage = validateBarangKeluarPayload(payload);

        if (validationMessage) {
            return response.error(res, validationMessage, 400);
        }

        const data = await barangKeluarService.updateBarangKeluar(
            req.params.id,
            payload,
            req.locationScope,
        );

        if (!data) {
            return response.error(
                res,
                "Data barang keluar tidak ditemukan",
                404,
            );
        }

        return response.success(
            res,
            "Data barang keluar berhasil diperbarui",
            data,
        );
    } catch (error) {
        return handleServiceError(
            res,
            error,
            "Gagal memperbarui data barang keluar",
        );
    }
};

const deleteBarangKeluar = async (req, res) => {
    try {
        const isDeleted = await barangKeluarService.deleteBarangKeluar(
            req.params.id,
            req.locationScope,
        );

        if (!isDeleted) {
            return response.error(
                res,
                "Data barang keluar tidak ditemukan",
                404,
            );
        }

        return response.success(res, "Data barang keluar berhasil dihapus");
    } catch (error) {
        return handleServiceError(
            res,
            error,
            "Gagal menghapus data barang keluar",
        );
    }
};

module.exports = {
    getAllBarangKeluar,
    getBarangKeluarById,
    createBarangKeluar,
    updateBarangKeluar,
    deleteBarangKeluar,
};
