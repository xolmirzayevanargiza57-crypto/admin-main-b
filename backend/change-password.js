// ============================================
// ADMIN PAROLINI O'ZGARTIRISH
// ============================================

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'admin_main';

async function changePassword() {
    // Argumentlarni o'qish
    const args = process.argv.slice(2);
    const email = args[0] || 'admin@example.com';
    const newPassword = args[1] || '123456';
    
    console.log(`🔄 Parol o'zgartirilmoqda...\n`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Yangi parol: ${newPassword}\n`);
    
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('✅ MongoDB ga ulandi');
        
        const db = client.db(dbName);
        const collection = db.collection('admincustomers');
        
        // Admin ni topish
        const admin = await collection.findOne({ email });
        
        if (!admin) {
            console.log('❌ Admin topilmadi!');
            return;
        }
        
        // Parolni hash qilish
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Yangilash
        await collection.updateOne(
            { email },
            { $set: { password: hashedPassword } }
        );
        
        console.log('✅ Parol muvaffaqiyatli o\'zgartirildi!');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Yangi parol: ${newPassword}`);
        
    } catch (error) {
        console.error('❌ Xatolik:', error.message);
    } finally {
        await client.close();
        console.log('\n🔒 Ulanish yopildi');
    }
}

changePassword();