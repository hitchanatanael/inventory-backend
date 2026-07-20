const db = require('../config/db');

const baseSelectQuery = `
  SELECT
    bm.id,
    bm.tanggal,
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
    mb.kode_barang,
    mb.nama_barang,
    mb.satuan,
    l.nama_lokasi
  FROM barang_masuk bm
  LEFT JOIN master_barang mb ON mb.id = bm.id_master_barang
  LEFT JOIN lokasi l ON l.id = bm.id_lokasi
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

const getAllBarangMasuk = async () => {
  const [rows] = await db.query(
    `${baseSelectQuery}
     ORDER BY bm.tanggal DESC, bm.id DESC`
  );

  return rows;
};

const getBarangMasukById = async (id) => {
  const [rows] = await db.query(
    `${baseSelectQuery}
     WHERE bm.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const createBarangMasuk = async (payload) => {
  const {
    tanggal,
    id_master_barang,
    id_lokasi,
    jumlah,
    harga_satuan,
    jumlah_bayar,
    status,
  } = payload;
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
        status
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ]
  );

  return getBarangMasukById(result.insertId);
};

const updateBarangMasuk = async (id, payload) => {
  const existingBarangMasuk = await getBarangMasukById(id);

  if (!existingBarangMasuk) {
    return null;
  }

  const {
    tanggal,
    id_master_barang,
    id_lokasi,
    jumlah,
    harga_satuan,
    jumlah_bayar,
    status,
  } = payload;
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
      id,
    ]
  );

  return getBarangMasukById(id);
};

const deleteBarangMasuk = async (id) => {
  const [result] = await db.query('DELETE FROM barang_masuk WHERE id = ?', [id]);

  return result.affectedRows > 0;
};

module.exports = {
  getAllBarangMasuk,
  getBarangMasukById,
  createBarangMasuk,
  updateBarangMasuk,
  deleteBarangMasuk,
};
