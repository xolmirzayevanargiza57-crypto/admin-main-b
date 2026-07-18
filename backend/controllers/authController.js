// ============================================================
// AUTH CONTROLLER
// ============================================================

const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');
const { canAccessAccount } = require('../utils/accessControl');

// ============================================================
// LOGIN
// ============================================================
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email va parol majburiy!'
            });
        }

        const db = getDB();
        const user = await db.collection('admincustomers').findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email yoki parol noto\'g\'ri!'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email yoki parol noto\'g\'ri!'
            });
        }

        const now = new Date();
        if (!canAccessAccount(user, now)) {
            // Check if it's a "none" subscription
            const isNoSubscription = user.subscription && user.subscription.type === 'none';
            
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

            const message = isNoSubscription 
                ? 'Obunangiz tamimlangan! Yangi obuna sotib olish uchun +998 94 022 44 92 raqamiga murojaat qiling.'
                : 'Obunangiz yo\'q yoki muddati tugagan! Tizimga kirish taqiqlangan. Iltimos, +998 94 022 44 92 raqamiga murojaat qiling.';

            return res.status(403).json({
                success: false,
                message: message
            });
        }

        if (user.role !== 'admin_main') {
            return res.status(403).json({
                success: false,
                message: 'Bu tizim faqat Admin Main uchun!'
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        delete user.password;

        res.json({
            success: true,
            message: 'Muvaffaqiyatli kirdingiz!',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone || '',
                role: user.role,
                status: user.status,
                subscription: user.subscription
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server xatosi!',
            error: error.message
        });
    }
}

// ============================================================
// CHANGE PASSWORD
// ============================================================
async function changePassword(req, res) {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.userId;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Eski va yangi parol majburiy!'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Yangi parol kamida 6 ta belgi bo\'lishi kerak!'
            });
        }

        const db = getDB();
        const user = await db.collection('admincustomers').findOne({
            _id: new ObjectId(userId)
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi!'
            });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Eski parol noto\'g\'ri!'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.collection('admincustomers').updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    password: hashedPassword,
                    updatedAt: new Date()
                }
            }
        );

        res.json({
            success: true,
            message: 'Parol muvaffaqiyatli yangilandi!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server xatosi!',
            error: error.message
        });
    }
}

// ============================================================
// GET PROFILE
// ============================================================
async function getProfile(req, res) {
    try {
        const userId = req.userId;
        const db = getDB();
        const user = await db.collection('admincustomers').findOne({
            _id: new ObjectId(userId)
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi!'
            });
        }

        delete user.password;
        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server xatosi!',
            error: error.message
        });
    }
}

// ============================================================
// UPDATE PROFILE
// ============================================================
async function updateProfile(req, res) {
    try {
        const { fullName, email, phone } = req.body;
        const userId = req.userId;
        const db = getDB();

        const updateData = {
            fullName: fullName?.trim(),
            email: email?.toLowerCase().trim(),
            phone: phone || '',
            updatedAt: new Date()
        };

        if (email) {
            const existingUser = await db.collection('admincustomers').findOne({
                email: email.toLowerCase().trim(),
                _id: { $ne: new ObjectId(userId) }
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu email boshqa foydalanuvchi tomonidan ishlatilmoqda!'
                });
            }
        }

        await db.collection('admincustomers').updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateData }
        );

        const updatedUser = await db.collection('admincustomers').findOne({
            _id: new ObjectId(userId)
        });
        delete updatedUser.password;

        res.json({
            success: true,
            message: 'Profil muvaffaqiyatli yangilandi!',
            user: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server xatosi!',
            error: error.message
        });
    }
}

// ============================================================
// GET SUBSCRIPTION STATUS
// ============================================================
async function getSubscriptionStatus(req, res) {
    try {
        const userId = req.userId;
        const db = getDB();
        
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri foydalanuvchi ID!'
            });
        }
        
        const user = await db.collection('admincustomers').findOne({
            _id: new ObjectId(userId)
        });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi!'
            });
        }
        
        const now = new Date();
        const subscription = user.subscription || {};
        
        // If no active subscription
        if (!canAccessAccount(user, now)) {
            return res.json({
                success: true,
                data: {
                    isActive: false,
                    type: subscription.type || 'none',
                    status: 'inactive',
                    message: 'Obunaning muddasi tugagan yoki mavjud emas'
                }
            });
        }
        
        // Calculate countdown
        const endDate = new Date(subscription.endDate);
        const timeDiff = endDate - now;
        
        if (timeDiff <= 0) {
            // Expired - mark as inactive
            await db.collection('admincustomers').updateOne(
                { _id: new ObjectId(userId) },
                {
                    $set: {
                        status: 'inactive',
                        'subscription.status': 'inactive',
                        updatedAt: now
                    }
                }
            );
            
            return res.json({
                success: true,
                data: {
                    isActive: false,
                    type: subscription.type,
                    status: 'expired',
                    message: 'Obunaning muddasi tugagan! Iltimos, qaytadan to\'lov qiling.',
                    expiredAt: endDate
                }
            });
        }
        
        // Calculate days and seconds remaining
        const totalSeconds = Math.floor(timeDiff / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return res.json({
            success: true,
            data: {
                isActive: true,
                type: subscription.type,
                status: 'active',
                endDate: endDate,
                remainingTime: {
                    days,
                    hours,
                    minutes,
                    seconds,
                    totalSeconds
                },
                formattedTime: `${days}k ${hours}s ${minutes}m ${seconds}s`,
                message: `Obuna faol: ${days} kun qoldi`
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server xatosi!',
            error: error.message
        });
    }
}

module.exports = {
    login,
    changePassword,
    getProfile,
    updateProfile,
    getSubscriptionStatus
};