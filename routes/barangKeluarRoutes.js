const express = require('express');

const barangKeluarController = require('../controllers/barangKeluarController');

const router = express.Router();

router.get('/', barangKeluarController.getAllBarangKeluar);
router.get('/:id', barangKeluarController.getBarangKeluarById);
router.post('/', barangKeluarController.createBarangKeluar);
router.put('/:id', barangKeluarController.updateBarangKeluar);
router.delete('/:id', barangKeluarController.deleteBarangKeluar);

module.exports = router;
