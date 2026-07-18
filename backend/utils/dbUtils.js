// ============================================================
// DATABASE UTILS
// ============================================================

const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

// Indexes yaratish
async function createIndexes() {
    try {
        const db = getDB();
        await db.collection('admincustomers').createIndex({ email: 1 }, { unique: true });
        await db.collection('admincustomers').createIndex({ role: 1 });
        await db.collection('admincustomers').createIndex({ 'subscription.status': 1 });
        await db.collection('teachers').createIndex({ email: 1 }, { unique: true });
        await db.collection('teachers').createIndex({ adminCustomerId: 1 });
        await db.collection('students').createIndex({ teacherId: 1 });
        await db.collection('attendances').createIndex({ date: 1, studentId: 1 }, { unique: true });
        console.log('✅ Indexes yaratildi');
    } catch (error) {
        console.log('⚠️ Indexes:', error.message);
    }
}

// Admin Main rolni tuzatish
async function fixAdminRole() {
    try {
        const db = getDB();
        const collection = db.collection('admincustomers');
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
                teachers: [],
                status: 'active',
                createdBy: null,
                createdAt: new Date(),
                updatedAt: new Date()
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
    } catch (error) {
        console.log('⚠️ Admin:', error.message);
    }
}

module.exports = {
    createIndexes,
    fixAdminRole
};