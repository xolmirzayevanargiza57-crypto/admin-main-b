// ============================================
// LOGIN TEST SKRIPTI
// ============================================

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'admin_main';
const JWT_SECRET = process.env.JWT_SECRET || 'admin_main_super_secret_key_2026';

async function testLogin() {
    console.log('🔐 Login testi boshlandi...\n');
    
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('✅ MongoDB ga ulandi');
        
        const db = client.db(dbName);
        const collection = db.collection('admincustomers');
        
        // Login ma'lumotlari
        const email = 'admin@example.com';
        const password = '123456';
        
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Parol: ${password}`);
        console.log('');
        
        // Admin ni topish
        const admin = await collection.findOne({ email });
        
        if (!admin) {
            console.log('❌ Admin topilmadi!');
            console.log('💡 Avval admin yarating: node create-admin.js');
            return;
        }
        
        console.log('✅ Admin topildi:');
        console.log(`   👤 Ism: ${admin.fullName}`);
        console.log(`   📧 Email: ${admin.email}`);
        console.log(`   📊 Status: ${admin.status}`);
        console.log('');
        
        // Parolni tekshirish
        const isMatch = await bcrypt.compare(password, admin.password);
        
        if (isMatch) {
            console.log('✅ Parol to\'g\'ri!');
            
            // Token yaratish
            const token = jwt.sign(
                { 
                    id: admin._id, 
                    email: admin.email,
                    fullName: admin.fullName
                },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            console.log('');
            console.log('📋 TOKEN (Login uchun):');
            console.log('═'.repeat(60));
            console.log(token);
            console.log('═'.repeat(60));
            console.log('');
            console.log('🔗 Login API so\'rovi:');
            console.log('   POST http://localhost:5000/api/auth/login');
            console.log('   Body: { "email": "admin@example.com", "password": "123456" }');
            
        } else {
            console.log('❌ Parol noto\'g\'ri!');
        }
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await client.close();
        console.log('\n🔒 Ulanish yopildi');
    }
}

// Skriptni ishga tushirish
testLogin();