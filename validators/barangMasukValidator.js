const requiredFields = [
  'tanggal',
  'id_master_barang',
  'id_lokasi',
  'jumlah',
  'harga_satuan',
  'jumlah_bayar',
  'status',
];

const allowedStatus = ['LUNAS', 'PIUTANG', 'LOAN'];

const isEmpty = (value) => value === undefined || value === null || value === '';

const validateBarangMasukPayload = (body) => {
  const missingFields = requiredFields.filter((field) => isEmpty(body[field]));

  if (missingFields.length > 0) {
    return `Field wajib diisi: ${missingFields.join(', ')}`;
  }

  if (!allowedStatus.includes(body.status)) {
    return `Status hanya boleh: ${allowedStatus.join(', ')}`;
  }

  return null;
};

module.exports = {
  validateBarangMasukPayload,
};
