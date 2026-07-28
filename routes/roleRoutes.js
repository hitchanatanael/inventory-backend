const express = require('express');

const { ROLE_SUPER_ADMIN } = require('../constants/roles');
const userController = require('../controllers/userController');
const {
  authenticateToken,
  requireRole,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(ROLE_SUPER_ADMIN));

router.get('/dropdown', userController.getRoleDropdown);

module.exports = router;
