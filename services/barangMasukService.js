const db = require("../config/db");

const baseSelectQuery = `
  SELECT
    bm.id,
    DATE_FORMAT(bm.tanggal, '%Y-%m-%d') AS tanggal,
    bm.id_master_barang,
    bm.id_lokasi,
    bm.jumlah,
    bm.harga_satuan,
    bm.total_harga,
    bm.jumlah_bayar,
    bm.sisa_bayar,
    bm.status,
    bm.created_at,
    bm.updated_at,
    bm.created_by AS created_by_id,
    creator.nama AS created_by_nama,
    creator.username AS created_by_username,
    bm.updated_by AS updated_by_id,
    updater.nama AS updated_by_nama,
    updater.username AS updated_by_username,
    mb.kode_barang,
    mb.nama_barang,
    mb.satuan,
    l.nama_lokasi
  FROM barang_masuk bm
  LEFT JOIN master_barang mb ON mb.id = bm.id_master_barang
  LEFT JOIN lokasi l ON l.id = bm.id_lokasi
  LEFT JOIN users creator ON creator.id = bm.created_by
  LEFT JOIN users updater ON updater.id = bm.updated_by
`;

const calculatePayment = (payload) => {
    const jumlah = Number(payload.jumlah);
    const hargaSatuan = Number(payload.harga_satuan);
    const jumlahBayar = Number(payload.jumlah_bayar);
    const totalHarga = jumlah * hargaSatuan;
    const sisaBayar = jumlahBayar - totalHarga;

    return {
        totalHarga,
        sisaBayar,
    };
};

const getScopedLocationId = (scope, requestedLocationId) => {
    if (scope && !scope.isSuperAdmin) {
        return scope.id_lokasi;
    }

    return requestedLocationId;
};

const addScopeCondition = (conditions, params, scope) => {
    if (scope && !scope.isSuperAdmin) {
        conditions.push("bm.id_lokasi = ?");
        params.push(scope.id_lokasi);
    }
};

const buildBarangMasukConditions = (filters = {}, scope = null) => {
    const { bulan, tahun, status, search, tp } = filters;
    const conditions = [];
    const params = [];

    if (bulan !== undefined) {
        conditions.push("MONTH(bm.tanggal) = ?");
        params.push(bulan);
    }

    if (tahun !== undefined) {
        conditions.push("YEAR(bm.tanggal) = ?");
        params.push(tahun);
    }

    const scopedLocationId = getScopedLocationId(scope, tp);

    if (scopedLocationId !== undefined && scopedLocationId !== null) {
        conditions.push("bm.id_lokasi = ?");
        params.push(scopedLocationId);
    }

    if (status) {
        conditions.push("bm.status = ?");
        params.push(status);
    }

    if (search) {
        conditions.push(`
      (
        mb.kode_barang LIKE ?
        OR mb.nama_barang LIKE ?
        OR l.nama_lokasi LIKE ?
        OR bm.status LIKE ?
      )
    `);

        const keyword = `%${search}%`;
        params.push(keyword, keyword, keyword, keyword);
    }

    return {
        whereClause: conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "",
        params,
    };
};

const getAllBarangMasuk = async (filters = {}, scope = null) => {
    const { whereClause, params } = buildBarangMasukConditions(filters, scope);
    const pagination = filters.pagination;
    const limitClause = pagination ? "LIMIT ? OFFSET ?" : "";
    const queryParams = pagination
        ? [...params, pagination.limit, pagination.offset]
        : params;

    const [rows] = await db.query(
        `${baseSelectQuery}
     ${whereClause}
     ORDER BY bm.id DESC
     ${limitClause}`,
        queryParams,
    );

    if (!pagination) {
        return {
            rows,
        };
    }

    const [countRows] = await db.query(
        `SELECT COUNT(*) AS total
     FROM barang_masuk bm
     LEFT JOIN master_barang mb ON mb.id = bm.id_master_barang
     LEFT JOIN lokasi l ON l.id = bm.id_lokasi
     ${whereClause}`,
        params,
    );

    return {
        rows,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: countRows[0].total,
            total_pages: Math.ceil(countRows[0].total / pagination.limit),
        },
    };
};

const getBarangMasukById = async (id, scope = null) => {
    const conditions = ["bm.id = ?"];
    const params = [id];

    addScopeCondition(conditions, params, scope);

    const [rows] = await db.query(
        `${baseSelectQuery}
     WHERE ${conditions.join(" AND ")}
     LIMIT 1`,
        params,
    );

    return rows[0] || null;
};

const createBarangMasuk = async (payload, scope = null, authenticatedUserId) => {
    const {
        tanggal,
        id_master_barang,
        jumlah,
        harga_satuan,
        jumlah_bayar,
        status,
    } = payload;
    const id_lokasi = getScopedLocationId(scope, payload.id_lokasi);
    const { totalHarga, sisaBayar } = calculatePayment(payload);

    const [result] = await db.query(
        `INSERT INTO barang_masuk
      (
        tanggal,
        id_master_barang,
        id_lokasi,
        jumlah,
        harga_satuan,
        total_harga,
        jumlah_bayar,
        sisa_bayar,
        status,
        created_by,
        updated_by
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            tanggal,
            id_master_barang,
            id_lokasi,
            jumlah,
            harga_satuan,
            totalHarga,
            jumlah_bayar,
            sisaBayar,
            status,
            authenticatedUserId,
            authenticatedUserId,
        ],
    );

    return getBarangMasukById(result.insertId, scope);
};

const updateBarangMasuk = async (id, payload, scope = null, authenticatedUserId) => {
    const existingBarangMasuk = await getBarangMasukById(id, scope);

    if (!existingBarangMasuk) {
        return null;
    }

    const {
        tanggal,
        id_master_barang,
        jumlah,
        harga_satuan,
        jumlah_bayar,
        status,
    } = payload;
    const id_lokasi = getScopedLocationId(scope, payload.id_lokasi);
    const { totalHarga, sisaBayar } = calculatePayment(payload);

    await db.query(
        `UPDATE barang_masuk
     SET
      tanggal = ?,
      id_master_barang = ?,
      id_lokasi = ?,
      jumlah = ?,
      harga_satuan = ?,
      total_harga = ?,
      jumlah_bayar = ?,
      sisa_bayar = ?,
      status = ?,
      updated_by = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
        [
            tanggal,
            id_master_barang,
            id_lokasi,
            jumlah,
            harga_satuan,
            totalHarga,
            jumlah_bayar,
            sisaBayar,
            status,
            authenticatedUserId,
            id,
        ],
    );

    return getBarangMasukById(id, scope);
};

const deleteBarangMasuk = async (id, scope = null) => {
    const conditions = ["id = ?"];
    const params = [id];

    if (scope && !scope.isSuperAdmin) {
        conditions.push("id_lokasi = ?");
        params.push(scope.id_lokasi);
    }

    const [result] = await db.query(
        `DELETE FROM barang_masuk WHERE ${conditions.join(" AND ")}`,
        params,
    );

    return result.affectedRows > 0;
};

module.exports = {
    getAllBarangMasuk,
    getBarangMasukById,
    createBarangMasuk,
    updateBarangMasuk,
    deleteBarangMasuk,
};
