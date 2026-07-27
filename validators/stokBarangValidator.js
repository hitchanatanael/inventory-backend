const isPositiveIntegerString = (value) => /^\d+$/.test(value) && Number(value) > 0;

const normalizeHanyaTersedia = (value) => {
  if (value === undefined || value === '') {
    return {
      value: undefined,
    };
  }

  if (value === 'true' || value === '1') {
    return {
      value: true,
    };
  }

  if (value === 'false' || value === '0') {
    return {
      value: false,
    };
  }

  return {
    error: 'Filter ketersediaan tidak valid',
  };
};

const validateStokBarangQuery = (query) => {
  const filters = {};

  if (query.id_lokasi !== undefined && query.id_lokasi !== '') {
    if (!isPositiveIntegerString(String(query.id_lokasi))) {
      return {
        error: 'Lokasi tidak valid',
      };
    }

    filters.id_lokasi = Number(query.id_lokasi);
  }

  if (query.search !== undefined) {
    const search = String(query.search).trim();

    if (search) {
      filters.search = search;
    }
  }

  const hanyaTersediaResult = normalizeHanyaTersedia(query.hanya_tersedia);

  if (hanyaTersediaResult.error) {
    return {
      error: hanyaTersediaResult.error,
    };
  }

  if (hanyaTersediaResult.value !== undefined) {
    filters.hanya_tersedia = hanyaTersediaResult.value;
  }

  return {
    filters,
  };
};

module.exports = {
  validateStokBarangQuery,
};
