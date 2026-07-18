// ============================================
// BARCHA ADMINLARNI KO'RISH
// ============================================

const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'admin_main';

async function listAdmins() {
    console.log('📋 Adminlar ro\'yxati...\n');
    
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('✅ MongoDB ga ulandi\n');
        
        const db = client.db(dbName);
        const collection = db.collection('admincustomers');
        
        const admins = await collection.find({}).toArray();
        
        if (admins.length === 0) {
            console.log('⚠️ Hech qanday admin topilmadi!');
            console.log('💡 Admin yaratish: node create-admin.js');
            return;
        }
        
        console.log(`✅ ${admins.length} ta admin topildi:\n`);
        console.log('═'.repeat(70));
        console.log('№  | Ism                     | Email                     | Holati');
        console.log('═'.repeat(70));
        
        admins.forEach((admin, index) => {
            const num = String(index + 1).padStart(2);
            const name = (admin.fullName || '-').padEnd(24).slice(0, 24);
            const email = (admin.email || '-').padEnd(25).slice(0, 25);
            const status = admin.status === 'active' ? '✅ Faol' : '❌ Bloklangan';
            console.log(`${num}  | ${name} | ${email} | ${status}`);
        });
        
        console.log('═'.repeat(70));
        console.log('\n🔑 Barcha adminlar uchun parol: 123456');
        console.log('📧 Email: admin@example.com');
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await client.close();
        console.log('\n🔒 Ulanish yopildi');
    }
}

listAdmins();