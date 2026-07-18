// ============================================================
// STATISTICS ROUTES
// ============================================================

const express = require('express');
const router = express.Router();
const { getStatistics } = require('../controllers/statisticsController');
const { authAdminMain } = require('../middleware/auth');

router.get('/', authAdminMain, getStatistics);

module.exports = router;