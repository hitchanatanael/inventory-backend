const { validatePaginationQuery } = require('./paginationValidator');

const isEmpty = (value) => value === undefined || value === null || value === '';

const normalizeLokasiPayload = (body) => {
  const rawName = body.nama !== undefined ? body.nama : body.nama_lokasi;

  return {
    nama_lokasi: isEmpty(rawName) ? rawName : String(rawName).trim(),
  };
};

const validateLokasiPayload = (payload) => {
  if (isEmpty(payload.nama_lokasi)) {
    return 'Nama lokasi wajib diisi';
  }

  if (typeof payload.nama_lokasi !== 'string') {
    return 'Nama lokasi harus berupa teks';
  }

  if (payload.nama_lokasi.trim() === '') {
    return 'Nama lokasi tidak boleh kosong';
  }

  if (payload.nama_lokasi.length > 100) {
    return 'Nama lokasi maksimal 100 karakter';
  }

  return null;
};

const validateLokasiId = (id) => {
  const numberValue = Number(id);

  if (!Number.isInteger(numberValue) || numberValue < 1) {
    return {
      error: 'ID lokasi harus berupa angka positif',
    };
  }

  return {
    id: numberValue,
  };
};

const validateLokasiQuery = (query) => {
  const { error, pagination } = validatePaginationQuery(query);

  if (error) {
    return {
      error,
    };
  }

  const filters = {
    ...pagination,
  };

  if (query.search !== undefined) {
    const search = String(query.search).trim();

    if (search) {
      filters.search = search;
    }
  }

  return {
    filters,
  };
};

module.exports = {
  normalizeLokasiPayload,
  validateLokasiPayload,
  validateLokasiId,
  validateLokasiQuery,
};
