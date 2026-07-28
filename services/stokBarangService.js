const db = require('../config/db');

const baseSelectQuery = `
  SELECT
    id_master_barang,
    kode_barang,
    nama_barang,
    satuan,
    id_lokasi,
    kode_lokasi,
    nama_lokasi,
    stok_masuk,
    stok_keluar,
    stok,
    harga_satuan,
    nilai_aset
  FROM v_stok_barang
`;

const getScopedLocationId = (scope, requestedLocationId) => {
  if (scope && !scope.isSuperAdmin) {
    return scope.id_lokasi;
  }

  return requestedLocationId;
};

const getAllStokBarang = async (filters = {}, scope = null) => {
  const { id_lokasi, search, hanya_tersedia } = filters;
  const conditions = [];
  const values = [];
  const scopedLocationId = getScopedLocationId(scope, id_lokasi);

  if (scopedLocationId !== undefined) {
    conditions.push('id_lokasi = ?');
    values.push(scopedLocationId);
  }

  if (search) {
    conditions.push(`
      (
        kode_barang LIKE ?
        OR nama_barang LIKE ?
        OR satuan LIKE ?
        OR kode_lokasi LIKE ?
        OR nama_lokasi LIKE ?
      )
    `);

    const keyword = `%${search}%`;

    values.push(keyword, keyword, keyword, keyword, keyword);
  }

  if (hanya_tersedia === true) {
    conditions.push('stok > 0');
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const [rows] = await db.query(
    `${baseSelectQuery}
     ${whereClause}
     ORDER BY
      nama_lokasi ASC,
      nama_barang ASC,
      kode_barang ASC`,
    values
  );

  return rows;
};

const getRingkasanStokBarang = async (scope = null) => {
  const conditions = [];
  const values = [];

  if (scope && !scope.isSuperAdmin) {
    conditions.push('id_lokasi = ?');
    values.push(scope.id_lokasi);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const [keseluruhanRows] = await db.query(`
    SELECT
      COUNT(*) AS total_jenis_barang,
      COALESCE(SUM(stok), 0) AS total_stok,
      COALESCE(SUM(nilai_aset), 0) AS total_nilai_aset
    FROM v_stok_barang
    ${whereClause}
  `, values);

  const [perLokasiRows] = await db.query(`
    SELECT
      id_lokasi,
      kode_lokasi,
      nama_lokasi,
      COUNT(*) AS total_jenis_barang,
      COALESCE(SUM(stok), 0) AS total_stok,
      COALESCE(SUM(nilai_aset), 0) AS total_nilai_aset
    FROM v_stok_barang
    ${whereClause}
    GROUP BY
      id_lokasi,
      kode_lokasi,
      nama_lokasi
    ORDER BY nama_lokasi ASC
  `, values);

  return {
    keseluruhan: keseluruhanRows[0],
    per_lokasi: perLokasiRows,
  };
};

module.exports = {
  getAllStokBarang,
  getRingkasanStokBarang,
};
