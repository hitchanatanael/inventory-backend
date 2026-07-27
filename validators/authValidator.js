const isEmpty = (value) => value === undefined || value === null || value === '';

const normalizeLoginPayload = (body) => ({
  username: isEmpty(body.username) ? body.username : String(body.username).trim(),
  password: body.password,
});

const validateLoginPayload = (body) => {
  const normalizedBody = normalizeLoginPayload(body);

  if (isEmpty(normalizedBody.username)) {
    return 'Username wajib diisi';
  }

  if (isEmpty(normalizedBody.password)) {
    return 'Password wajib diisi';
  }

  return null;
};

module.exports = {
  normalizeLoginPayload,
  validateLoginPayload,
};
