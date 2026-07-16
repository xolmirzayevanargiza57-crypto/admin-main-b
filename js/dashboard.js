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
            const stats = { ...data.data.counts, chart: data.data.chart };
            
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

    // Alohida hisoblar:
    // "Faol emas" = status='inactive' va subscription.type != 'none' (pul to'lamagan lekin tamimlangan)
    // "Obunasi yo'q" = subscription.type = 'none' (tamimlangan)
    const inactiveCount = stats.inactive || 0;              // Faol emas
    const noSubscriptionCount = stats.noSubscription || 0;  // Obunasi yo'q

    const labels = ['Oylik', '6 oylik', 'Yillik', 'Faol', 'Faol emas', 'Obunasi yo\'q'];
    const values = [
        stats.monthly || 0,
        stats.sixMonths || 0,
        stats.yearly || 0,
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
                    'rgba(31, 120, 180, 0.8)',
                    'rgba(255, 59, 48, 0.8)',
                    'rgba(142, 142, 147, 0.8)'
                ],
                borderColor: [
                    'rgba(52, 199, 89, 1)',
                    'rgba(255, 149, 0, 1)',
                    'rgba(0, 122, 255, 1)',
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
// CHECK SUBSCRIPTION STATUS
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