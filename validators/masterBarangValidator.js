const requiredFields = [
  'kode_barang',
  'nama_barang',
  'satuan',
  'id_lokasi',
  'harga_satuan',
];

const isEmpty = (value) => value === undefined || value === null || value === '';

const validateMasterBarangPayload = (body) => {
  const missingFields = requiredFields.filter((field) => isEmpty(body[field]));

  if (missingFields.length > 0) {
    return `Field wajib diisi: ${missingFields.join(', ')}`;
  }

  return null;
};

module.exports = {
  validateMasterBarangPayload,
};
