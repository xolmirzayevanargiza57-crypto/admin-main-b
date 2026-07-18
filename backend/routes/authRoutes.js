// ============================================================
// AUTH ROUTES
// ============================================================

const express = require('express');
const router = express.Router();
const {
    login,
    changePassword,
    getProfile,
    updateProfile,
    getSubscriptionStatus
} = require('../controllers/authController');
const { authAdminMain } = require('../middleware/auth');

// Public
router.post('/login', login);

// Protected (Admin Main)
router.get('/profile', authAdminMain, getProfile);
router.get('/me', authAdminMain, getProfile);
router.put('/profile', authAdminMain, updateProfile);
router.post('/change-password', authAdminMain, changePassword);
router.get('/subscription-status', authAdminMain, getSubscriptionStatus);

module.exports = router;