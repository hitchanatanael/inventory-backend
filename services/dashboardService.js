const db = require('../config/db');

const LOCATION_KEYS = {
  pusat: 'pusat',
  suban: 'suban',
};

const emptyTransactionTotals = () => ({
  pusat: 0,
  suban: 0,
});

const buildScopeWhere = (alias, scope) => {
  if (scope && !scope.isSuperAdmin) {
    return {
      clause: `AND ${alias}.id_lokasi = ?`,
      params: [scope.id_lokasi],
    };
  }

  return {
    clause: '',
    params: [],
  };
};

const mapRowsToLocationTotals = (rows) => {
  const totals = emptyTransactionTotals();

  rows.forEach((row) => {
    const locationKey = String(row.nama_lokasi || '').trim().toLowerCase();

    if (LOCATION_KEYS[locationKey]) {
      totals[LOCATION_KEYS[locationKey]] = Number(row.total_transaksi || 0);
    }
  });

  return totals;
};

const countTransactionsByLocation = async (tableName, alias, scope = null) => {
  const { clause, params } = buildScopeWhere(alias, scope);
  const [rows] = await db.query(
    `SELECT
      LOWER(TRIM(l.nama_lokasi)) AS nama_lokasi,
      COUNT(${alias}.id) AS total_transaksi
     FROM ${tableName} ${alias}
     JOIN lokasi l ON l.id = ${alias}.id_lokasi
     WHERE LOWER(TRIM(l.nama_lokasi)) IN (?, ?)
      ${clause}
     GROUP BY LOWER(TRIM(l.nama_lokasi))`,
    ['pusat', 'suban', ...params]
  );

  return mapRowsToLocationTotals(rows);
};

const getDashboardStatistics = async (scope = null) => {
  const [barangMasuk, barangKeluar] = await Promise.all([
    countTransactionsByLocation('barang_masuk', 'bm', scope),
    countTransactionsByLocation('barang_keluar', 'bk', scope),
  ]);

  return {
    barang_masuk: barangMasuk,
    barang_keluar: barangKeluar,
  };
};

module.exports = {
  getDashboardStatistics,
};
