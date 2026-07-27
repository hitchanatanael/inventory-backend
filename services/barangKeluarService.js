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

const getAllBarangKeluar = async (filters = {}) => {
  const { bulan, tahun, id_lokasi, search } = filters;
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

  if (id_lokasi !== undefined) {
    conditions.push('bk.id_lokasi = ?');
    params.push(id_lokasi);
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

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const [rows] = await db.query(
    `${baseSelectQuery}
     ${whereClause}
     ORDER BY bk.tanggal DESC, bk.id DESC`,
    params
  );

  return rows;
};

const getBarangKeluarById = async (id) => {
  const [rows] = await db.query(
    `${baseSelectQuery}
     WHERE bk.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const createBarangKeluar = async (payload) => {
  const {
    tanggal,
    id_master_barang,
    id_lokasi,
    jumlah,
    harga_jual,
    jumlah_bayar,
    status,
  } = payload;
  const calculation = await calculateTransaction(payload);

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

  return getBarangKeluarById(result.insertId);
};

const updateBarangKeluar = async (id, payload) => {
  const existingBarangKeluar = await getBarangKeluarById(id);

  if (!existingBarangKeluar) {
    return null;
  }

  const {
    tanggal,
    id_master_barang,
    id_lokasi,
    jumlah,
    harga_jual,
    jumlah_bayar,
    status,
  } = payload;
  const calculation = await calculateTransaction(payload);

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

  return getBarangKeluarById(id);
};

const deleteBarangKeluar = async (id) => {
  const [result] = await db.query('DELETE FROM barang_keluar WHERE id = ?', [id]);

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
