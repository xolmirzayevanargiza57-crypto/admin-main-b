// ============================================================
// ADMIN CONTROLLER
// ============================================================

const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { getDB } = require('../config/db');

// ============================================================
// GET ALL ADMIN CUSTOMERS
// ============================================================
async function getAllAdmins(req, res) {
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
                query.status = 'inactive';
            } else if (subscription === 'none') {
                query['subscription.type'] = 'none';
                query['subscription.status'] = 'inactive';
            } else if (subscription === 'monthly') {
                query['subscription.type'] = 'monthly';
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
        
        let query_obj = db.collection('admincustomers')
            .find(query)
            .sort({ createdAt: -1 });
        
        if (limit) {
            query_obj = query_obj.limit(parseInt(limit));
        }
        
        const admins = await query_obj.toArray();
        
        admins.forEach(a => delete a.password);
        
        res.json({ success: true, count: admins.length, data: admins });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi!' });
    }
}

// ============================================================
// GET ADMIN BY ID
// ============================================================
async function getAdminById(req, res) {
    try {
        const { id } = req.params;
        const db = getDB();
        
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Noto\'g\'ri ID format!' });
        }

        const admin = await db.collection('admincustomers').findOne({
            _id: new ObjectId(id),
            role: 'admin_customer'
        });
        
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin Customer topilmadi!' });
        }

        delete admin.password;
        res.json({ success: true, data: admin });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi!' });
    }
}

// ============================================================
// CREATE ADMIN CUSTOMER
// ============================================================
async function createAdmin(req, res) {
    try {
        const { fullName, email, password, phone, subscriptionType, startDate, endDate } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: 'F.I.SH, Email va Parol majburiy!' });
        }

        const db = getDB();
        
        const existingAdmin = await db.collection('admincustomers').findOne({
            email: email.toLowerCase().trim()
        });
        if (existingAdmin) {
            return res.status(400).json({ success: false, message: 'Bu email allaqachon ro\'yxatdan o\'tgan!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const now = new Date();
        
        const subscription = {
            type: subscriptionType || 'none',
            startDate: subscriptionType !== 'none' ? (startDate ? new Date(startDate) : now) : null,
            endDate: subscriptionType !== 'none' ? (endDate ? new Date(endDate) : null) : null,
            status: subscriptionType !== 'none' ? 'active' : 'inactive',
            amount: subscriptionType === 'monthly' ? 250000 : subscriptionType === 'yearly' ? 3000000 : 0,
            purchasedBy: new ObjectId(req.userId),
            purchaseDate: subscriptionType !== 'none' ? now : null
        };
        
        const admin = {
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone: phone || '',
            role: 'admin_customer',
            subscription,
            teachers: [],
            status: subscriptionType && subscriptionType !== 'none' ? 'active' : 'inactive',
            createdBy: new ObjectId(req.userId),
            createdAt: now,
            updatedAt: now
        };
        
        const result = await db.collection('admincustomers').insertOne(admin);
        delete admin.password;

        res.status(201).json({
            success: true,
            message: 'Admin Customer muvaffaqiyatli yaratildi!',
            data: { ...admin, _id: result.insertedId }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi!' });
    }
}

// ============================================================
// UPDATE ADMIN CUSTOMER
// ============================================================
async function updateAdmin(req, res) {
    try {
        const { id } = req.params;
        const { fullName, email, phone, status } = req.body;
        const db = getDB();

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Noto\'g\'ri ID format!' });
        }

        const admin = await db.collection('admincustomers').findOne({
            _id: new ObjectId(id),
            role: 'admin_customer'
        });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin Customer topilmadi!' });
        }

        const updateData = { updatedAt: new Date() };
        if (fullName) updateData.fullName = fullName.trim();
        if (email) {
            const existingAdmin = await db.collection('admincustomers').findOne({
                email: email.toLowerCase().trim(),
                _id: { $ne: new ObjectId(id) }
            });
            if (existingAdmin) {
                return res.status(400).json({ success: false, message: 'Bu email boshqa admin tomonidan ishlatilmoqda!' });
            }
            updateData.email = email.toLowerCase().trim();
        }
        if (phone) updateData.phone = phone;
        if (status) updateData.status = status;

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
        res.status(500).json({ success: false, message: 'Server xatosi!' });
    }
}

// ============================================================
// DELETE ADMIN CUSTOMER
// ============================================================
async function deleteAdmin(req, res) {
    try {
        const { id } = req.params;
        const db = getDB();

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Noto\'g\'ri ID format!' });
        }

        const admin = await db.collection('admincustomers').findOne({
            _id: new ObjectId(id),
            role: 'admin_customer'
        });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin Customer topilmadi!' });
        }

        await db.collection('admincustomers').deleteOne({
            _id: new ObjectId(id)
        });

        res.json({
            success: true,
            message: 'Admin Customer muvaffaqiyatli o\'chirildi!'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server xatosi!' });
    }
}

// ============================================================
// UPDATE SUBSCRIPTION
// ============================================================
async function updateSubscription(req, res) {
    try {
        const { id } = req.params;
        const { subscriptionType } = req.body;
        const db = getDB();

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Noto\'g\'ri ID format!' });
        }

        if (!subscriptionType || !['monthly', 'yearly', 'none'].includes(subscriptionType)) {
            return res.status(400).json({ success: false, message: 'Noto\'g\'ri obuna turi!' });
        }

        const admin = await db.collection('admincustomers').findOne({
            _id: new ObjectId(id),
            role: 'admin_customer'
        });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin Customer topilmadi!' });
        }

        const now = new Date();
        let subscriptionUpdate = {
            type: subscriptionType,
            startDate: now,
            status: subscriptionType === 'none' ? 'inactive' : 'active'
        };

        if (subscriptionType === 'monthly') {
            subscriptionUpdate.endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else if (subscriptionType === 'yearly') {
            subscriptionUpdate.endDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        }

        // Add to subscription history
        if (!admin.subscriptionHistory) {
            admin.subscriptionHistory = [];
        }
        
        admin.subscriptionHistory.push({
            type: subscriptionType,
            startDate: now,
            endDate: subscriptionUpdate.endDate,
            status: subscriptionUpdate.status,
            createdAt: now
        });

        await db.collection('admincustomers').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    subscription: subscriptionUpdate,
                    subscriptionHistory: admin.subscriptionHistory,
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
        console.error('updateSubscription error:', error);
        res.status(500).json({ success: false, message: 'Server xatosi!' });
    }
}

module.exports = {
    getAllAdmins,
    getAdminById,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    updateSubscription
};