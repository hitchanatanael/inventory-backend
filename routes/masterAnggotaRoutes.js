const express = require('express');

const masterAnggotaController = require('../controllers/masterAnggotaController');

const router = express.Router();

router.get('/', masterAnggotaController.getAllMasterAnggota);
router.get('/:id', masterAnggotaController.getMasterAnggotaById);
router.post('/', masterAnggotaController.createMasterAnggota);
router.put('/:id', masterAnggotaController.updateMasterAnggota);
router.delete('/:id', masterAnggotaController.deleteMasterAnggota);

module.exports = router;
