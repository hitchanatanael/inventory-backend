const db = require('../config/db');

const getExamples = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 AS id, ? AS name', ['Contoh data']);

    res.json({
      message: 'Data contoh berhasil diambil',
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Gagal mengambil data contoh',
      error: error.message,
    });
  }
};

module.exports = {
  getExamples,
};
