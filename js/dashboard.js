// ============================================
// DASHBOARD - TO'LIQ (TEZKOR YUKLANISH)
// ============================================

let subscriptionChart = null;
let refreshInterval = null;
let subscriptionCheckInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    // ✅ Parallel yuklash (tezroq)
    await Promise.all([
        loadStatistics(),
        loadRecentAdmins()
    ]);
    
    // ✅ Subscription statusni tekshirish
    checkSubscriptionStatus();
    
    // ✅ Refresh interval (30 soniya)
    refreshInterval = setInterval(() => {
        loadStatistics();
        loadRecentAdmins();
    }, 30000);
});

// Cleanup intervals on page unload
window.addEventListener('beforeunload', () => {
    if (refreshInterval) clearInterval(refreshInterval);
    if (subscriptionCheckInterval) clearInterval(subscriptionCheckInterval);
});

// ============================================
// STATISTIKA YUKLASH
// ============================================
async function loadStatistics() {
    try {
        console.log('📊 Statistika yuklanmoqda...');
        
        const data = await API.get('/statistics');
        console.log('📊 Statistika javobi:', data);
        
        if (data.success) {
            const stats = { ...data.data.counts, chart: data.data.chart };
            
            // ✅ Statistikani yangilash
            document.getElementById('totalCount').textContent = formatNumber(stats.total || 0);
            document.getElementById('monthlyCount').textContent = formatNumber(stats.monthly || 0);
            document.getElementById('yearlyCount').textContent = formatNumber(stats.yearly || 0);
            document.getElementById('inactiveCount').textContent = formatNumber(stats.noSubscription || 0);
            
            const newThisWeek = document.getElementById('newThisWeek');
            if (stats.newThisWeek > 0) {
                newThisWeek.textContent = `+${stats.newThisWeek} bu hafta`;
                newThisWeek.className = 'stat-change positive';
            } else {
                newThisWeek.textContent = '0 bu hafta';
                newThisWeek.className = 'stat-change';
            }
            
            // ✅ Subscription chart
            createSubscriptionChart(stats);
        } else {
            console.error('❌ Statistika xatosi:', data);
            showStatsError('Statistika yuklanmadi');
        }
    } catch (error) {
        console.error('❌ Statistika yuklash xatosi:', error);
        showStatsError('Statistika yuklanmadi: ' + error.message);
    }
}

// ============================================
// OXIRGI ADMINLAR - HAMMASINI KO'RSATISH
// ============================================
async function loadRecentAdmins() {
    try {
        console.log('👥 Oxirgi adminlar yuklanmoqda...');
        
        // ✅ Limitni oshiramiz (12 ta)
        const data = await API.get('/admins?limit=12');
        console.log('👥 Adminlar javobi:', data);
        
        if (data.success) {
            const container = document.getElementById('recentAdminsList');
            const admins = data.data || [];
            
            // ✅ Admin Main ni filtrlaymiz (faqat admin_customer)
            const filteredAdmins = admins.filter(admin => admin.role === 'admin_customer');
            
            if (filteredAdmins.length === 0) {
                container.innerHTML = '<p class="text-muted">Hali adminlar yo\'q</p>';
                return;
            }
            
            // ✅ Barcha adminlarni ko'rsatamiz (12 tagacha)
            container.innerHTML = filteredAdmins.map(admin => `
                <div class="recent-admin-item">
                    <div class="recent-admin-avatar">
                        ${(admin.fullName || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div class="recent-admin-info">
                        <p class="recent-admin-name">${admin.fullName || '-'}</p>
                        <p class="recent-admin-email">${admin.email || '-'}</p>
                    </div>
                    <span class="status-badge ${admin.subscription?.status === 'active' ? 'active' : 'inactive'}">
                        ${admin.subscription?.type === 'monthly' ? 'Oylik' : 
                          admin.subscription?.type === '6months' ? '6 oylik' :
                          admin.subscription?.type === 'yearly' ? 'Yillik' : 
                          admin.subscription?.status === 'active' ? 'Faol' : 'Obunasi yo\'q'}
                    </span>
                </div>
            `).join('');
        } else {
            console.error('❌ Adminlar xatosi:', data);
            container.innerHTML = '<p class="text-muted">Adminlar yuklanmadi</p>';
        }
    } catch (error) {
        console.error('❌ Adminlar yuklash xatosi:', error);
        const container = document.getElementById('recentAdminsList');
        if (container) {
            container.innerHTML = '<p class="text-muted">Xatolik: ' + error.message + '</p>';
        }
    }
}

// ============================================
// CHART YARATISH
// ============================================
function createSubscriptionChart(stats) {
    const ctx = document.getElementById('subscriptionChart');
    if (!ctx) return;
    
    if (subscriptionChart) {
        subscriptionChart.destroy();
    }

    const inactiveCount = stats.inactive || 0;
    const noSubscriptionCount = stats.noSubscription || 0;

    const labels = ['Oylik', '6 oylik', 'Yillik', 'Custom', 'Faol', 'Faol emas', 'Obunasi yo\'q'];
    const values = [
        stats.monthly || 0,
        stats.sixMonths || 0,
        stats.yearly || 0,
        stats.custom || 0,
        stats.activeOther || 0,
        inactiveCount,
        noSubscriptionCount
    ];
    
    subscriptionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    'rgba(52, 199, 89, 0.8)',
                    'rgba(255, 149, 0, 0.8)',
                    'rgba(0, 122, 255, 0.8)',
                    'rgba(124, 58, 237, 0.8)',
                    'rgba(31, 120, 180, 0.8)',
                    'rgba(255, 59, 48, 0.8)',
                    'rgba(142, 142, 147, 0.8)'
                ],
                borderColor: [
                    'rgba(52, 199, 89, 1)',
                    'rgba(255, 149, 0, 1)',
                    'rgba(0, 122, 255, 1)',
                    'rgba(124, 58, 237, 1)',
                    'rgba(31, 120, 180, 1)',
                    'rgba(255, 59, 48, 1)',
                    'rgba(108, 117, 125, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 16,
                        font: { size: 12, weight: '500' }
                    }
                }
            }
        }
    });
}

// ============================================
// XATOLIK KO'RSATISH
// ============================================
function showStatsError(message) {
    const container = document.querySelector('.stats-grid');
    if (container) {
        container.innerHTML = `
            <div class="stat-card" style="grid-column: 1 / -1; text-align: center; padding: 20px;">
                <p style="color: var(--color-danger);">
                    <i class="fas fa-exclamation-circle"></i> ${message}
                </p>
                <button onclick="location.reload()" class="btn-secondary" style="margin-top: 8px;">
                    <i class="fas fa-sync-alt"></i> Qayta yuklash
                </button>
            </div>
        `;
    }
}

// ============================================
// SUBSCRIPTION STATUS
// ============================================
async function checkSubscriptionStatus() {
    try {
        const response = await API.get('/auth/subscription-status');
        if (response.success) {
            const alertContainer = document.getElementById('subscriptionAlert');
            if (alertContainer) {
                alertContainer.innerHTML = '';
            }
        }
    } catch (error) {
        console.error('Subscription status check error:', error);
    }
}

// Chart.js global config
Chart.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
