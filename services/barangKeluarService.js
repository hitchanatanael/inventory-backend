const db = require('../config/db');

class ServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const baseSelectQuery = `
  SELECT
    bk.id,
    bk.tanggal,
    bk.id_master_anggota,
    bk.id_master_barang,
    bk.id_lokasi,
    bk.jumlah,
    bk.harga_jual,
    bk.total_harga_jual,
    bk.jumlah_bayar,
    bk.sisa_bayar,
    bk.harga_modal,
    bk.margin,
    bk.status,
    bk.created_at,
    bk.updated_at,
    ma.nomor_anggota,
    ma.nama_anggota,
    ma.keterangan,
    mb.kode_barang,
    mb.nama_barang,
    mb.satuan,
    l.nama_lokasi
  FROM barang_keluar bk
  LEFT JOIN master_anggota ma ON ma.id = bk.id_master_anggota
  JOIN master_barang mb ON mb.id = bk.id_master_barang
  JOIN lokasi l ON l.id = bk.id_lokasi
`;

const normalizeMasterAnggotaId = (idMasterAnggota) => {
  if (
    idMasterAnggota === undefined ||
    idMasterAnggota === null ||
    idMasterAnggota === ''
  ) {
    return null;
  }

  return idMasterAnggota;
};

const getHargaModal = async (idMasterBarang) => {
  const [rows] = await db.query(
    'SELECT harga_satuan FROM master_barang WHERE id = ? LIMIT 1',
    [idMasterBarang]
  );

  return rows[0] ? Number(rows[0].harga_satuan) : null;
};

const getAvailableStock = async (idMasterBarang, idLokasi) => {
  const [rows] = await db.query(
    `SELECT COALESCE(stok, 0) AS stok
     FROM v_stok_barang
     WHERE id_master_barang = ?
      AND id_lokasi = ?
     LIMIT 1`,
    [idMasterBarang, idLokasi]
  );

  return rows[0] ? Number(rows[0].stok) : 0;
};

const validateAvailableStock = async (
  idMasterBarang,
  idLokasi,
  requestedQuantity,
  quantityToRestore = 0
) => {
  const availableStock = await getAvailableStock(idMasterBarang, idLokasi);
  const effectiveStock = availableStock + Number(quantityToRestore || 0);

  if (Number(requestedQuantity) > effectiveStock) {
    throw new ServiceError('Stok barang tidak mencukupi', 400);
  }

  return effectiveStock;
};

const calculateTransaction = async (payload) => {
  const hargaModal = await getHargaModal(payload.id_master_barang);

  if (hargaModal === null) {
    return null;
  }

  const jumlah = Number(payload.jumlah);
  const hargaJual = Number(payload.harga_jual);
  const jumlahBayar = Number(payload.jumlah_bayar);
  const totalHargaJual = jumlah * hargaJual;
  const margin = totalHargaJual - jumlah * hargaModal;
  const sisaBayar = jumlahBayar - totalHargaJual;

  return {
    totalHargaJual,
    hargaModal,
    margin,
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
    conditions.push('bk.id_lokasi = ?');
    params.push(scope.id_lokasi);
  }
};

const buildBarangKeluarConditions = (filters = {}, scope = null) => {
  const { bulan, tahun, id_lokasi, search, status } = filters;
  const conditions = [];
  const params = [];

  if (bulan !== undefined) {
    conditions.push('MONTH(bk.tanggal) = ?');
    params.push(bulan);
  }

  if (tahun !== undefined) {
    conditions.push('YEAR(bk.tanggal) = ?');
    params.push(tahun);
  }

  const scopedLocationId = getScopedLocationId(scope, id_lokasi);

  if (scopedLocationId !== undefined) {
    conditions.push('bk.id_lokasi = ?');
    params.push(scopedLocationId);
  }

  if (status) {
    conditions.push('bk.status = ?');
    params.push(status);
  }

  if (search) {
    conditions.push(`
      (
        mb.kode_barang LIKE ?
        OR mb.nama_barang LIKE ?
        OR ma.nama_anggota LIKE ?
        OR ma.nomor_anggota LIKE ?
        OR l.nama_lokasi LIKE ?
      )
    `);

    const keyword = `%${search}%`;

    params.push(keyword, keyword, keyword, keyword, keyword);
  }

  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
};

const getAllBarangKeluar = async (filters = {}, scope = null) => {
  const { whereClause, params } = buildBarangKeluarConditions(filters, scope);
  const pagination = filters.pagination;
  const limitClause = pagination ? 'LIMIT ? OFFSET ?' : '';
  const queryParams = pagination
    ? [...params, pagination.limit, pagination.offset]
    : params;

  const [rows] = await db.query(
    `${baseSelectQuery}
     ${whereClause}
     ORDER BY bk.tanggal DESC, bk.id DESC
     ${limitClause}`,
    queryParams
  );

  if (!pagination) {
    return {
      rows,
    };
  }

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM barang_keluar bk
     LEFT JOIN master_anggota ma ON ma.id = bk.id_master_anggota
     JOIN master_barang mb ON mb.id = bk.id_master_barang
     JOIN lokasi l ON l.id = bk.id_lokasi
     ${whereClause}`,
    params
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

const getBarangKeluarById = async (id, scope = null) => {
  const conditions = ['bk.id = ?'];
  const params = [id];

  addScopeCondition(conditions, params, scope);

  const [rows] = await db.query(
    `${baseSelectQuery}
     WHERE ${conditions.join(' AND ')}
     LIMIT 1`,
    params
  );

  return rows[0] || null;
};

const createBarangKeluar = async (payload, scope = null) => {
  const {
    tanggal,
    id_master_barang,
    jumlah,
    harga_jual,
    jumlah_bayar,
    status,
  } = payload;
  const id_lokasi = getScopedLocationId(scope, payload.id_lokasi);
  const scopedPayload = {
    ...payload,
    id_lokasi,
  };
  const calculation = await calculateTransaction(scopedPayload);

  if (!calculation) {
    return null;
  }

  await validateAvailableStock(id_master_barang, id_lokasi, jumlah);

  const idMasterAnggota = normalizeMasterAnggotaId(payload.id_master_anggota);

  const [result] = await db.query(
    `INSERT INTO barang_keluar
      (
        tanggal,
        id_master_anggota,
        id_master_barang,
        id_lokasi,
        jumlah,
        harga_jual,
        total_harga_jual,
        jumlah_bayar,
        sisa_bayar,
        harga_modal,
        margin,
        status
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tanggal,
      idMasterAnggota,
      id_master_barang,
      id_lokasi,
      jumlah,
      harga_jual,
      calculation.totalHargaJual,
      jumlah_bayar,
      calculation.sisaBayar,
      calculation.hargaModal,
      calculation.margin,
      status,
    ]
  );

  return getBarangKeluarById(result.insertId, scope);
};

const updateBarangKeluar = async (id, payload, scope = null) => {
  const existingBarangKeluar = await getBarangKeluarById(id, scope);

  if (!existingBarangKeluar) {
    return null;
  }

  const {
    tanggal,
    id_master_barang,
    jumlah,
    harga_jual,
    jumlah_bayar,
    status,
  } = payload;
  const id_lokasi = getScopedLocationId(scope, payload.id_lokasi);
  const scopedPayload = {
    ...payload,
    id_lokasi,
  };
  const calculation = await calculateTransaction(scopedPayload);

  if (!calculation) {
    return null;
  }

  const isSameStockSource =
    Number(existingBarangKeluar.id_master_barang) === Number(id_master_barang) &&
    Number(existingBarangKeluar.id_lokasi) === Number(id_lokasi);
  const quantityToRestore = isSameStockSource
    ? Number(existingBarangKeluar.jumlah)
    : 0;

  await validateAvailableStock(
    id_master_barang,
    id_lokasi,
    jumlah,
    quantityToRestore
  );

  const idMasterAnggota = normalizeMasterAnggotaId(payload.id_master_anggota);

  await db.query(
    `UPDATE barang_keluar
     SET
      tanggal = ?,
      id_master_anggota = ?,
      id_master_barang = ?,
      id_lokasi = ?,
      jumlah = ?,
      harga_jual = ?,
      total_harga_jual = ?,
      jumlah_bayar = ?,
      sisa_bayar = ?,
      harga_modal = ?,
      margin = ?,
      status = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      tanggal,
      idMasterAnggota,
      id_master_barang,
      id_lokasi,
      jumlah,
      harga_jual,
      calculation.totalHargaJual,
      jumlah_bayar,
      calculation.sisaBayar,
      calculation.hargaModal,
      calculation.margin,
      status,
      id,
    ]
  );

  return getBarangKeluarById(id, scope);
};

const deleteBarangKeluar = async (id, scope = null) => {
  const conditions = ['id = ?'];
  const params = [id];

  if (scope && !scope.isSuperAdmin) {
    conditions.push('id_lokasi = ?');
    params.push(scope.id_lokasi);
  }

  const [result] = await db.query(
    `DELETE FROM barang_keluar WHERE ${conditions.join(' AND ')}`,
    params
  );

  return result.affectedRows > 0;
};

module.exports = {
  getAllBarangKeluar,
  getBarangKeluarById,
  createBarangKeluar,
  updateBarangKeluar,
  deleteBarangKeluar,
  getAvailableStock,
  validateAvailableStock,
};
