const stokBarangService = require('../services/stokBarangService');
const response = require('../utils/response');
const {
  validateStokBarangQuery,
} = require('../validators/stokBarangValidator');

const getAllStokBarang = async (req, res) => {
  try {
    const { filters, error } = validateStokBarangQuery(req.query);

    if (error) {
      return response.error(res, error, 400);
    }

    const data = await stokBarangService.getAllStokBarang(filters);

    return response.success(res, 'Data stok barang berhasil diambil', data);
  } catch (error) {
    return response.error(res, 'Gagal mengambil data stok barang');
  }
};

const getRingkasanStokBarang = async (req, res) => {
  try {
    const data = await stokBarangService.getRingkasanStokBarang();

    return response.success(res, 'Ringkasan stok barang berhasil diambil', data);
  } catch (error) {
    return response.error(res, 'Gagal mengambil ringkasan stok barang');
  }
};

module.exports = {
  getAllStokBarang,
  getRingkasanStokBarang,
};
