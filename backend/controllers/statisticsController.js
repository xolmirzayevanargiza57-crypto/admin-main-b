// ============================================================
// STATISTICS CONTROLLER - TUZATILGAN
// ============================================================

const { getDB } = require('../config/db');

async function getStatistics(req, res) {
    try {
        const db = getDB();
        
        // Jami admin_customer lar
        const total = await db.collection('admincustomers').countDocuments({ 
            role: 'admin_customer' 
        });
        
        // Oylik obuna (faqat active)
        const monthly = await db.collection('admincustomers').countDocuments({
            role: 'admin_customer',
            status: 'active',
            'subscription.type': 'monthly',
            'subscription.status': 'active'
        });
        
        // 6 oylik obuna (faqat active)
        const sixMonths = await db.collection('admincustomers').countDocuments({
            role: 'admin_customer',
            status: 'active',
            'subscription.type': '6months',
            'subscription.status': 'active'
        });
        
        // Yillik obuna (faqat active)
        const yearly = await db.collection('admincustomers').countDocuments({
            role: 'admin_customer',
            status: 'active',
            'subscription.type': 'yearly',
            'subscription.status': 'active'
        });
        
        // ✅ FAOL (boshqa turlar) - active, subscription.status = active, lekin monthly/6months/yearly emas
        const activeOther = await db.collection('admincustomers').countDocuments({
            role: 'admin_customer',
            status: 'active',
            'subscription.status': 'active',
            'subscription.type': { $nin: ['monthly', '6months', 'yearly', 'none'] }
        });
        
        // ✅ FAOL EMAS - status = inactive yoki blocked (obuna bor lekin faol emas)
        const inactive = await db.collection('admincustomers').countDocuments({
            role: 'admin_customer',
            status: { $in: ['inactive', 'blocked'] },
            'subscription.type': { $ne: 'none' }
        });
        
        // ✅ OBUNASI YO'Q - subscription.type = 'none' (faol yoki faol emas bo'lishidan qat'iy nazar)
        const noSubscription = await db.collection('admincustomers').countDocuments({
            role: 'admin_customer',
            'subscription.type': 'none'
        });
        
        // So'nggi 7 kun
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newThisWeek = await db.collection('admincustomers').countDocuments({
            role: 'admin_customer',
            createdAt: { $gte: sevenDaysAgo }
        });
        
        // Umumiy daromad
        const totalRevenue = await db.collection('admincustomers').aggregate([
            { $match: { role: 'admin_customer', status: 'active', 'subscription.status': 'active' } },
            { $group: { _id: null, total: { $sum: '$subscription.amount' } } }
        ]).toArray();
        
        // So'nggi 5 admin
        const recentAdmins = await db.collection('admincustomers')
            .find({ role: 'admin_customer' }, { projection: { password: 0 } })
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray();
        
        const counts = {
            total,
            monthly,
            sixMonths,
            yearly,
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
                    labels: ['Oylik', '6 oylik', 'Yillik', 'Faol', 'Faol emas', 'Obunasi yo\'q'],
                    data: [monthly, sixMonths, yearly, activeOther, inactive, noSubscription],
                    total
                },
                recentAdmins
            }
        });
    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server xatosi!',
            error: error.message 
        });
    }
}

module.exports = {
    getStatistics
};