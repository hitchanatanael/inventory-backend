const express = require('express');

const lokasiController = require('../controllers/lokasiController');

const router = express.Router();

router.get('/', lokasiController.getAllLokasi);
router.get('/:id', lokasiController.getLokasiById);
router.post('/', lokasiController.createLokasi);
router.put('/:id', lokasiController.updateLokasi);
router.delete('/:id', lokasiController.deleteLokasi);

module.exports = router;
