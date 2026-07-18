// ============================================================
// AUTH MIDDLEWARE
// ============================================================

const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { canAccessAccount } = require('../utils/accessControl');

// Umumiy auth
async function auth(req, res, next) {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token topilmadi!'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const db = getDB();
        const user = await db.collection('admincustomers').findOne({
            _id: new ObjectId(decoded.id)
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Foydalanuvchi topilmadi!'
            });
        }

        const now = new Date();

        if (user.status === 'blocked') {
            return res.status(403).json({
                success: false,
                message: 'Siz bloklangansiz!'
            });
        }

        if (!canAccessAccount(user, now)) {
            if (user.role === 'admin_customer') {
                await db.collection('admincustomers').updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            status: 'inactive',
                            'subscription.status': 'inactive',
                            updatedAt: now
                        }
                    }
                );

                return res.status(403).json({
                    success: false,
                    message: 'Obunangiz yo\'q yoki muddati tugagan! Tizimga kirish taqiqlangan. Iltimos, +998 94 022 44 92 raqamiga murojaat qiling.'
                });
            }
        }

        if (user.subscription?.status === 'active' && user.subscription.endDate && new Date(user.subscription.endDate) < now) {
            await db.collection('admincustomers').updateOne(
                { _id: user._id },
                { $set: { 'subscription.status': 'inactive', updatedAt: now } }
            );

            if (user.role === 'admin_customer') {
                return res.status(403).json({
                    success: false,
                    message: 'Premium obuna muddati tugadi. Iltimos, +998 94 022 44 92 raqamiga murojaat qiling.'
                });
            }

            user.subscription.status = 'inactive';
        }

        if (user.status === 'blocked') {
            return res.status(403).json({
                success: false,
                message: 'Siz bloklangansiz!'
            });
        }

        req.user = user;
        req.userId = decoded.id;
        req.role = user.role;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Noto\'g\'ri token!'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token muddati tugagan!'
            });
        }
        res.status(401).json({
            success: false,
            message: 'Autentifikatsiya xatosi!',
            error: error.message
        });
    }
}

// Admin Main middleware
async function authAdminMain(req, res, next) {
    await auth(req, res, () => {
        if (req.role !== 'admin_main') {
            return res.status(403).json({
                success: false,
                message: 'Ruxsat yo\'q! Faqat Admin Main'
            });
        }
        next();
    });
}

// Admin Customer middleware
async function authAdminCustomer(req, res, next) {
    await auth(req, res, () => {
        if (req.role !== 'admin_customer' && req.role !== 'admin_main') {
            return res.status(403).json({
                success: false,
                message: 'Ruxsat yo\'q! Faqat Admin Customer'
            });
        }
        next();
    });
}

module.exports = {
    auth,
    authAdminMain,
    authAdminCustomer
};