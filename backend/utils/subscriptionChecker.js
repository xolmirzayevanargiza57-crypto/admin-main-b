// ============================================================
// SUBSCRIPTION EXPIRY CHECKER
// ============================================================

const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

let checkerInterval = null;

/**
 * Start subscription checker - runs every 3 seconds
 */
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
    }, 3000); // Every 3 seconds
    
    console.log('✅ Subscription checker started (every 3 seconds)');
}

/**
 * Stop subscription checker
 */
function stopSubscriptionChecker() {
    if (checkerInterval) {
        clearInterval(checkerInterval);
        checkerInterval = null;
        console.log('❌ Subscription checker stopped');
    }
}

/**
 * Check and mark expired subscriptions as inactive
 */
async function checkExpiredSubscriptions() {
    try {
        const db = getDB();
        const now = new Date();
        
        // Find all admins with active subscriptions that have expired
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
            // Mark as inactive
            const adminIds = expiredAdmins.map(a => a._id);
            
            const result = await db.collection('admincustomers').updateMany(
                { _id: { $in: adminIds } },
                {
                    $set: {
                        status: 'inactive',
                        'subscription.status': 'inactive',
                        updatedAt: now
                    }
                }
            );
            
            console.log(`⏱️  ${result.modifiedCount} expired subscriptions marked as inactive`);
            
            // Log event
            for (const admin of expiredAdmins) {
                await db.collection('subscription_logs').insertOne({
                    adminId: admin._id,
                    adminName: admin.fullName,
                    adminEmail: admin.email,
                    action: 'SUBSCRIPTION_EXPIRED',
                    subscriptionType: admin.subscription.type,
                    endDate: admin.subscription.endDate,
                    timestamp: now
                });
            }
        }
    } catch (error) {
        console.error('Error checking expired subscriptions:', error);
    }
}

/**
 * Get subscription status with countdown
 */
async function getSubscriptionStatus(adminId) {
    try {
        const db = getDB();
        
        if (!ObjectId.isValid(adminId)) {
            return null;
        }
        
        const admin = await db.collection('admincustomers').findOne({
            _id: new ObjectId(adminId),
            role: 'admin_customer'
        });
        
        if (!admin) return null;
        
        const now = new Date();
        const subscription = admin.subscription || {};
        
        // If no active subscription
        if (subscription.status !== 'active' || subscription.type === 'none') {
            return {
                isActive: false,
                type: 'none',
                status: 'inactive',
                message: 'Obunaning muddasi tugagan yoki mavjud emas'
            };
        }
        
        // Calculate countdown
        const endDate = new Date(subscription.endDate);
        const timeDiff = endDate - now;
        
        if (timeDiff <= 0) {
            // Expired - mark as inactive
            await db.collection('admincustomers').updateOne(
                { _id: new ObjectId(adminId) },
                {
                    $set: {
                        status: 'inactive',
                        'subscription.status': 'inactive',
                        updatedAt: now
                    }
                }
            );
            
            return {
                isActive: false,
                type: subscription.type,
                status: 'expired',
                message: 'Obunaning muddasi tugagan',
                expiredAt: endDate
            };
        }
        
        // Calculate days and seconds remaining
        const totalSeconds = Math.floor(timeDiff / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return {
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
        };
    } catch (error) {
        console.error('Error getting subscription status:', error);
        return null;
    }
}

module.exports = {
    startSubscriptionChecker,
    stopSubscriptionChecker,
    checkExpiredSubscriptions,
    getSubscriptionStatus
};
