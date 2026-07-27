const requiredFields = [
  'tanggal',
  'id_master_barang',
  'id_lokasi',
  'jumlah',
  'harga_jual',
  'jumlah_bayar',
  'status',
];

const allowedStatus = ['C', 'L'];

const isEmpty = (value) => value === undefined || value === null || value === '';

const isPositiveInteger = (value) => {
  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0;
};

const isNumberAtLeast = (value, minimum) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue >= minimum;
};

const isValidDate = (value) => {
  if (typeof value !== 'string') {
    return false;
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const validateBarangKeluarPayload = (body) => {
  const missingFields = requiredFields.filter((field) => isEmpty(body[field]));

  if (missingFields.length > 0) {
    return `Field wajib diisi: ${missingFields.join(', ')}`;
  }

  if (!isValidDate(body.tanggal)) {
    return 'Tanggal harus berupa tanggal valid dengan format YYYY-MM-DD';
  }

  if (!isPositiveInteger(body.id_master_barang)) {
    return 'id_master_barang harus berupa angka positif';
  }

  if (!isPositiveInteger(body.id_lokasi)) {
    return 'id_lokasi harus berupa angka positif';
  }

  if (!isPositiveInteger(body.jumlah)) {
    return 'jumlah harus berupa angka bulat lebih dari 0';
  }

  if (!isNumberAtLeast(body.harga_jual, 0)) {
    return 'harga_jual harus berupa angka lebih besar atau sama dengan 0';
  }

  if (!isNumberAtLeast(body.jumlah_bayar, 0)) {
    return 'jumlah_bayar harus berupa angka lebih besar atau sama dengan 0';
  }

  if (
    !isEmpty(body.id_master_anggota) &&
    !isPositiveInteger(body.id_master_anggota)
  ) {
    return 'id_master_anggota harus kosong atau berupa angka positif';
  }

  if (!allowedStatus.includes(body.status)) {
    return `Status harus salah satu dari: ${allowedStatus.join(', ')}`;
  }

  return null;
};

module.exports = {
  validateBarangKeluarPayload,
};
