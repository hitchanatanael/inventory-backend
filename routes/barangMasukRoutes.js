const express = require('express');

const barangMasukController = require('../controllers/barangMasukController');
const {
  authenticateToken,
  attachLocationScope,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);
router.use(attachLocationScope);

router.get('/', barangMasukController.getAllBarangMasuk);
router.get('/:id', barangMasukController.getBarangMasukById);
router.post('/', barangMasukController.createBarangMasuk);
router.put('/:id', barangMasukController.updateBarangMasuk);
router.delete('/:id', barangMasukController.deleteBarangMasuk);

module.exports = router;
