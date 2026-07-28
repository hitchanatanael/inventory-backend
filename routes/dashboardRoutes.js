const express = require('express');

const dashboardController = require('../controllers/dashboardController');
const {
  authenticateToken,
  attachLocationScope,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);
router.use(attachLocationScope);

router.get('/', dashboardController.getDashboardStatistics);

module.exports = router;
