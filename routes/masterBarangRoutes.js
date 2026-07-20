const express = require('express');

const masterBarangController = require('../controllers/masterBarangController');

const router = express.Router();

router.get('/', masterBarangController.getAllMasterBarang);
router.get('/:id', masterBarangController.getMasterBarangById);
router.post('/', masterBarangController.createMasterBarang);
router.put('/:id', masterBarangController.updateMasterBarang);
router.delete('/:id', masterBarangController.deleteMasterBarang);

module.exports = router;
