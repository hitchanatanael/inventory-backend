const requiredFields = ['nomor_anggota', 'nama_anggota'];
const { validatePaginationQuery } = require('./paginationValidator');

const isEmpty = (value) => value === undefined || value === null || value === '';

const validateMasterAnggotaPayload = (body) => {
  const missingFields = requiredFields.filter((field) => isEmpty(body[field]));

  if (missingFields.length > 0) {
    return `Field wajib diisi: ${missingFields.join(', ')}`;
  }

  return null;
};

const validateMasterAnggotaQuery = (query) => {
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
  validateMasterAnggotaPayload,
  validateMasterAnggotaQuery,
};
