const express = require('express');

const stokBarangController = require('../controllers/stokBarangController');

const router = express.Router();

router.get('/ringkasan', stokBarangController.getRingkasanStokBarang);
router.get('/', stokBarangController.getAllStokBarang);

module.exports = router;
