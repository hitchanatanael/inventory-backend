const express = require('express');

const stokBarangController = require('../controllers/stokBarangController');
const {
  authenticateToken,
  attachLocationScope,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);
router.use(attachLocationScope);

router.get('/ringkasan', stokBarangController.getRingkasanStokBarang);
router.get('/', stokBarangController.getAllStokBarang);

module.exports = router;
