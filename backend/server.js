// ============================================================
// SERVER - ADMIN MAIN (TO'LIQ)
// ============================================================

// ✅ VAQT ZONASI - TOSHKENT (UTC+5)
process.env.TZ = 'Asia/Tashkent';

console.log('🕐 Server vaqt zonasi o\'rnatildi:', process.env.TZ);
console.log('🕐 Hozirgi vaqt:', new Date().toLocaleString('uz-UZ'));

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');

// ✅ dotenv config
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ MongoDB URI ni tekshirish
if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI topilmadi! .env faylini tekshiring.');
    process.exit(1);
}

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(compression());

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 1000,
    message: {
        success: false,
        message: 'Juda ko\'p so\'rov! Iltimos, birozdan keyin urinib ko\'ring.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

app.use(cors({
    origin: [
        'https://admin-main-bxojiakbar.vercel.app',
        'https://admin-main-b.vercel.app',
        'http://localhost:3000',
        'http://localhost:5000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// MONGODB ULANISH
// ============================================================

let client = null;
let db = null;

async function connectDB() {
    if (db) return db;

    console.log('\n🔄 MongoDB Atlas ga ulanish...');

    try {
        const uri = process.env.MONGODB_URI;
        const dbName = process.env.DB_NAME || 'Eduadmin';

        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            maxPoolSize: 10,
            minPoolSize: 2,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 60000
        });

        await client.connect();
        console.log('✅ MongoDB Atlas ga ulandi!');
        
        db = client.db(dbName);
        console.log(`📊 Database: ${dbName}`);
        
        return db;
    } catch (error) {
        console.error('❌ Ulanish xatosi:', error.message);
        throw error;
    }
}

function getDB() {
    if (!db) throw new Error('Database ulanmagan!');
    return db;
}

async function closeDB() {
    if (client) {
        await client.close();
        console.log('🔒 MongoDB ulanish yopildi');
    }
}

// ============================================================
// INDEXES
// ============================================================

async function createIndexes() {
    try {
        const db = getDB();
        await db.collection('admincustomers').createIndex({ email: 1 }, { unique: true });
        await db.collection('admincustomers').createIndex({ role: 1 });
        await db.collection('admincustomers').createIndex({ 'subscription.status': 1 });
        await db.collection('admincustomers').createIndex({ 'subscription.endDate': 1 });
        await db.collection('admincustomers').createIndex({ status: 1 });
        await db.collection('notifications').createIndex({ recipientId: 1 });
        await db.collection('notifications').createIndex({ createdAt: -1 });
        await db.collection('notifications').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        console.log('✅ Indexes yaratildi');
    } catch (error) {
        console.log('⚠️ Indexes:', error.message);
    }
}

async function ensureAdminMainExists() {
    try {
        const db = getDB();
        const collection = db.collection('admincustomers');
        
        // ✅ Admin Main ni yaratish
        const admin = await collection.findOne({ email: 'admin@example.com' });
        
        if (!admin) {
            const hashedPassword = await bcrypt.hash('123456', 10);
            await collection.insertOne({
                fullName: 'Admin Main',
                email: 'admin@example.com',
                password: hashedPassword,
                phone: '+998901234567',
                role: 'admin_main',
                subscription: {
                    type: 'none',
                    status: 'inactive',
                    startDate: null,
                    endDate: null,
                    amount: 0
                },
                paymentHistory: [],
                teachers: [],
                status: 'active',
                createdBy: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                banReason: null,
                bannedAt: null
            });
            console.log('✅ Admin Main yaratildi: admin@example.com / 123456');
        } else if (admin.role !== 'admin_main') {
            await collection.updateOne(
                { email: 'admin@example.com' },
                { $set: { role: 'admin_main' } }
            );
            console.log('✅ Admin Main roli tuzatildi!');
        } else {
            console.log('✅ Admin Main mavjud: admin@example.com');
        }
        
        // ✅ Barcha boshqa adminlarni admin_customer qilib tuzatish
        const result = await collection.updateMany(
            { 
                role: { $nin: ['admin_main', 'admin_customer'] },
                email: { $ne: 'admin@example.com' }
            },
            { $set: { role: 'admin_customer' } }
        );
        if (result.modifiedCount > 0) {
            console.log(`✅ ${result.modifiedCount} ta admin roli admin_customer qilib tuzatildi`);
        }
        
    } catch (error) {
        console.log('⚠️ Admin:', error.message);
    }
}

// ============================================================
// SUBSCRIPTION CHECKER
// ============================================================

let checkerInterval = null;

function startSubscriptionChecker() {
    if (checkerInterval) {
        console.log('Subscription checker already running');
        return;
    }
    
    checkerInterval = setInterval(async () => {
        try {
            await checkExpiredSubscriptions();
        } catch (error) {
            console.error('Subscription checker error:', error);
        }
    }, 3000);
    
    console.log('✅ Subscription checker started (every 3 seconds)');
}

function stopSubscriptionChecker() {
    if (checkerInterval) {
        clearInterval(checkerInterval);
        checkerInterval = null;
        console.log('❌ Subscription checker stopped');
    }
}

async function checkExpiredSubscriptions() {
    try {
        const db = getDB();
        const now = new Date();
        
        const expiredAdmins = await db.collection('admincustomers')
            .find({
                role: 'admin_customer',
                status: 'active',
                'subscription.status': 'active',
                'subscription.endDate': { $lt: now },
                'subscription.type': { $ne: 'none' }
            })
            .toArray();
        
        if (expiredAdmins.length > 0) {
            const adminIds = expiredAdmins.map(a => a._id);
            
            await db.collection('admincustomers').updateMany(
                { _id: { $in: adminIds } },
                {
                    $set: {
                        status: 'inactive',
                        'subscription.status': 'inactive',
                        updatedAt: now
                    }
                }
            );
            
            console.log(`⏱️ ${expiredAdmins.length} ta obuna muddati tugagan deb belgilandi va bloklandi!`);
        }
        
        const noSubscriptionAdmins = await db.collection('admincustomers')
            .find({
                role: 'admin_customer',
                status: 'active',
                'subscription.type': 'none'
            })
            .toArray();
        
        if (noSubscriptionAdmins.length > 0) {
            const ids = noSubscriptionAdmins.map(a => a._id);
            await db.collection('admincustomers').updateMany(
                { _id: { $in: ids } },
                {
                    $set: {
                        status: 'inactive',
                        'subscription.status': 'inactive',
                        updatedAt: now
                    }
                }
            );
        }
    } catch (error) {
        console.error('Error checking expired subscriptions:', error);
    }
}

// ============================================================
// ACCESS CONTROL
// ============================================================

function isSubscriptionActive(subscription = {}, now = new Date()) {
    if (!subscription) return false;
    if (subscription.type === 'none') return false;
    if (subscription.status !== 'active') return false;
    if (!subscription.endDate) return true;
    return new Date(subscription.endDate) >= now;
}

function canAccessAccount(user, now = new Date()) {
    if (!user) return false;
    if (user.status === 'blocked') return false;
    if (user.status !== 'active') return false;
    if (user.role === 'admin_main') return true;
    return isSubscriptionActive(user.subscription || {}, now);
}

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

async function auth(req, res, next) {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token topilmadi! Iltimos tizimga kiring.'
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

        if (user.status === 'blocked') {
            const banReason = user.banReason || 'Noma\'lum sabab';
            const bannedAt = user.bannedAt ? new Date(user.bannedAt).toLocaleString('uz-UZ') : 'Noma\'lum vaqt';
            
            return res.status(403).json({
                success: false,
                message: `⛔ Siz bloklangansiz!\n📌 Sabab: ${banReason}\n📅 Bloklangan vaqt: ${bannedAt}\n📞 Yordam uchun: +998 94 022 44 92`,
                blockReason: banReason,
                blockedAt: bannedAt,
                phone: '+998 94 022 44 92',
                action: 'contact_support'
            });
        }

        const now = new Date();
        const canAccess = canAccessAccount(user, now);

        if (!canAccess && user.role !== 'admin_main') {
            const subscription = user.subscription || {};
            const isExpired = subscription.endDate && new Date(subscription.endDate) < now;
            const isNoSubscription = subscription.type === 'none' || !subscription.type;

            let message = '';
            let alertType = '';

            if (isNoSubscription) {
                message = '⚠️ Sizning obunangiz mavjud emas! Iltimos, obuna sotib olish uchun +998 94 022 44 92 raqamiga murojaat qiling.';
                alertType = 'no_subscription';
            } else if (isExpired) {
                message = '⚠️ Sizning premium obunangiz muddati tugagan! Yangilash uchun +998 94 022 44 92 raqamiga murojaat qiling.';
                alertType = 'expired';
            } else {
                message = '⚠️ Obunangiz faol emas! Iltimos, +998 94 022 44 92 raqamiga murojaat qiling.';
                alertType = 'inactive';
            }

            await db.collection('admincustomers').updateOne(
                { _id: user._id },
                {
                    $set: {
                        status: 'inactive',
                        'subscription.status': 'inactive',
                        updatedAt: now,
                        lastAlert: {
                            message: message,
                            type: alertType,
                            sentAt: now
                        }
                    }
                }
            );

            return res.status(403).json({
                success: false,
                message: message,
                alertType: alertType,
                phone: '+998 94 022 44 92',
                action: 'contact_support'
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
                message: 'Token muddati tugagan! Qayta kiring.'
            });
        }
        res.status(401).json({
            success: false,
            message: 'Autentifikatsiya xatosi!',
            error: error.message
        });
    }
}

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

// ============================================================
// VAQTNI FORMATLASH FUNKSIYALARI
// ============================================================

function calculateEndDate(startDate, customDuration, subscriptionType) {
    const start = new Date(startDate);
    const end = new Date(start);
    
    if (customDuration) {
        if (customDuration.days) end.setDate(end.getDate() + customDuration.days);
        if (customDuration.hours) end.setHours(end.getHours() + customDuration.hours);
        if (customDuration.minutes) end.setMinutes(end.getMinutes() + customDuration.minutes);
        if (customDuration.seconds) end.setSeconds(end.getSeconds() + customDuration.seconds);
    } else {
        const durationMap = {
            'monthly': 30,
            '6months': 180,
            'yearly': 365
        };
        const days = durationMap[subscriptionType] || 0;
        if (days) end.setDate(end.getDate() + days);
    }
    
    return end;
}

// ============================================================
// BUILD SUBSCRIPTION PAYLOAD
// ============================================================

function buildSubscriptionPayload({ 
    subscriptionType, 
    startDate, 
    endDate, 
    customDuration,
    purchasedBy, 
    now, 
    existingSubscription = null,
    amount = 0,
    note = ''
}) {
    const normalizedType = subscriptionType || 'none';
    let start = startDate ? new Date(startDate) : now;
    let end = endDate ? new Date(endDate) : null;
    
    if (customDuration && !end) {
        end = calculateEndDate(start, customDuration, normalizedType);
    }
    
    if (!end && normalizedType !== 'none') {
        end = calculateEndDate(start, null, normalizedType);
    }
    
    let price = amount;
    if (!price || price === 0) {
        if (normalizedType === 'monthly') price = 299999;
        else if (normalizedType === '6months') price = 1899999;
        else if (normalizedType === 'yearly') price = 3599999;
        else if (normalizedType === 'custom') price = 1000;
    }
    
    const paymentHistory = Array.isArray(existingSubscription?.paymentHistory) 
        ? [...existingSubscription.paymentHistory] 
        : [];
    
    if (existingSubscription && existingSubscription.type !== 'none' && existingSubscription.status === 'active') {
        paymentHistory.push({
            type: existingSubscription.type,
            startDate: existingSubscription.startDate ? new Date(existingSubscription.startDate) : null,
            endDate: existingSubscription.endDate ? new Date(existingSubscription.endDate) : null,
            status: existingSubscription.status || 'inactive',
            amount: existingSubscription.amount || 0,
            purchaseDate: existingSubscription.purchaseDate ? new Date(existingSubscription.purchaseDate) : null,
            note: existingSubscription.note || ''
        });
    }
    
    const paymentRecord = {
        type: normalizedType,
        startDate: normalizedType !== 'none' ? start : null,
        endDate: normalizedType !== 'none' ? end : null,
        status: normalizedType !== 'none' ? 'active' : 'inactive',
        amount: price,
        purchasedBy: purchasedBy,
        purchaseDate: normalizedType !== 'none' ? now : null,
        note: note || ''
    };
    
    paymentHistory.push(paymentRecord);

    return {
        type: normalizedType,
        startDate: normalizedType !== 'none' ? start : null,
        endDate: normalizedType !== 'none' ? end : null,
        status: normalizedType !== 'none' ? 'active' : 'inactive',
        amount: price,
        purchasedBy: purchasedBy,
        purchaseDate: normalizedType !== 'none' ? now : null,
        note: note || '',
        paymentHistory: paymentHistory.slice(-20)
    };
}

// ============================================================
// AUTH ROUTES
// ============================================================

// --- LOGIN ---
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('📡 Login so\'rovi keldi:', req.body.email);

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
            console.log('❌ User topilmadi:', email);
            return res.status(401).json({
                success: false,
                message: 'Email yoki parol noto\'g\'ri!'
            });
        }

        console.log('👤 User topildi:', user.email);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('❌ Parol noto\'g\'ri');
            return res.status(401).json({
                success: false,
                message: 'Email yoki parol noto\'g\'ri!'
            });
        }

        console.log('✅ Parol to\'g\'ri');

        if (user.status === 'blocked') {
            const banReason = user.banReason || 'Noma\'lum sabab';
            const bannedAt = user.bannedAt ? new Date(user.bannedAt).toLocaleString('uz-UZ') : 'Noma\'lum vaqt';
            
            console.log('⛔ Bloklangan user kirishga urindi:', user.email);
            
            return res.status(403).json({
                success: false,
                message: `⛔ Siz bloklangansiz!\n📌 Sabab: ${banReason}\n📅 Bloklangan vaqt: ${bannedAt}\n📞 Yordam uchun: +998 94 022 44 92`,
                blockReason: banReason,
                blockedAt: bannedAt,
                phone: '+998 94 022 44 92',
                action: 'contact_support'
            });
        }

        const now = new Date();
        const canAccess = canAccessAccount(user, now);

        if (!canAccess && user.role !== 'admin_main') {
            const subscription = user.subscription || {};
            const isExpired = subscription.endDate && new Date(subscription.endDate) < now;
            const isNoSubscription = subscription.type === 'none' || !subscription.type;

            let message = '';
            let alertType = '';

            if (isNoSubscription) {
                message = '⚠️ Sizning obunangiz mavjud emas! Iltimos, obuna sotib olish uchun +998 94 022 44 92 raqamiga murojaat qiling.';
                alertType = 'no_subscription';
            } else if (isExpired) {
                message = '⚠️ Sizning premium obunangiz muddati tugagan! Yangilash uchun +998 94 022 44 92 raqamiga murojaat qiling.';
                alertType = 'expired';
            } else {
                message = '⚠️ Obunangiz faol emas! Iltimos, +998 94 022 44 92 raqamiga murojaat qiling.';
                alertType = 'inactive';
            }

            await db.collection('admincustomers').updateOne(
                { _id: user._id },
                {
                    $set: {
                        status: 'inactive',
                        'subscription.status': 'inactive',
                        updatedAt: now,
                        lastAlert: {
                            message: message,
                            type: alertType,
                            sentAt: now
                        }
                    }
                }
            );

            return res.status(403).json({
                success: false,
                message: message,
                alertType: alertType,
                phone: '+998 94 022 44 92',
                action: 'contact_support'
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
            { expiresIn: '30d' }
        );

        console.log('🔑 Token yaratildi');

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
        console.error('❌ Login xatosi:', error);
        res.status(500).json({
            success: false,
            message: 'Server xatosi!',
            error: error.message
        });
    }
});

// --- GET PROFILE ---
app.get('/api/auth/profile', authAdminMain, async (req, res) => {
    try {
        const db = getDB();
        const user = await db.collection('admincustomers').findOne({
            _id: new ObjectId(req.userId)
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
            message: 'Server xatosi!'
        });
    }
});

// --- CHANGE PASSWORD ---
app.post('/api/auth/change-password', authAdminMain, async (req, res) => {
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
});

// --- UPDATE PROFILE ---
app.put('/api/auth/profile', authAdminMain, async (req, res) => {
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
});

// --- SUBSCRIPTION STATUS ---
app.get('/api/auth/subscription-status', auth, async (req, res) => {
    try {
        const db = getDB();
        const user = await db.collection('admincustomers').findOne({
            _id: new ObjectId(req.userId)
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Foydalanuvchi topilmadi!'
            });
        }

        const now = new Date();
        const subscription = user.subscription || {};

        if (user.role === 'admin_main') {
            return res.json({
                success: true,
                data: {
                    isActive: true,
                    type: 'none',
                    status: 'active',
                    message: 'Siz Admin Main sifatida to\'liq kirish huquqiga egasiz.'
                }
            });
        }

        if (!canAccessAccount(user, now)) {
            const isExpired = subscription.endDate && new Date(subscription.endDate) < now;
            const isNoSubscription = subscription.type === 'none' || !subscription.type;
            
            let message = '';
            if (isNoSubscription) {
                message = 'Obunangiz mavjud emas. Iltimos, +998 94 022 44 92 raqamiga murojaat qiling.';
            } else if (isExpired) {
                message = 'Obuna muddati tugagan. Yangilash uchun +998 94 022 44 92 raqamiga murojaat qiling.';
            } else {
                message = 'Obuna faol emas. Iltimos, +998 94 022 44 92 raqamiga murojaat qiling.';
            }
            
            return res.json({
                success: true,
                data: {
                    isActive: false,
                    type: subscription.type || 'none',
                    status: 'inactive',
                    message: message,
                    phone: '+998 94 022 44 92',
                    action: 'contact_support'
                }
            });
        }

        const endDate = new Date(subscription.endDate);
        const timeDiff = endDate - now;
        const totalSeconds = Math.max(0, Math.floor(timeDiff / 1000));
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        res.json({
            success: true,
            data: {
                isActive: true,
                type: subscription.type,
                status: 'active',
                endDate: endDate.toISOString(),
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
});

// ============================================================
// ADMIN CUSTOMER ROUTES
// ============================================================

// --- GET ALL ADMINS ---
app.get('/api/admins', authAdminMain, async (req, res) => {
    try {
        const { search, status, subscription, limit } = req.query;
        const db = getDB();

        const query = { role: 'admin_customer' };
        if (status && status !== 'all') query.status = status;
        
        if (subscription) {
            if (subscription === 'active') {
                query['subscription.type'] = { $ne: 'none' };
                query['subscription.status'] = 'active';
                query.status = 'active';
            } else if (subscription === 'inactive') {
                query['subscription.type'] = { $ne: 'none' };
                query['subscription.status'] = 'inactive';
            } else if (subscription === 'none') {
                query['subscription.type'] = 'none';
            } else if (subscription === 'monthly') {
                query['subscription.type'] = 'monthly';
                query['subscription.status'] = 'active';
            } else if (subscription === '6months') {
                query['subscription.type'] = '6months';
                query['subscription.status'] = 'active';
            } else if (subscription === 'yearly') {
                query['subscription.type'] = 'yearly';
                query['subscription.status'] = 'active';
            }
        }
        
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        let queryObj = db.collection('admincustomers')
            .find(query)
            .sort({ createdAt: -1 });
        
        const limitValue = parseInt(limit) || 100;
        if (limitValue) {
            queryObj = queryObj.limit(limitValue);
        }
        
        const admins = await queryObj.toArray();
        admins.forEach(a => delete a.password);
        
        const totalCount = await db.collection('admincustomers').countDocuments(query);
        
        res.json({ 
            success: true, 
            count: admins.length,
            total: totalCount,
            data: admins 
        });
    } catch (error) {
        console.error('Get admins error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi!' });
    }
});

// --- GET ADMIN BY ID ---
app.get('/api/admins/:id', authAdminMain, async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri ID format!"
            });
        }

        const admin = await db.collection('admincustomers').findOne({ 
            _id: new ObjectId(id),
            role: 'admin_customer'
        });
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin Customer topilmadi!'
            });
        }

        delete admin.password;
        res.json({ success: true, data: admin });
    } catch (error) {
        console.error('Get admin by ID error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi!' });
    }
});

// --- CREATE ADMIN ---
app.post('/api/admins', authAdminMain, async (req, res) => {
    try {
        const { fullName, email, password, phone, subscriptionType, startDate, endDate, customDuration, amount } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'F.I.SH, Email va Parol majburiy!'
            });
        }

        const db = getDB();
        
        const existingAdmin = await db.collection('admincustomers').findOne({
            email: email.toLowerCase().trim()
        });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Bu email allaqachon ro\'yxatdan o\'tgan!'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const now = new Date();
        
        let start = startDate ? new Date(startDate) : now;
        let end = endDate ? new Date(endDate) : null;
        
        if (customDuration) {
            end = calculateEndDate(start, customDuration, 'custom');
        }
        
        if (!end && subscriptionType !== 'none') {
            end = calculateEndDate(start, null, subscriptionType);
        }
        
        let price = amount || 0;
        if (!price || price === 0) {
            if (subscriptionType === 'monthly') price = 299999;
            else if (subscriptionType === '6months') price = 1899999;
            else if (subscriptionType === 'yearly') price = 3599999;
            else if (subscriptionType === 'custom') price = 1000;
        }
        
        const subscription = {
            type: subscriptionType || 'none',
            startDate: subscriptionType !== 'none' ? start : null,
            endDate: subscriptionType !== 'none' ? end : null,
            status: subscriptionType !== 'none' ? 'active' : 'inactive',
            amount: price,
            purchasedBy: new ObjectId(req.userId),
            purchaseDate: subscriptionType !== 'none' ? now : null,
            note: 'Admin tomonidan yaratilgan'
        };
        
        const admin = {
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone: phone || '',
            role: 'admin_customer',
            subscription: subscription,
            paymentHistory: subscriptionType !== 'none' ? [{
                type: subscriptionType,
                startDate: start,
                endDate: end,
                status: 'active',
                amount: price,
                purchaseDate: now,
                note: 'Admin tomonidan yaratilgan'
            }] : [],
            teachers: [],
            status: subscriptionType !== 'none' ? 'active' : 'inactive',
            createdBy: new ObjectId(req.userId),
            createdAt: now,
            updatedAt: now,
            banReason: null,
            bannedAt: null
        };
        
        const result = await db.collection('admincustomers').insertOne(admin);
        delete admin.password;

        res.status(201).json({
            success: true,
            message: 'Admin Customer muvaffaqiyatli yaratildi!',
            data: { ...admin, _id: result.insertedId }
        });
    } catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi!' });
    }
});

// --- UPDATE ADMIN (PAROL BILAN) ---
app.put('/api/admins/:id', authAdminMain, async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, phone, status, password, subscription } = req.body;
        const db = getDB();

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri ID format!'
            });
        }

        const admin = await db.collection('admincustomers').findOne({
            _id: new ObjectId(id),
            role: 'admin_customer'
        });
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin Customer topilmadi!'
            });
        }

        const updateData = { updatedAt: new Date() };
        if (fullName) updateData.fullName = fullName.trim();
        if (email) {
            const existingAdmin = await db.collection('admincustomers').findOne({
                email: email.toLowerCase().trim(),
                _id: { $ne: new ObjectId(id) }
            });
            if (existingAdmin) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu email boshqa admin tomonidan ishlatilmoqda!'
                });
            }
            updateData.email = email.toLowerCase().trim();
        }
        if (phone) updateData.phone = phone;
        if (status) updateData.status = status;
        
        if (password && password.length >= 6) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        } else if (password && password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Yangi parol kamida 6 ta belgi bo\'lishi kerak!'
            });
        }

        if (subscription) {
            updateData.subscription = subscription;
        }

        await db.collection('admincustomers').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        const updatedAdmin = await db.collection('admincustomers').findOne({
            _id: new ObjectId(id)
        });
        delete updatedAdmin.password;

        res.json({
            success: true,
            message: 'Admin Customer yangilandi!',
            data: updatedAdmin
        });
    } catch (error) {
        console.error('Update admin error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi!' });
    }
});

// --- BAN ADMIN ---
app.post('/api/admins/:id/ban', authAdminMain, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason = 'Admin panelda cheklov qo\'llandi' } = req.body;
        const db = getDB();

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri ID format!'
            });
        }

        const admin = await db.collection('admincustomers').findOne({ 
            _id: new ObjectId(id), 
            role: 'admin_customer' 
        });
        if (!admin) {
            return res.status(404).json({ 
                success: false, 
                message: 'Admin Customer topilmadi!' 
            });
        }

        const now = new Date();
        await db.collection('admincustomers').updateOne(
            { _id: admin._id },
            {
                $set: {
                    status: 'blocked',
                    'subscription.status': 'inactive',
                    banReason: reason.trim(),
                    bannedAt: now,
                    updatedAt: now
                }
            }
        );

        res.json({ 
            success: true, 
            message: `✅ Admin Customer bloklandi!\n📌 Sabab: ${reason}` 
        });
    } catch (error) {
        console.error('Ban admin error:', error);
        res.status(500).json({ success: false, message: 'Bloklashda xatolik!' });
    }
});

// --- UNBAN ADMIN ---
app.post('/api/admins/:id/unban', authAdminMain, async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri ID format!'
            });
        }

        const admin = await db.collection('admincustomers').findOne({ 
            _id: new ObjectId(id), 
            role: 'admin_customer' 
        });
        if (!admin) {
            return res.status(404).json({ 
                success: false, 
                message: 'Admin Customer topilmadi!' 
            });
        }

        await db.collection('admincustomers').updateOne(
            { _id: admin._id },
            {
                $set: {
                    status: 'inactive',
                    banReason: null,
                    bannedAt: null,
                    updatedAt: new Date()
                }
            }
        );

        res.json({ 
            success: true, 
            message: '✅ Admin Customer blokdan chiqarildi!' 
        });
    } catch (error) {
        console.error('Unban admin error:', error);
        res.status(500).json({ success: false, message: 'Blokdan chiqarishda xatolik!' });
    }
});

// --- TO'LOV QO'SHISH ---
app.post('/api/admins/:id/payment', authAdminMain, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            amount, 
            subscriptionType, 
            customDuration,
            endDate,
            startDate,
            note
        } = req.body;
        
        const db = getDB();

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri ID format!"
            });
        }

        const admin = await db.collection('admincustomers').findOne({
            _id: new ObjectId(id),
            role: 'admin_customer'
        });
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin Customer topilmadi!'
            });
        }

        const now = new Date();
        const start = startDate ? new Date(startDate) : now;
        let end = null;
        
        if (customDuration) {
            end = calculateEndDate(start, customDuration, 'custom');
        } else if (endDate) {
            end = new Date(endDate);
        } else {
            end = calculateEndDate(start, null, subscriptionType);
        }

        let price = amount || 0;
        if (!price || price === 0) {
            if (subscriptionType === 'monthly') price = 299999;
            else if (subscriptionType === '6months') price = 1899999;
            else if (subscriptionType === 'yearly') price = 3599999;
            else price = 1000;
        }

        const paymentHistory = admin.paymentHistory || [];
        
        if (admin.subscription && admin.subscription.type !== 'none' && admin.subscription.status === 'active') {
            paymentHistory.push({
                type: admin.subscription.type,
                startDate: admin.subscription.startDate ? new Date(admin.subscription.startDate) : null,
                endDate: admin.subscription.endDate ? new Date(admin.subscription.endDate) : null,
                status: 'inactive',
                amount: admin.subscription.amount || 0,
                purchaseDate: admin.subscription.purchaseDate ? new Date(admin.subscription.purchaseDate) : null,
                note: 'Avvalgi obuna tugatildi'
            });
        }

        const paymentRecord = {
            type: subscriptionType || 'custom',
            startDate: start,
            endDate: end,
            status: 'active',
            amount: price,
            purchaseDate: now,
            note: note || 'Admin tomonidan qo\'shildi'
        };
        
        paymentHistory.push(paymentRecord);

        const subscription = {
            type: subscriptionType || 'custom',
            startDate: start,
            endDate: end,
            status: 'active',
            amount: price,
            purchasedBy: new ObjectId(req.userId),
            purchaseDate: now,
            note: note || 'Admin tomonidan qo\'shildi'
        };

        await db.collection('admincustomers').updateOne(
            { _id: new ObjectId(id) },
            { 
                $set: { 
                    subscription: subscription,
                    status: 'active',
                    paymentHistory: paymentHistory.slice(-50),
                    updatedAt: now 
                } 
            }
        );

        const updatedAdmin = await db.collection('admincustomers').findOne({
            _id: new ObjectId(id)
        });
        delete updatedAdmin.password;

        res.json({
            success: true,
            message: '✅ To\'lov muvaffaqiyatli qo\'shildi!',
            data: {
                subscription: {
                    ...subscription,
                    startDate: subscription.startDate ? subscription.startDate.toISOString() : null,
                    endDate: subscription.endDate ? subscription.endDate.toISOString() : null
                },
                paymentHistory: paymentHistory.slice(-10)
            }
        });
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server xatosi!',
            error: error.message 
        });
    }
});

// --- UPDATE SUBSCRIPTION ---
app.put('/api/admins/:id/subscription', authAdminMain, async (req, res) => {
    try {
        const { id } = req.params;
        const { subscriptionType, customDuration, endDate } = req.body;
        const db = getDB();

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri ID format!'
            });
        }

        const admin = await db.collection('admincustomers').findOne({
            _id: new ObjectId(id),
            role: 'admin_customer'
        });
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin Customer topilmadi!'
            });
        }

        const now = new Date();
        const start = now;
        let end = null;
        
        if (customDuration) {
            end = calculateEndDate(start, customDuration, 'custom');
        } else if (endDate) {
            end = new Date(endDate);
        } else if (subscriptionType !== 'none') {
            end = calculateEndDate(start, null, subscriptionType);
        }

        const paymentHistory = admin.paymentHistory || [];
        if (admin.subscription && admin.subscription.type !== 'none' && admin.subscription.status === 'active') {
            paymentHistory.push({
                type: admin.subscription.type,
                startDate: admin.subscription.startDate ? new Date(admin.subscription.startDate) : null,
                endDate: admin.subscription.endDate ? new Date(admin.subscription.endDate) : null,
                status: 'inactive',
                amount: admin.subscription.amount || 0,
                purchaseDate: admin.subscription.purchaseDate ? new Date(admin.subscription.purchaseDate) : null,
                note: 'Avvalgi obuna tugatildi'
            });
        }

        const amount = subscriptionType === 'monthly' ? 299999 : 
                       subscriptionType === '6months' ? 1899999 :
                       subscriptionType === 'yearly' ? 3599999 : 0;

        const subscription = {
            type: subscriptionType,
            startDate: subscriptionType !== 'none' ? start : null,
            endDate: subscriptionType !== 'none' ? end : null,
            status: subscriptionType !== 'none' ? 'active' : 'inactive',
            amount: amount,
            purchasedBy: new ObjectId(req.userId),
            purchaseDate: subscriptionType !== 'none' ? now : null,
            note: 'Admin tomonidan yangilandi'
        };

        if (subscriptionType !== 'none' && end) {
            paymentHistory.push({
                type: subscriptionType,
                startDate: start,
                endDate: end,
                status: 'active',
                amount: amount,
                purchaseDate: now,
                note: 'Admin tomonidan yangilandi'
            });
        }

        await db.collection('admincustomers').updateOne(
            { _id: new ObjectId(id) },
            { 
                $set: { 
                    subscription: subscription,
                    status: subscriptionType !== 'none' ? 'active' : 'inactive',
                    paymentHistory: paymentHistory.slice(-50),
                    updatedAt: now 
                } 
            }
        );

        const updatedAdmin = await db.collection('admincustomers').findOne({
            _id: new ObjectId(id)
        });
        delete updatedAdmin.password;

        res.json({
            success: true,
            message: 'Obuna muvaffaqiyatli yangilandi!',
            data: updatedAdmin
        });
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi!' });
    }
});

// --- DELETE ADMIN ---
app.delete('/api/admins/:id', authAdminMain, async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Noto\'g\'ri ID format!'
            });
        }

        const admin = await db.collection('admincustomers').findOne({
            _id: new ObjectId(id),
            role: 'admin_customer'
        });
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin Customer topilmadi!'
            });
        }

        await db.collection('admincustomers').deleteOne({
            _id: new ObjectId(id)
        });

        res.json({
            success: true,
            message: 'Admin Customer muvaffaqiyatli o\'chirildi!'
        });
    } catch (error) {
        console.error('Delete admin error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi!' });
    }
});

// ============================================================
// STATISTICS ROUTE - ✅ QO'SHILDI!
// ============================================================

app.get('/api/statistics', authAdminMain, async (req, res) => {
    try {
        console.log('📊 Statistika so\'rovi keldi');
        
        const db = getDB();
        const now = new Date();
        
        // Muddati tugagan obunalarni tekshirish
        await checkExpiredSubscriptions();
        
        // Jami admin_customer lar
        const total = await db.collection('admincustomers').countDocuments({ 
            role: 'admin_customer' 
        });
        console.log('📊 Jami admin_customer:', total);
        
        // Oylik obuna
        const monthly = await db.collection('admincustomers').countDocuments({
            role: 'admin_customer',
            status: 'active',
            'subscription.type': 'monthly',
            'subscription.status': 'active'
        });
        console.log('📊 Oylik:', monthly);
        
        // 6 oylik obuna
        const sixMonths = await db.collection('admincustomers').countDocuments({
            role: 'admin_customer',
            status: 'active',
            'subscription.type': '6months',
            'subscription.status': 'active'
        });
        console.log('📊 6 oylik:', sixMonths);
        
        // Yillik obuna
        const yearly = await db.collection('admincustomers').countDocuments({
            role: 'admin_customer',
            status: 'active',
            'subscription.type': 'yearly',
            'subscription.status': 'active'
        });
        console.log('📊 Yillik:', yearly);
        
        // Custom obuna
        const custom = await db.collection('admincustomers').countDocuments({
            role: 'admin_customer',
            status: 'active',
            'subscription.type': 'custom',
            'subscription.status': 'active'
        });
        console.log('📊 Custom:', custom);
        
        // Faol (boshqa turlar)
        const activeOther = await db.collection('admincustomers').countDocuments({
            role: 'admin_customer',
            status: 'active',
            'subscription.status': 'active',
            'subscription.type': { $nin: ['monthly', '6months', 'yearly', 'custom', 'none'] }
        });
        console.log('📊 Faol (boshqa):', activeOther);
        
        // Faol emas
        const inactive = await db.collection('admincustomers').countDocuments({
            role: 'admin_customer',
            status: { $in: ['inactive', 'blocked'] },
            'subscription.type': { $ne: 'none' }
        });
        console.log('📊 Faol emas:', inactive);
        
        // Obunasi yo'q
        const noSubscription = await db.collection('admincustomers').countDocuments({
            role: 'admin_customer',
            'subscription.type': 'none'
        });
        console.log('📊 Obunasi yo\'q:', noSubscription);
        
        // So'nggi 7 kun
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newThisWeek = await db.collection('admincustomers').countDocuments({
            role: 'admin_customer',
            createdAt: { $gte: sevenDaysAgo }
        });
        console.log('📊 Bu hafta yangi:', newThisWeek);
        
        // Umumiy daromad
        const totalRevenue = await db.collection('admincustomers').aggregate([
            { $match: { role: 'admin_customer', status: 'active', 'subscription.status': 'active' } },
            { $group: { _id: null, total: { $sum: '$subscription.amount' } } }
        ]).toArray();
        
        const counts = {
            total,
            monthly,
            sixMonths,
            yearly,
            custom,
            activeOther,
            inactive,
            noSubscription,
            newThisWeek,
            totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
        };

        res.json({
            success: true,
            data: {
                counts,
                chart: {
                    labels: ['Oylik', '6 oylik', 'Yillik', 'Custom', 'Faol', 'Faol emas', 'Obunasi yo\'q'],
                    data: [monthly, sixMonths, yearly, custom, activeOther, inactive, noSubscription],
                    total
                },
                recentAdmins: []
            }
        });
    } catch (error) {
        console.error('❌ Statistics error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server xatosi!',
            error: error.message 
        });
    }
});

// ============================================================
// NOTIFICATIONS
// ============================================================

app.post('/api/notifications', authAdminMain, async (req, res) => {
    try {
        console.log('📨 Xabar yuborish so\'rovi keldi');
        
        const { title, message, type = 'info', recipientId, recipientRole = 'admin_customer', expiresInDays = 30 } = req.body;
        const db = getDB();

        if (!title || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Sarlavha va xabar majburiy!' 
            });
        }

        let recipient = null;
        if (recipientId) {
            recipient = await db.collection('admincustomers').findOne({
                _id: new ObjectId(recipientId)
            });
            if (!recipient) {
                return res.status(404).json({
                    success: false,
                    message: 'Qabul qiluvchi topilmadi!'
                });
            }
        }

        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 30));

        const notification = {
            title: title.trim(),
            message: message.trim(),
            type: type,
            recipientId: recipientId ? new ObjectId(recipientId) : null,
            recipientName: recipient ? recipient.fullName : null,
            recipientEmail: recipient ? recipient.email : null,
            recipientRole: recipientRole || 'admin_customer',
            sentBy: new ObjectId(req.userId),
            sentByName: req.user.fullName || 'Admin',
            isRead: false,
            createdAt: now,
            updatedAt: now,
            expiresAt: expiresAt,
            isActive: true
        };

        const result = await db.collection('notifications').insertOne(notification);
        console.log('✅ Xabar saqlandi, ID:', result.insertedId);

        res.json({ 
            success: true, 
            message: '✅ Xabar muvaffaqiyatli yuborildi!',
            data: {
                id: result.insertedId,
                title: notification.title,
                message: notification.message,
                recipient: recipient ? recipient.fullName : 'Barcha adminlar',
                expiresAt: expiresAt.toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Xabar yuborish xatosi:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Xabar yuborishda xatolik!',
            error: error.message 
        });
    }
});

app.get('/api/notifications', auth, async (req, res) => {
    try {
        const db = getDB();
        const user = req.user;
        const now = new Date();
        
        await db.collection('notifications').deleteMany({
            $or: [
                { expiresAt: { $lt: now } },
                { isActive: false }
            ]
        });
        
        const query = {
            $and: [
                {
                    $or: [
                        { recipientId: user._id },
                        { recipientRole: 'all' },
                        { recipientRole: user.role }
                    ]
                },
                {
                    $or: [
                        { expiresAt: { $gt: now } },
                        { expiresAt: null }
                    ]
                },
                { isActive: true }
            ]
        };
        
        const notifications = await db.collection('notifications')
            .find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();

        res.json({ 
            success: true, 
            data: notifications,
            count: notifications.length
        });
    } catch (error) {
        console.error('❌ Xabarlarni olish xatosi:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Xatolik!' 
        });
    }
});

app.post('/api/notifications/:id/read', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const notification = await db.collection('notifications').findOne({
            _id: new ObjectId(id)
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Xabar topilmadi!'
            });
        }

        if (notification.recipientId && notification.recipientId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Bu xabarni o\'qilgan deb belgilashga ruxsat yo\'q!'
            });
        }

        await db.collection('notifications').updateOne(
            { _id: new ObjectId(id) },
            { $set: { isRead: true, updatedAt: new Date() } }
        );

        res.json({ 
            success: true, 
            message: 'Xabar o\'qilgan deb belgilandi' 
        });
    } catch (error) {
        console.error('❌ Xabarni o\'qilgan deb belgilash xatosi:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Xatolik!' 
        });
    }
});

app.delete('/api/notifications/:id', authAdminMain, async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const result = await db.collection('notifications').deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Xabar topilmadi!'
            });
        }

        res.json({
            success: true,
            message: 'Xabar o\'chirildi!'
        });
    } catch (error) {
        console.error('❌ Xabarni o\'chirish xatosi:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Xatolik!' 
        });
    }
});

// ============================================================
// HEALTH CHECK & ROOT
// ============================================================

app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '✅ Admin Main API ishlayapti!',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            login: '/api/auth/login',
            admins: '/api/admins',
            statistics: '/api/statistics',
            notifications: '/api/notifications'
        }
    });
});

// ============================================================
// 404 & ERROR
// ============================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route topilmadi!'
    });
});

app.use((err, req, res, next) => {
    console.error('❌ Server xatosi:', err);
    res.status(500).json({
        success: false,
        message: 'Server xatosi!'
    });
});

// ============================================================
// START
// ============================================================

async function startServer() {
    try {
        await connectDB();
        await createIndexes();
        await ensureAdminMainExists();
        startSubscriptionChecker();
        
        app.listen(PORT, () => {
            console.log(`\n🚀 Server http://localhost:${PORT} da ishga tushdi`);
            console.log('\n═══════════════════════════════════════════════');
            console.log('  🔑 LOGIN MA\'LUMOTLARI');
            console.log('  📧 Email: admin@example.com');
            console.log('  🔑 Parol: 123456');
            console.log('  👤 Rol: Admin Main');
            console.log('  💾 Database: MongoDB Atlas (Eduadmin)');
            console.log('  💰 Narxlar:');
            console.log('     Oylik: 299,999 so\'m');
            console.log('     6 oylik: 1,899,999 so\'m');
            console.log('     Yillik: 3,599,999 so\'m');
            console.log('  ⏰ JWT: 30 kun (Avtomatik eslab qolish)');
            console.log('  ⏱️  Subscription checker: har 3 sekund');
            console.log('  🕐 Vaqt zonasi: Asia/Tashkent (UTC+5)');
            console.log('  📞 Yordam: +998 94 022 44 92');
            console.log('  ⛔ Bloklangan userlar: Kirish taqiqlanadi');
            console.log('  📨 Xabarlar: 30 kunda avtomatik o\'chadi');
            console.log('═══════════════════════════════════════════════\n');
        });
    } catch (error) {
        console.error('❌ Server ishga tushmadi:', error.message);
        process.exit(1);
    }
}

process.on('SIGINT', async () => {
    console.log('\n⏹️ Server to\'xtatilmoqda...');
    stopSubscriptionChecker();
    await closeDB();
    process.exit(0);
});

startServer();
