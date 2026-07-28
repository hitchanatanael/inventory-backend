const express = require('express');

const masterAnggotaController = require('../controllers/masterAnggotaController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', masterAnggotaController.getAllMasterAnggota);
router.get('/:id', masterAnggotaController.getMasterAnggotaById);
router.post('/', masterAnggotaController.createMasterAnggota);
router.put('/:id', masterAnggotaController.updateMasterAnggota);
router.delete('/:id', masterAnggotaController.deleteMasterAnggota);

module.exports = router;
