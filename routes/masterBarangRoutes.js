const express = require('express');

const masterBarangController = require('../controllers/masterBarangController');
const {
  authenticateToken,
  attachLocationScope,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);
router.use(attachLocationScope);

router.get('/', masterBarangController.getAllMasterBarang);
router.get('/:id', masterBarangController.getMasterBarangById);
router.post('/', masterBarangController.createMasterBarang);
router.put('/:id', masterBarangController.updateMasterBarang);
router.delete('/:id', masterBarangController.deleteMasterBarang);

module.exports = router;
