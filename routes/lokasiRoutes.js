const express = require('express');

const lokasiController = require('../controllers/lokasiController');
const {
  authenticateToken,
  attachLocationScope,
  requireRole,
} = require('../middleware/authMiddleware');
const { ROLE_SUPER_ADMIN } = require('../constants/roles');

const router = express.Router();

router.use(authenticateToken);
router.use(attachLocationScope);

router.get('/', lokasiController.getAllLokasi);
router.get('/dropdown', lokasiController.getDropdownLokasi);
router.get('/:id', lokasiController.getLokasiById);
router.post('/', requireRole(ROLE_SUPER_ADMIN), lokasiController.createLokasi);
router.put('/:id', requireRole(ROLE_SUPER_ADMIN), lokasiController.updateLokasi);
router.delete('/:id', requireRole(ROLE_SUPER_ADMIN), lokasiController.deleteLokasi);

module.exports = router;
