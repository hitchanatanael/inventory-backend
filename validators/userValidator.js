const {
  ALLOWED_LIMITS,
  validatePaginationQuery,
} = require('./paginationValidator');

const isEmpty = (value) => value === undefined || value === null || value === '';

const normalizeUsername = (value) => {
  if (isEmpty(value)) {
    return value;
  }

  return String(value).trim();
};

const isPositiveInteger = (value) => {
  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0;
};

const isActiveValue = (value) => {
  if (typeof value === 'boolean') {
    return true;
  }

  const numberValue = Number(value);

  return Number.isInteger(numberValue) && [0, 1].includes(numberValue);
};

const normalizeActiveValue = (value) => {
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  return Number(value);
};

const validatePassword = (password) => {
  if (isEmpty(password)) {
    return 'Password wajib diisi';
  }

  if (String(password).length < 8) {
    return 'Password minimal 8 karakter';
  }

  return null;
};

const validatePasswordConfirmation = (payload) => {
  if (payload.password_confirmation === undefined) {
    return 'Konfirmasi password wajib diisi';
  }

  if (payload.password !== payload.password_confirmation) {
    return 'Konfirmasi password tidak sesuai';
  }

  return null;
};

const normalizeUserPayload = (body) => ({
  nama: isEmpty(body.nama) ? body.nama : String(body.nama).trim(),
  username: normalizeUsername(body.username),
  password: body.password,
  password_confirmation: body.password_confirmation,
  id_role: body.id_role,
  id_lokasi: isEmpty(body.id_lokasi) ? null : body.id_lokasi,
});

const validateCreateUserPayload = (payload) => {
  if (isEmpty(payload.nama)) {
    return 'Nama wajib diisi';
  }

  if (isEmpty(payload.username)) {
    return 'Username wajib diisi';
  }

  const passwordMessage = validatePassword(payload.password);

  if (passwordMessage) {
    return passwordMessage;
  }

  const confirmationMessage = validatePasswordConfirmation(payload);

  if (confirmationMessage) {
    return confirmationMessage;
  }

  if (!isPositiveInteger(payload.id_role)) {
    return 'Role wajib diisi';
  }

  if (
    !isEmpty(payload.id_lokasi) &&
    !isPositiveInteger(payload.id_lokasi)
  ) {
    return 'Lokasi harus berupa angka positif';
  }

  return null;
};

const validateUpdateUserPayload = (payload) => {
  if (isEmpty(payload.nama)) {
    return 'Nama wajib diisi';
  }

  if (isEmpty(payload.username)) {
    return 'Username wajib diisi';
  }

  if (!isPositiveInteger(payload.id_role)) {
    return 'Role wajib diisi';
  }

  if (
    !isEmpty(payload.id_lokasi) &&
    !isPositiveInteger(payload.id_lokasi)
  ) {
    return 'Lokasi harus berupa angka positif';
  }

  return null;
};

const validateStatusPayload = (body) => {
  if (!isActiveValue(body.is_active)) {
    return 'Status aktif harus bernilai boolean, 0, atau 1';
  }

  return null;
};

const validatePasswordPayload = (body) => {
  const passwordMessage = validatePassword(body.password);

  if (passwordMessage) {
    return passwordMessage;
  }

  return validatePasswordConfirmation(body);
};

const validateUserQuery = (query) => {
  const filters = {};
  const paginationResult = validatePaginationQuery(query);

  if (paginationResult.error) {
    return {
      error: paginationResult.error,
    };
  }

  filters.page = paginationResult.pagination.page;
  filters.limit = paginationResult.pagination.limit;
  filters.offset = paginationResult.pagination.offset;

  if (query.search !== undefined) {
    const search = String(query.search).trim();

    if (search) {
      filters.search = search;
    }
  }

  if (query.id_role !== undefined && query.id_role !== '') {
    if (!isPositiveInteger(query.id_role)) {
      return {
        error: 'Filter role harus berupa angka positif',
      };
    }

    filters.id_role = Number(query.id_role);
  }

  if (query.id_lokasi !== undefined && query.id_lokasi !== '') {
    if (!isPositiveInteger(query.id_lokasi)) {
      return {
        error: 'Filter lokasi harus berupa angka positif',
      };
    }

    filters.id_lokasi = Number(query.id_lokasi);
  }

  if (query.status !== undefined && query.status !== '') {
    const status = String(query.status).trim().toLowerCase();

    if (!['active', 'inactive'].includes(status)) {
      return {
        error: 'Filter status harus active atau inactive',
      };
    }

    filters.is_active = status === 'active' ? 1 : 0;
  } else if (query.is_active !== undefined && query.is_active !== '') {
    if (!isActiveValue(query.is_active)) {
      return {
        error: 'Filter status aktif harus bernilai boolean, 0, atau 1',
      };
    }

    filters.is_active = normalizeActiveValue(query.is_active);
  }

  return {
    filters,
  };
};

module.exports = {
  ALLOWED_LIMITS,
  normalizeUserPayload,
  normalizeUsername,
  normalizeActiveValue,
  validateCreateUserPayload,
  validateUpdateUserPayload,
  validateStatusPayload,
  validatePasswordPayload,
  validateUserQuery,
};
