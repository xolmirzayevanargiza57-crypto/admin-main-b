// ============================================================
// DATABASE CONFIG - MONGODB ATLAS
// ============================================================

const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'Eduadmin';

let client = null;
let db = null;

async function connectDB() {
    if (db) return db;

    console.log('\n🔄 MongoDB Atlas ga ulanish...');

    try {
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

module.exports = {
    connectDB,
    getDB,
    closeDB
};