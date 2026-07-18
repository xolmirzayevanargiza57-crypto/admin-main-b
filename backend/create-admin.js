// ============================================
// ADMIN YARATISH SKRIPTI
// ============================================

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'admin_main';

async function createAdmin() {
    console.log('🚀 Admin yaratish boshlandi...\n');
    
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('✅ MongoDB ga ulandi');
        
        const db = client.db(dbName);
        const collection = db.collection('admincustomers');
        
        // Admin ma'lumotlari
        const adminData = {
            fullName: 'Admin Main',
            email: 'admin@example.com',
            password: await bcrypt.hash('123456', 10),
            phone: '+998901234567',
            status: 'active',
            teachers: [],
            createdAt: new Date()
        };
        
        // Email mavjudligini tekshirish
        const existing = await collection.findOne({ email: adminData.email });
        if (existing) {
            console.log('⚠️ Bu email allaqachon ro\'yxatdan o\'tgan!');
            console.log(`📧 Email: ${adminData.email}`);
            console.log('🔑 Parol: 123456');
            return;
        }
        
        // Admin yaratish
        const result = await collection.insertOne(adminData);
        
        console.log('✅ Admin muvaffaqiyatli yaratildi!');
        console.log('\n📋 LOGIN MA\'LUMOTLARI:');
        console.log('═'.repeat(40));
        console.log(`📧 Email: ${adminData.email}`);
        console.log(`🔑 Parol: 123456`);
        console.log(`🆔 ID: ${result.insertedId}`);
        console.log(`👤 Ism: ${adminData.fullName}`);
        console.log('═'.repeat(40));
        console.log('\n🔗 Endi login qilishingiz mumkin:');
        console.log('   http://localhost:5000');
        console.log('   yoki index.html');
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await client.close();
        console.log('\n🔒 Ulanish yopildi');
    }
}

// Skriptni ishga tushirish
createAdmin();