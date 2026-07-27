const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = require('../config/db');
const authService = require('../services/authService');
const { ROLE_SUPER_ADMIN } = require('../constants/roles');

const parseArgs = (args) => {
  return args.reduce((parsedArgs, arg) => {
    if (!arg.startsWith('--')) {
      return parsedArgs;
    }

    const separatorIndex = arg.indexOf('=');

    if (separatorIndex === -1) {
      parsedArgs[arg.slice(2)] = '';
      return parsedArgs;
    }

    const key = arg.slice(2, separatorIndex);
    const value = arg.slice(separatorIndex + 1);

    parsedArgs[key] = value;
    return parsedArgs;
  }, {});
};

const isEmpty = (value) => value === undefined || value === null || value === '';

const validatePayload = (payload) => {
  if (isEmpty(payload.nama)) {
    return 'Nama wajib diisi';
  }

  if (isEmpty(payload.username)) {
    return 'Username wajib diisi';
  }

  if (isEmpty(payload.password)) {
    return 'Password wajib diisi';
  }

  if (String(payload.password).length < 8) {
    return 'Password minimal 8 karakter';
  }

  return null;
};

const main = async () => {
  try {
    const args = parseArgs(process.argv.slice(2));
    const payload = {
      nama: isEmpty(args.nama) ? args.nama : String(args.nama).trim(),
      username: isEmpty(args.username) ? args.username : String(args.username).trim(),
      password: args.password,
    };
    const validationMessage = validatePayload(payload);

    if (validationMessage) {
      console.error(validationMessage);
      process.exitCode = 1;
      return;
    }

    const role = await authService.findRoleByName(ROLE_SUPER_ADMIN);

    if (!role) {
      console.error('Role SUPER ADMIN tidak ditemukan');
      process.exitCode = 1;
      return;
    }

    const roleValidation = authService.validateUserRoleLocation({
      nama_role: role.nama_role,
      id_lokasi: null,
    });

    if (!roleValidation.isValid) {
      console.error(roleValidation.message);
      process.exitCode = 1;
      return;
    }

    const existingUser = await authService.findUserByUsername(payload.username);

    if (existingUser) {
      console.error('Username sudah digunakan');
      process.exitCode = 1;
      return;
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(payload.password, saltRounds);

    await authService.createSuperAdmin({
      id_role: role.id,
      nama: payload.nama,
      username: payload.username,
      password_hash: passwordHash,
    });

    console.log('Super Admin berhasil dibuat');
  } catch (error) {
    console.error('Gagal membuat Super Admin');
    process.exitCode = 1;
  } finally {
    await db.end().catch(() => {});
  }
};

main();
