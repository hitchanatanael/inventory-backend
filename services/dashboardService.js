const db = require('../config/db');

class DashboardError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const appTimeZone = process.env.APP_TIMEZONE || process.env.TZ || 'Asia/Jakarta';

const emptyNumber = (value) => Number(value || 0);

const formatDateParts = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: appTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === 'year').value),
    month: Number(parts.find((part) => part.type === 'month').value),
    day: Number(parts.find((part) => part.type === 'day').value),
  };
};

const toDateString = (year, month, day) => {
  return [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');
};

const getDaysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

const addDays = (dateString, days) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return toDateString(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
};

const diffDaysInclusive = (startDate, endDate) => {
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);

  return Math.floor((end - start) / 86400000) + 1;
};

const resolvePeriodRange = (filters) => {
  if (filters.period === 'custom') {
    return {
      period: filters.period,
      startDate: filters.start_date,
      endDate: filters.end_date,
    };
  }

  const todayParts = formatDateParts(new Date());
  const today = toDateString(todayParts.year, todayParts.month, todayParts.day);

  if (filters.period === 'today') {
    return {
      period: filters.period,
      startDate: today,
      endDate: today,
    };
  }

  if (filters.period === 'this_week') {
    const currentDate = new Date(Date.UTC(
      todayParts.year,
      todayParts.month - 1,
      todayParts.day
    ));
    const dayOfWeek = currentDate.getUTCDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startDate = addDays(today, -daysSinceMonday);

    return {
      period: filters.period,
      startDate,
      endDate: addDays(startDate, 6),
    };
  }

  if (filters.period === 'this_year') {
    return {
      period: filters.period,
      startDate: toDateString(todayParts.year, 1, 1),
      endDate: toDateString(todayParts.year, 12, 31),
    };
  }

  return {
    period: filters.period,
    startDate: toDateString(todayParts.year, todayParts.month, 1),
    endDate: toDateString(
      todayParts.year,
      todayParts.month,
      getDaysInMonth(todayParts.year, todayParts.month)
    ),
  };
};

const getLocationById = async (idLokasi) => {
  const [rows] = await db.query(
    `SELECT id, kode_lokasi, nama_lokasi
     FROM lokasi
     WHERE id = ?
     LIMIT 1`,
    [idLokasi]
  );

  return rows[0] || null;
};

const resolveLocationScope = async (filters, scope) => {
  if (scope && !scope.isSuperAdmin) {
    if (
      filters.id_lokasi !== undefined &&
      Number(filters.id_lokasi) !== Number(scope.id_lokasi)
    ) {
      throw new DashboardError(
        'Anda tidak memiliki akses ke dashboard lokasi tersebut',
        403
      );
    }

    const lokasi = await getLocationById(scope.id_lokasi);

    if (!lokasi) {
      throw new DashboardError('Lokasi pengguna tidak ditemukan', 404);
    }

    return {
      id_lokasi: Number(scope.id_lokasi),
      nama_lokasi: lokasi.nama_lokasi,
      isFiltered: true,
    };
  }

  if (filters.id_lokasi !== undefined) {
    const lokasi = await getLocationById(filters.id_lokasi);

    if (!lokasi) {
      throw new DashboardError('Lokasi tidak ditemukan', 404);
    }

    return {
      id_lokasi: Number(filters.id_lokasi),
      nama_lokasi: lokasi.nama_lokasi,
      isFiltered: true,
    };
  }

  return {
    id_lokasi: null,
    nama_lokasi: null,
    isFiltered: false,
  };
};

const buildDateAndLocationWhere = (alias, range, locationScope) => {
  const conditions = [`${alias}.tanggal BETWEEN ? AND ?`];
  const params = [range.startDate, range.endDate];

  if (locationScope.id_lokasi !== null) {
    conditions.push(`${alias}.id_lokasi = ?`);
    params.push(locationScope.id_lokasi);
  }

  return {
    whereClause: `WHERE ${conditions.join(' AND ')}`,
    params,
  };
};

const buildStockWhere = (locationScope) => {
  if (locationScope.id_lokasi === null) {
    return {
      whereClause: '',
      params: [],
    };
  }

  return {
    whereClause: 'WHERE id_lokasi = ?',
    params: [locationScope.id_lokasi],
  };
};

const getSummary = async (range, locationScope) => {
  const masukWhere = buildDateAndLocationWhere('bm', range, locationScope);
  const keluarWhere = buildDateAndLocationWhere('bk', range, locationScope);
  const stockWhere = buildStockWhere(locationScope);

  const [[masukRows], [keluarRows], [stockRows]] = await Promise.all([
    db.query(
      `SELECT
        COUNT(*) AS count,
        COALESCE(SUM(jumlah), 0) AS jumlah,
        COALESCE(SUM(total_harga), 0) AS total,
        COALESCE(SUM(jumlah_bayar), 0) AS dibayar,
        COALESCE(SUM(GREATEST(total_harga - jumlah_bayar, 0)), 0) AS piutang
       FROM barang_masuk bm
       ${masukWhere.whereClause}`,
      masukWhere.params
    ),
    db.query(
      `SELECT
        COUNT(*) AS count,
        COALESCE(SUM(jumlah), 0) AS jumlah,
        COALESCE(SUM(total_harga_jual), 0) AS total,
        COALESCE(SUM(jumlah * harga_modal), 0) AS modal,
        COALESCE(SUM(margin), 0) AS margin,
        COALESCE(SUM(jumlah_bayar), 0) AS dibayar,
        COALESCE(SUM(GREATEST(total_harga_jual - jumlah_bayar, 0)), 0) AS piutang
       FROM barang_keluar bk
       ${keluarWhere.whereClause}`,
      keluarWhere.params
    ),
    db.query(
      `SELECT
        COALESCE(SUM(stok), 0) AS jumlah,
        COALESCE(SUM(nilai_aset), 0) AS nilai_aset
       FROM v_stok_barang
       ${stockWhere.whereClause}`,
      stockWhere.params
    ),
  ]);

  const masuk = masukRows[0] || {};
  const keluar = keluarRows[0] || {};
  const stock = stockRows[0] || {};

  return {
    barang_masuk: {
      count: emptyNumber(masuk.count),
      jumlah: emptyNumber(masuk.jumlah),
      total: emptyNumber(masuk.total),
    },
    barang_keluar: {
      count: emptyNumber(keluar.count),
      jumlah: emptyNumber(keluar.jumlah),
      total: emptyNumber(keluar.total),
    },
    stok: {
      jumlah: emptyNumber(stock.jumlah),
      nilai_aset: emptyNumber(stock.nilai_aset),
    },
    finance: {
      revenue: emptyNumber(keluar.total),
      modal: emptyNumber(keluar.modal),
      margin: emptyNumber(keluar.margin),
      dibayar: emptyNumber(keluar.dibayar),
      piutang: emptyNumber(keluar.piutang),
    },
  };
};

const getStatusSummary = async (range, locationScope) => {
  const keluarWhere = buildDateAndLocationWhere('bk', range, locationScope);
  const [rows] = await db.query(
    `SELECT
      status,
      COUNT(*) AS count,
      COALESCE(SUM(total_harga_jual), 0) AS total
     FROM barang_keluar bk
     ${keluarWhere.whereClause}
     GROUP BY status
     ORDER BY status ASC`,
    keluarWhere.params
  );

  return rows.map((row) => ({
    status: row.status,
    count: emptyNumber(row.count),
    total: emptyNumber(row.total),
  }));
};

const getRecentBarangMasuk = async (range, locationScope, limit) => {
  const masukWhere = buildDateAndLocationWhere('bm', range, locationScope);
  const [rows] = await db.query(
    `SELECT
      bm.id,
      DATE_FORMAT(bm.tanggal, '%Y-%m-%d') AS tanggal,
      mb.kode_barang,
      mb.nama_barang,
      bm.jumlah,
      mb.satuan,
      bm.total_harga AS total,
      bm.status,
      bm.id_lokasi,
      l.nama_lokasi AS lokasi
     FROM barang_masuk bm
     LEFT JOIN master_barang mb ON mb.id = bm.id_master_barang
     LEFT JOIN lokasi l ON l.id = bm.id_lokasi
     ${masukWhere.whereClause}
     ORDER BY bm.tanggal DESC, bm.id DESC
     LIMIT ?`,
    [...masukWhere.params, limit]
  );

  return rows.map((row) => ({
    id: row.id,
    tanggal: row.tanggal,
    kode_barang: row.kode_barang,
    nama_barang: row.nama_barang,
    jumlah: emptyNumber(row.jumlah),
    satuan: row.satuan,
    total: emptyNumber(row.total),
    status: row.status,
    id_lokasi: row.id_lokasi,
    lokasi: row.lokasi,
  }));
};

const getRecentBarangKeluar = async (range, locationScope, limit) => {
  const keluarWhere = buildDateAndLocationWhere('bk', range, locationScope);
  const [rows] = await db.query(
    `SELECT
      bk.id,
      DATE_FORMAT(bk.tanggal, '%Y-%m-%d') AS tanggal,
      ma.nomor_anggota,
      ma.nama_anggota,
      mb.nama_barang,
      bk.jumlah,
      bk.total_harga_jual AS total,
      bk.status,
      bk.id_lokasi,
      l.nama_lokasi AS lokasi
     FROM barang_keluar bk
     LEFT JOIN master_anggota ma ON ma.id = bk.id_master_anggota
     JOIN master_barang mb ON mb.id = bk.id_master_barang
     JOIN lokasi l ON l.id = bk.id_lokasi
     ${keluarWhere.whereClause}
     ORDER BY bk.tanggal DESC, bk.id DESC
     LIMIT ?`,
    [...keluarWhere.params, limit]
  );

  return rows.map((row) => ({
    id: row.id,
    tanggal: row.tanggal,
    nomor_anggota: row.nomor_anggota,
    nama_anggota: row.nama_anggota,
    nama_barang: row.nama_barang,
    jumlah: emptyNumber(row.jumlah),
    total: emptyNumber(row.total),
    status: row.status,
    id_lokasi: row.id_lokasi,
    lokasi: row.lokasi,
  }));
};

const getLocationSummary = async (range, locationScope) => {
  const params = [range.startDate, range.endDate, range.startDate, range.endDate];
  const conditions = [];

  if (locationScope.id_lokasi !== null) {
    conditions.push('l.id = ?');
    params.push(locationScope.id_lokasi);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await db.query(
    `SELECT
      l.id AS id_lokasi,
      l.nama_lokasi,
      COALESCE(bm.barang_masuk_count, 0) AS barang_masuk_count,
      COALESCE(bm.barang_masuk_quantity, 0) AS barang_masuk_quantity,
      COALESCE(bm.barang_masuk_total, 0) AS barang_masuk_total,
      COALESCE(bk.barang_keluar_count, 0) AS barang_keluar_count,
      COALESCE(vs.stok_total, 0) AS stok_total,
      COALESCE(vs.nilai_aset, 0) AS nilai_aset,
      COALESCE(bk.revenue, 0) AS revenue,
      COALESCE(bk.margin, 0) AS margin,
      COALESCE(bk.piutang, 0) AS piutang
     FROM lokasi l
     LEFT JOIN (
      SELECT
        bm.id_lokasi,
        COUNT(bm.id) AS barang_masuk_count,
        COALESCE(SUM(bm.jumlah), 0) AS barang_masuk_quantity,
        COALESCE(SUM(bm.total_harga), 0) AS barang_masuk_total
      FROM barang_masuk bm
      WHERE bm.tanggal BETWEEN ? AND ?
      GROUP BY bm.id_lokasi
     ) bm ON bm.id_lokasi = l.id
     LEFT JOIN (
      SELECT
        id_lokasi,
        COUNT(*) AS barang_keluar_count,
        COALESCE(SUM(total_harga_jual), 0) AS revenue,
        COALESCE(SUM(margin), 0) AS margin,
        COALESCE(SUM(GREATEST(total_harga_jual - jumlah_bayar, 0)), 0) AS piutang
      FROM barang_keluar
      WHERE tanggal BETWEEN ? AND ?
      GROUP BY id_lokasi
     ) bk ON bk.id_lokasi = l.id
     LEFT JOIN (
      SELECT
        id_lokasi,
        COALESCE(SUM(stok), 0) AS stok_total,
        COALESCE(SUM(nilai_aset), 0) AS nilai_aset
      FROM v_stok_barang
      GROUP BY id_lokasi
     ) vs ON vs.id_lokasi = l.id
     ${whereClause}
     ORDER BY l.nama_lokasi ASC`,
    params
  );

  return rows.map((row) => ({
    id_lokasi: row.id_lokasi,
    nama_lokasi: row.nama_lokasi,
    barang_masuk: emptyNumber(row.barang_masuk_count),
    barang_masuk_count: emptyNumber(row.barang_masuk_count),
    barang_masuk_quantity: emptyNumber(row.barang_masuk_quantity),
    barang_masuk_total: emptyNumber(row.barang_masuk_total),
    barang_keluar_count: emptyNumber(row.barang_keluar_count),
    stok_total: emptyNumber(row.stok_total),
    nilai_aset: emptyNumber(row.nilai_aset),
    revenue: emptyNumber(row.revenue),
    margin: emptyNumber(row.margin),
    piutang: emptyNumber(row.piutang),
  }));
};

const getTrendGrouping = (range) => {
  if (range.period === 'this_year') {
    return 'month';
  }

  if (range.period === 'custom' && diffDaysInclusive(range.startDate, range.endDate) > 31) {
    return 'month';
  }

  return 'day';
};

const getTrend = async (range, locationScope) => {
  const grouping = getTrendGrouping(range);
  const masukWhere = buildDateAndLocationWhere('bm', range, locationScope);
  const keluarWhere = buildDateAndLocationWhere('bk', range, locationScope);
  const masukLabel = grouping === 'month'
    ? "DATE_FORMAT(bm.tanggal, '%Y-%m')"
    : "DATE_FORMAT(bm.tanggal, '%Y-%m-%d')";
  const keluarLabel = grouping === 'month'
    ? "DATE_FORMAT(bk.tanggal, '%Y-%m')"
    : "DATE_FORMAT(bk.tanggal, '%Y-%m-%d')";

  const [[masukRows], [keluarRows]] = await Promise.all([
    db.query(
      `SELECT
        ${masukLabel} AS label,
        COALESCE(SUM(total_harga), 0) AS barang_masuk
       FROM barang_masuk bm
       ${masukWhere.whereClause}
       GROUP BY label`,
      masukWhere.params
    ),
    db.query(
      `SELECT
        ${keluarLabel} AS label,
        COALESCE(SUM(total_harga_jual), 0) AS barang_keluar,
        COALESCE(SUM(margin), 0) AS margin
       FROM barang_keluar bk
       ${keluarWhere.whereClause}
       GROUP BY label`,
      keluarWhere.params
    ),
  ]);

  const trendByLabel = new Map();

  masukRows.forEach((row) => {
    trendByLabel.set(row.label, {
      label: row.label,
      barang_masuk: emptyNumber(row.barang_masuk),
      barang_keluar: 0,
      margin: 0,
    });
  });

  keluarRows.forEach((row) => {
    const existing = trendByLabel.get(row.label) || {
      label: row.label,
      barang_masuk: 0,
      barang_keluar: 0,
      margin: 0,
    };

    trendByLabel.set(row.label, {
      ...existing,
      barang_keluar: emptyNumber(row.barang_keluar),
      margin: emptyNumber(row.margin),
    });
  });

  return [...trendByLabel.values()].sort((left, right) =>
    left.label.localeCompare(right.label)
  );
};

const getDashboardStatistics = async (filters = {}, scope = null) => {
  const range = resolvePeriodRange(filters);
  const locationScope = await resolveLocationScope(filters, scope);
  const recentLimit = filters.recent_limit || 5;

  const [
    summary,
    statusSummary,
    locationSummary,
    recentBarangMasuk,
    recentBarangKeluar,
    trend,
  ] = await Promise.all([
    getSummary(range, locationScope),
    getStatusSummary(range, locationScope),
    getLocationSummary(range, locationScope),
    getRecentBarangMasuk(range, locationScope, recentLimit),
    getRecentBarangKeluar(range, locationScope, recentLimit),
    getTrend(range, locationScope),
  ]);

  return {
    filters: {
      period: range.period,
      start_date: range.startDate,
      end_date: range.endDate,
      id_lokasi: locationScope.id_lokasi,
      nama_lokasi: locationScope.nama_lokasi,
    },
    summary,
    status_summary: statusSummary,
    location_summary: locationSummary,
    recent_barang_masuk: recentBarangMasuk,
    recent_barang_keluar: recentBarangKeluar,
    trend,
  };
};

module.exports = {
  DashboardError,
  getDashboardStatistics,
};
