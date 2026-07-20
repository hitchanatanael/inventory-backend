const db = require('../config/db');

const baseSelectQuery = `
  SELECT
    id,
    nama_lokasi,
    created_at,
    updated_at
  FROM lokasi
`;

const getAllLokasi = async () => {
  const [rows] = await db.query(
    `${baseSelectQuery}
     ORDER BY nama_lokasi ASC`
  );

  return rows;
};

const getLokasiById = async (id) => {
  const [rows] = await db.query(
    `${baseSelectQuery}
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const createLokasi = async (payload) => {
  const { nama_lokasi } = payload;

  const [result] = await db.query(
    'INSERT INTO lokasi (nama_lokasi) VALUES (?)',
    [nama_lokasi]
  );

  return getLokasiById(result.insertId);
};

const updateLokasi = async (id, payload) => {
  const existingLokasi = await getLokasiById(id);

  if (!existingLokasi) {
    return null;
  }

  const { nama_lokasi } = payload;

  await db.query(
    `UPDATE lokasi
     SET
      nama_lokasi = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [nama_lokasi, id]
  );

  return getLokasiById(id);
};

const deleteLokasi = async (id) => {
  const [result] = await db.query('DELETE FROM lokasi WHERE id = ?', [id]);

  return result.affectedRows > 0;
};

module.exports = {
  getAllLokasi,
  getLokasiById,
  createLokasi,
  updateLokasi,
  deleteLokasi,
};
