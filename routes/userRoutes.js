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

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id/reset-password', userController.updateUserPassword);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.patch('/:id/status', userController.updateUserStatus);
router.patch('/:id/password', userController.updateUserPassword);
router.delete('/:id', userController.deleteUser);

module.exports = router;
