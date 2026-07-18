// ============================================================
// ADMIN ROUTES
// ============================================================

const express = require('express');
const router = express.Router();
const {
    getAllAdmins,
    getAdminById,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    updateSubscription
} = require('../controllers/adminController');
const { authAdminMain } = require('../middleware/auth');

// Barcha route'lar Admin Main uchun
router.use(authAdminMain);

router.get('/', getAllAdmins);
router.get('/:id', getAdminById);
router.post('/', createAdmin);
router.put('/:id', updateAdmin);
router.put('/:id/subscription', updateSubscription);
router.delete('/:id', deleteAdmin);

module.exports = router;