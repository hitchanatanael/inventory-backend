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

const validateBarangKeluarPayload = (body) => {
  const missingFields = requiredFields.filter((field) => isEmpty(body[field]));

  if (missingFields.length > 0) {
    return `Field wajib diisi: ${missingFields.join(', ')}`;
  }

  if (!allowedStatus.includes(body.status)) {
    return `Status harus salah satu dari: ${allowedStatus.join(', ')}`;
  }

  return null;
};

module.exports = {
  validateBarangKeluarPayload,
};
