const requiredFields = ['nama_lokasi'];

const isEmpty = (value) => value === undefined || value === null || value === '';

const validateLokasiPayload = (body) => {
  const missingFields = requiredFields.filter((field) => isEmpty(body[field]));

  if (missingFields.length > 0) {
    return `Field wajib diisi: ${missingFields.join(', ')}`;
  }

  return null;
};

module.exports = {
  validateLokasiPayload,
};
