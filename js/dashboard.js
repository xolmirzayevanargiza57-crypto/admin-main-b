// ============================================
// DASHBOARD - SUBSCRIPTION STATS
// ============================================

let subscriptionChart = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    await loadStatistics();
    await loadRecentAdmins();
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
        const data = await API.get('/admins?limit=5');
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

// Chart.js global config
Chart.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';