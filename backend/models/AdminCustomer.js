const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const bcrypt = require('bcryptjs');

const COLLECTION = 'admincustomers';

// AdminCustomer yaratish
async function createAdminCustomer(data) {
    const db = getDB();
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const admin = {
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        phone: data.phone || '',
        subscription: {
            type: data.subscriptionType || 'none', // 'none', 'monthly', 'yearly'
            startDate: data.subscriptionType && data.subscriptionType !== 'none' ? new Date() : null,
            endDate: data.subscriptionType && data.subscriptionType !== 'none' ? 
                new Date(Date.now() + (data.subscriptionType === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000) : null,
            status: data.subscriptionType && data.subscriptionType !== 'none' ? 'active' : 'inactive'
        },
        teachers: [],
        status: data.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    const result = await db.collection(COLLECTION).insertOne(admin);
    return { ...admin, _id: result.insertedId };
}

// Barcha AdminCustomerlarni olish (subscription filter bilan)
async function findAll(filter = {}) {
    const db = getDB();
    const query = {};
    
    if (filter.status && filter.status !== 'all') {
        query.status = filter.status;
    }
    
    if (filter.subscription) {
        if (filter.subscription === 'active') {
            query['subscription.status'] = 'active';
        } else if (filter.subscription === 'inactive') {
            query['subscription.status'] = 'inactive';
        } else if (filter.subscription === 'monthly') {
            query['subscription.type'] = 'monthly';
            query['subscription.status'] = 'active';
        } else if (filter.subscription === 'yearly') {
            query['subscription.type'] = 'yearly';
            query['subscription.status'] = 'active';
        }
    }
    
    if (filter.search) {
        query.$or = [
            { fullName: { $regex: filter.search, $options: 'i' } },
            { email: { $regex: filter.search, $options: 'i' } }
        ];
    }
    
    const admins = await db.collection(COLLECTION)
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
    
    return admins;
}

// ID bo'yicha topish
async function findById(id) {
    const db = getDB();
    return await db.collection(COLLECTION).findOne({ 
        _id: new ObjectId(id) 
    });
}

// Email bo'yicha topish
async function findByEmail(email) {
    const db = getDB();
    return await db.collection(COLLECTION).findOne({ 
        email: email.toLowerCase() 
    });
}

// Yangilash
async function updateAdmin(id, data) {
    const db = getDB();
    const updateData = { ...data, updatedAt: new Date() };
    delete updateData.password;
    delete updateData._id;
    
    const result = await db.collection(COLLECTION).updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
    );
    
    return result;
}

// Subscription yangilash
async function updateSubscription(id, type) {
    const db = getDB();
    const now = new Date();
    const endDate = type === 'none' ? null : 
        new Date(now.getTime() + (type === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000);
    
    const result = await db.collection(COLLECTION).updateOne(
        { _id: new ObjectId(id) },
        { 
            $set: { 
                'subscription.type': type,
                'subscription.startDate': type !== 'none' ? now : null,
                'subscription.endDate': endDate,
                'subscription.status': type !== 'none' ? 'active' : 'inactive',
                updatedAt: now
            } 
        }
    );
    
    return result;
}

// O'chirish
async function deleteAdmin(id) {
    const db = getDB();
    return await db.collection(COLLECTION).deleteOne({ 
        _id: new ObjectId(id) 
    });
}

// Statistika
async function getSubscriptionStats() {
    const db = getDB();
    
    const total = await db.collection(COLLECTION).countDocuments();
    const monthly = await db.collection(COLLECTION).countDocuments({ 
        'subscription.type': 'monthly',
        'subscription.status': 'active' 
    });
    const yearly = await db.collection(COLLECTION).countDocuments({ 
        'subscription.type': 'yearly',
        'subscription.status': 'active' 
    });
    const inactive = await db.collection(COLLECTION).countDocuments({ 
        'subscription.status': 'inactive' 
    });
    
    // So'nggi 7 kunlik qo'shilganlar
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newThisWeek = await db.collection(COLLECTION).countDocuments({ 
        createdAt: { $gte: sevenDaysAgo } 
    });
    
    return { total, monthly, yearly, inactive, newThisWeek };
}

module.exports = {
    createAdminCustomer,
    findAll,
    findById,
    findByEmail,
    updateAdmin,
    updateSubscription,
    deleteAdmin,
    getSubscriptionStats,
    COLLECTION
};