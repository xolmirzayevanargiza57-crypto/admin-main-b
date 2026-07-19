// ============================================================
// DASHBOARD - ADMIN MAIN (TO'LIQ)
// ============================================================

let dashboardLoaded = false;
let statsData = null;
let refreshInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    // ⭐ FAQAT 1 MARTA YUKLANISHI UCHUN
    if (dashboardLoaded) {
        console.log('⚠️ Dashboard allaqachon yuklangan');
        return;
    }
    dashboardLoaded = true;

    // Token tekshirish
    if (!Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    console.log('🚀 Dashboard yuklanmoqda...');
    loadStatistics();
    
    // ⭐ Har 30 soniyada yangilash
    refreshInterval = setInterval(() => {
        loadStatistics();
    }, 30000);
});

// ============================================================
// STATISTIKA YUKLASH
// ============================================================
async function loadStatistics() {
    try {
        console.log('📊 Statistika yuklanmoqda...');
        
        const data = await API.get('/statistics');
        console.log('📊 Statistika javobi:', data);
        
        if (data.success) {
            statsData = data.data;
            renderStatistics(statsData);
        } else if (data.status === 401 || data.status === 403) {
            console.warn('⚠️ Auth xatosi, logout...');
            Auth.logout();
        } else {
            console.error('❌ Statistika xatosi:', data.message);
            showError('Ma\'lumotlarni yuklashda xatolik: ' + data.message);
        }
    } catch (error) {
        console.error('❌ Statistika yuklash xatosi:', error);
        showError('Tarmoq xatosi! Qayta urinib ko\'ring.');
    }
}

// ============================================================
// STATISTIKANI RENDER QILISH
// ============================================================
function renderStatistics(data) {
    console.log('📊 Statistika render qilinmoqda:', data);
    
    const counts = data.counts || {};
    
    // ⭐ Stats cards
    const elements = {
        total: document.getElementById('totalCount'),
        monthly: document.getElementById('monthlyCount'),
        yearly: document.getElementById('yearlyCount'),
        inactive: document.getElementById('inactiveCount'),
        newThisWeek: document.getElementById('newThisWeek'),
        // Chart
        chartLabels: document.querySelector('#subscriptionChart')?.dataset?.labels,
        chartData: document.querySelector('#subscriptionChart')?.dataset?.data
    };
    
    // Jami adminlar
    if (elements.total) {
        elements.total.textContent = counts.total || 0;
    }
    
    // Oylik obuna
    if (elements.monthly) {
        elements.monthly.textContent = counts.monthly || 0;
    }
    
    // Yillik obuna
    if (elements.yearly) {
        elements.yearly.textContent = counts.yearly || 0;
    }
    
    // Obunasi yo'q
    if (elements.inactive) {
        elements.inactive.textContent = counts.noSubscription || 0;
    }
    
    // Bu hafta yangi
    if (elements.newThisWeek) {
        const newCount = counts.newThisWeek || 0;
        if (newCount > 0) {
            elements.newThisWeek.textContent = `+${newCount} bu hafta`;
            elements.newThisWeek.className = 'stat-change positive';
        } else {
            elements.newThisWeek.textContent = '0 bu hafta';
            elements.newThisWeek.className = 'stat-change';
        }
    }
    
    // ⭐ Chart yaratish
    createSubscriptionChart(data.chart);
    
    // ⭐ Oxirgi adminlar
    loadRecentAdmins();
}

// ============================================================
// SUBSCRIPTION CHART
// ============================================================
let subscriptionChart = null;

function createSubscriptionChart(chartData) {
    const ctx = document.getElementById('subscriptionChart');
    if (!ctx) {
        console.warn('⚠️ Chart canvas topilmadi');
        return;
    }
    
    if (subscriptionChart) {
        subscriptionChart.destroy();
        subscriptionChart = null;
    }
    
    const labels = chartData?.labels || ['Oylik', '6 oylik', 'Yillik', 'Custom', 'Faol', 'Faol emas', 'Obunasi yo\'q'];
    const data = chartData?.data || [0, 0, 0, 0, 0, 0, 0];
    
    subscriptionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
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

// ============================================================
// OXIRGI ADMINLAR
// ============================================================
async function loadRecentAdmins() {
    try {
        const container = document.getElementById('recentAdminsList');
        if (!container) return;
        
        const data = await API.get('/admins?limit=10');
        
        if (data.success && data.data) {
            const admins = data.data || [];
            
            if (admins.length === 0) {
                container.innerHTML = '<p class="text-muted">Hali adminlar yo\'q</p>';
                return;
            }
            
            container.innerHTML = admins.map(admin => {
                const subType = admin.subscription?.type || 'none';
                const subStatus = admin.subscription?.status || 'inactive';
                
                let subLabel = 'Obunasi yo\'q';
                let subClass = 'inactive';
                
                if (subType === 'none') {
                    subLabel = 'Obunasi yo\'q';
                    subClass = 'inactive';
                } else if (subStatus === 'active') {
                    if (subType === 'monthly') { 
                        subLabel = 'Oylik'; 
                        subClass = 'active'; 
                    } else if (subType === '6months') { 
                        subLabel = '6 oylik'; 
                        subClass = 'active'; 
                    } else if (subType === 'yearly') { 
                        subLabel = 'Yillik'; 
                        subClass = 'active'; 
                    } else if (subType === 'custom') { 
                        subLabel = 'Custom'; 
                        subClass = 'active'; 
                    } else { 
                        subLabel = 'Faol'; 
                        subClass = 'active'; 
                    }
                } else {
                    subLabel = 'Faol emas';
                    subClass = 'inactive';
                }
                
                return `
                    <div class="recent-admin-item">
                        <div class="recent-admin-avatar">
                            ${(admin.fullName || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div class="recent-admin-info">
                            <p class="recent-admin-name">${admin.fullName || '-'}</p>
                            <p class="recent-admin-email">${admin.email || '-'}</p>
                        </div>
                        <span class="status-badge ${subClass}">${subLabel}</span>
                    </div>
                `;
            }).join('');
            
            container.classList.add('scrollable');
        }
    } catch (error) {
        console.error('❌ Oxirgi adminlar yuklash xatosi:', error);
        const container = document.getElementById('recentAdminsList');
        if (container) {
            container.innerHTML = '<p class="text-muted">Adminlar yuklanmadi</p>';
        }
    }
}

// ============================================================
// XATOLIK KO'RSATISH
// ============================================================
function showError(message) {
    console.error('⚠️ Xatolik:', message);
    
    // ⭐ Ekranda xatolikni ko'rsatish
    const container = document.querySelector('.stats-grid');
    if (container) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'stat-card';
        errorDiv.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 20px; border-color: var(--color-danger);';
        errorDiv.innerHTML = `
            <p style="color: var(--color-danger);">
                <i class="fas fa-exclamation-circle"></i> 
                ${message}
            </p>
            <button onclick="location.reload()" class="btn-secondary" style="margin-top: 8px; width: auto; padding: 8px 16px;">
                <i class="fas fa-sync-alt"></i> Qayta yuklash
            </button>
        `;
        container.prepend(errorDiv);
    }
}

// ============================================================
// TOZALASH (Sahifa yopilganda)
// ============================================================
window.addEventListener('beforeunload', function() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    if (subscriptionChart) {
        subscriptionChart.destroy();
        subscriptionChart = null;
    }
});

console.log('✅ dashboard.js yuklandi');
