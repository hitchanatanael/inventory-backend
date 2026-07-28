const express = require('express');
const cors = require('cors');
require('dotenv').config();

const exampleRoutes = require('./routes/exampleRoutes');
const masterBarangRoutes = require('./routes/masterBarangRoutes');
const masterAnggotaRoutes = require('./routes/masterAnggotaRoutes');
const lokasiRoutes = require('./routes/lokasiRoutes');
const barangMasukRoutes = require('./routes/barangMasukRoutes');
const barangKeluarRoutes = require('./routes/barangKeluarRoutes');
const stokBarangRoutes = require('./routes/stokBarangRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'API Inventory Pupuk berjalan',
  });
});

app.use('/api/examples', exampleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/master-barang', masterBarangRoutes);
app.use('/api/master-anggota', masterAnggotaRoutes);
app.use('/api/lokasi', lokasiRoutes);
app.use('/api/barang-masuk', barangMasukRoutes);
app.use('/api/barang-keluar', barangKeluarRoutes);
app.use('/api/stok-barang', stokBarangRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
