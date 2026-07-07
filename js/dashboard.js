// ============================================
// DASHBOARD - SUBSCRIPTION STATS
// ============================================

let subscriptionChart = null;
let refreshInterval = null;
let subscriptionCheckInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    await loadStatistics();
    await loadRecentAdmins();
    await checkSubscriptionStatus(); // Check subscription on load
    
    // Refresh statistics every 30 seconds for real-time updates
    refreshInterval = setInterval(() => {
        loadStatistics();
        loadRecentAdmins();
    }, 30000);
    
    // Check subscription every 3 seconds for countdown
    subscriptionCheckInterval = setInterval(() => {
        checkSubscriptionStatus();
    }, 3000);
});

// Cleanup intervals on page unload
window.addEventListener('beforeunload', () => {
    if (refreshInterval) clearInterval(refreshInterval);
    if (subscriptionCheckInterval) clearInterval(subscriptionCheckInterval);
});

async function loadStatistics() {
    try {
        const data = await API.get('/statistics');
        if (data.success) {
            const stats = data.data.counts;
            
            document.getElementById('totalCount').textContent = formatNumber(stats.total || 0);
            document.getElementById('monthlyCount').textContent = formatNumber(stats.monthly || 0);
            document.getElementById('yearlyCount').textContent = formatNumber(stats.yearly || 0);
            document.getElementById('inactiveCount').textContent = formatNumber(stats.inactive || 0);
            
            const newThisWeek = document.getElementById('newThisWeek');
            if (stats.newThisWeek > 0) {
                newThisWeek.textContent = `+${stats.newThisWeek} bu hafta`;
                newThisWeek.className = 'stat-change positive';
            } else {
                newThisWeek.textContent = '0 bu hafta';
                newThisWeek.className = 'stat-change';
            }
            
            // Subscription chart
            createSubscriptionChart(stats);
        }
    } catch (error) {
        console.error('Statistika yuklash xatosi:', error);
    }
}

async function loadRecentAdmins() {
    try {
        const data = await API.get('/admins?limit=5&status=active');
        if (data.success) {
            const container = document.getElementById('recentAdminsList');
            const admins = data.data || [];
            
            if (admins.length === 0) {
                container.innerHTML = '<p class="text-muted">Hali adminlar yo\'q</p>';
                return;
            }
            
            container.innerHTML = admins.map(admin => `
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
                          admin.subscription?.type === 'yearly' ? 'Yillik' : 
                          admin.subscription?.status === 'active' ? 'Faol' : 'Obunasi yo\'q'}
                    </span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Adminlar yuklash xatosi:', error);
    }
}

function createSubscriptionChart(stats) {
    const ctx = document.getElementById('subscriptionChart');
    if (!ctx) return;
    
    if (subscriptionChart) {
        subscriptionChart.destroy();
    }
    
    subscriptionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Oylik', 'Yillik', 'Obunasi yo\'q'],
            datasets: [{
                data: [stats.monthly || 0, stats.yearly || 0, stats.inactive || 0],
                backgroundColor: [
                    'rgba(52, 199, 89, 0.8)',
                    'rgba(0, 122, 255, 0.8)',
                    'rgba(255, 59, 48, 0.8)'
                ],
                borderColor: [
                    'rgba(52, 199, 89, 1)',
                    'rgba(0, 122, 255, 1)',
                    'rgba(255, 59, 48, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
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
// CHECK SUBSCRIPTION STATUS
// ============================================
async function checkSubscriptionStatus() {
    try {
        const response = await API.get('/auth/subscription-status');
        if (response.success) {
            const subData = response.data;
            const alertContainer = document.getElementById('subscriptionAlert');
            
            if (!alertContainer) {
                // Create alert container if doesn't exist
                const newAlert = document.createElement('div');
                newAlert.id = 'subscriptionAlert';
                document.body.insertAdjacentElement('afterbegin', newAlert);
            }
            
            const alertEl = document.getElementById('subscriptionAlert');
            
            if (subData.status === 'expired') {
                // Show expired warning
                alertEl.innerHTML = `
                    <div class="subscription-alert expired">
                        <div class="alert-content">
                            <i class="fas fa-exclamation-circle"></i>
                            <div>
                                <p class="alert-title">⚠️ Obuna muddasi tugagan!</p>
                                <p class="alert-message">Iltimos, qaytadan to'lov qiling. Obunangiz faol emas bo'lib ketdi.</p>
                            </div>
                            <button onclick="location.href='settings.html'" class="btn-renew">To'lovni yangilash</button>
                        </div>
                    </div>
                `;
            } else if (subData.status === 'active') {
                const remainingTime = subData.remainingTime;
                if (remainingTime.totalSeconds <= 604800) { // 7 days or less
                    alertEl.innerHTML = `
                        <div class="subscription-alert warning">
                            <div class="alert-content">
                                <i class="fas fa-clock"></i>
                                <div>
                                    <p class="alert-title">⏰ Obuna muddasi tugayotgan</p>
                                    <p class="alert-message">
                                        Qolgan vaqt: <strong>${remainingTime.days}k ${remainingTime.hours}s ${remainingTime.minutes}m</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    // Hide alert if more than 7 days remaining
                    alertEl.innerHTML = '';
                }
            } else {
                // No active subscription
                alertEl.innerHTML = `
                    <div class="subscription-alert inactive">
                        <div class="alert-content">
                            <i class="fas fa-info-circle"></i>
                            <div>
                                <p class="alert-title">ℹ️ Aktiv obuna mavjud emas</p>
                                <p class="alert-message">Xizmatlardan to'liq foydalanish uchun obuna sotib oling.</p>
                            </div>
                            <button onclick="location.href='settings.html'" class="btn-subscribe">Obuna sotib olish</button>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Subscription status check error:', error);
    }
}

// Chart.js global config
Chart.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';