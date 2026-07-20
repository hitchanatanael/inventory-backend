const express = require('express');

const barangMasukController = require('../controllers/barangMasukController');

const router = express.Router();

router.get('/', barangMasukController.getAllBarangMasuk);
router.get('/:id', barangMasukController.getBarangMasukById);
router.post('/', barangMasukController.createBarangMasuk);
router.put('/:id', barangMasukController.updateBarangMasuk);
router.delete('/:id', barangMasukController.deleteBarangMasuk);

module.exports = router;
