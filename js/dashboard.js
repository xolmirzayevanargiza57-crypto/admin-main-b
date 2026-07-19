// ============================================================
// DASHBOARD - STATISTIKALAR (TO'LIQ TUZATILGAN)
// ============================================================

let lastDashboardStats = null;
let refreshInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard yuklanmoqda...');
    
    try {
        const token = localStorage.getItem('customerToken') || sessionStorage.getItem('customerToken');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        const user = Auth.getUser();
        if (user) {
            const nameEl = document.getElementById('userName');
            const initialEl = document.getElementById('userInitial');
            const schoolEl = document.getElementById('schoolName');
            
            if (nameEl) nameEl.textContent = Auth.getUserName();
            if (initialEl) initialEl.textContent = Auth.getUserInitial();
            if (schoolEl) schoolEl.textContent = user.schoolName || 'Nurli Ta\'lim Markazi';
        }

        await loadDashboardStats();
        
        refreshInterval = setInterval(() => {
            loadDashboardStats();
        }, 30000);
        
        setupListeners();
        
        console.log('✅ Dashboard yuklandi!');
    } catch (error) {
        console.error('❌ Dashboard yuklash xatosi:', error);
        showError('Dashboard yuklashda xatolik: ' + error.message);
    }
});

async function loadDashboardStats() {
    try {
        console.log('📊 Statistika yuklanmoqda...');
        
        const data = await API.getDashboardStats();
        console.log('📊 Statistika javobi:', data);
        
        if (!data.success) {
            const errorMessage = data.message || 'Noma\'lum xatolik';
            console.error('❌ Statistika xatosi:', errorMessage);
            showError('Ma\'lumotlarni yuklashda xatolik: ' + errorMessage);
            return;
        }
        
        const stats = data.data;
        lastDashboardStats = stats;
        console.log('📊 Statistika ma\'lumotlari:', stats);
        
        // Stats cards
        const elements = {
            teacherCount: document.getElementById('teacherCount'),
            studentCount: document.getElementById('studentCount'),
            totalXP: document.getElementById('totalXP'),
            todayAttendance: document.getElementById('todayAttendance'),
            presentCount: document.getElementById('presentCount'),
            absentReasonCount: document.getElementById('absentReasonCount'),
            absentCount: document.getElementById('absentCount'),
            attendancePercent: document.getElementById('attendancePercent'),
            subscriptionStatus: document.getElementById('subscriptionStatus'),
            subscriptionType: document.getElementById('subscriptionType'),
            subscriptionEnd: document.getElementById('subscriptionEnd'),
            subscriptionDays: document.getElementById('subscriptionDays')
        };
        
        if (elements.teacherCount) elements.teacherCount.textContent = stats.teacherCount || 0;
        if (elements.studentCount) elements.studentCount.textContent = stats.studentCount || 0;
        if (elements.totalXP) elements.totalXP.textContent = stats.totalXP || 0;
        if (elements.todayAttendance) elements.todayAttendance.textContent = stats.todayAttendance || 0;
        
        const present = stats.attendanceStats?.present || 0;
        const absentReason = stats.attendanceStats?.absent_reason || 0;
        const absent = stats.attendanceStats?.absent || 0;
        
        if (elements.presentCount) elements.presentCount.textContent = present;
        if (elements.absentReasonCount) elements.absentReasonCount.textContent = absentReason;
        if (elements.absentCount) elements.absentCount.textContent = absent;
        
        const total = present + absentReason + absent;
        if (elements.attendancePercent) {
            if (total > 0) {
                const percent = Math.round((present / total) * 100);
                elements.attendancePercent.textContent = `${percent}%`;
                elements.attendancePercent.className = `stat-change ${percent >= 70 ? 'positive' : 'negative'}`;
            } else {
                elements.attendancePercent.textContent = '0%';
            }
        }

        // ⭐ SUBSCRIPTION - TO'LIQ TUZATILGAN
        if (stats.subscription) {
            console.log('📊 Subscription ma\'lumotlari:', stats.subscription);
            
            const sub = stats.subscription;
            
            // Status
            const statusMap = {
                'active': '✅ Faol',
                'inactive': '⛔ Faol emas',
                'expired': '⚠️ Muddati tugagan'
            };
            if (elements.subscriptionStatus) {
                elements.subscriptionStatus.textContent = statusMap[sub.status] || sub.status || 'Noma\'lum';
            }
            
            // Turi
            const typeMap = {
                'monthly': '📅 Oylik',
                '6months': '📅 6 oylik',
                'yearly': '📅 Yillik',
                'custom': '⚙️ Custom',
                'none': '❌ Yo\'q'
            };
            if (elements.subscriptionType) {
                elements.subscriptionType.textContent = typeMap[sub.type] || sub.type || 'Noma\'lum';
            }
            
            // Tugash vaqti
            if (sub.endDate && elements.subscriptionEnd) {
                const endDate = new Date(sub.endDate);
                const formattedDate = endDate.toLocaleString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
                elements.subscriptionEnd.textContent = formattedDate;
            } else if (elements.subscriptionEnd) {
                elements.subscriptionEnd.textContent = 'Muddati yo\'q';
            }
            
            // Qolgan kun
            if (sub.endDate && elements.subscriptionDays) {
                const endDate = new Date(sub.endDate);
                const now = new Date();
                const diff = endDate - now;
                
                if (diff > 0) {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    elements.subscriptionDays.textContent = `${days} kun ${hours}s ${minutes}m ${seconds}s`;
                } else {
                    elements.subscriptionDays.textContent = '⚠️ Vaqt tugagan!';
                }
            } else if (elements.subscriptionDays) {
                elements.subscriptionDays.textContent = '-';
            }
        } else {
            if (elements.subscriptionStatus) elements.subscriptionStatus.textContent = '❌ Yo\'q';
            if (elements.subscriptionType) elements.subscriptionType.textContent = '❌ Yo\'q';
            if (elements.subscriptionEnd) elements.subscriptionEnd.textContent = '-';
            if (elements.subscriptionDays) elements.subscriptionDays.textContent = '-';
        }
        
        console.log('✅ Dashboard statistikasi yuklandi!');
    } catch (error) {
        console.error('❌ Statistikani yuklash xatosi:', error);
        throw error;
    }
}

function setupListeners() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Auth.logout();
        });
    }
}

function showError(msg) {
    console.error('⚠️ Xatolik:', msg);
    
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        padding: 14px 18px; background: #fef2f2;
        border: 1px solid #fecaca; border-radius: 10px;
        color: #dc2626; max-width: 400px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        display: flex; align-items: center; gap: 10px;
        font-size: 0.85rem;
        z-index: 10000;
    `;
    div.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${msg}</span>
        <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: #dc2626; cursor: pointer; font-size: 1.1rem;">×</button>
    `;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 8000);
}

console.log('✅ dashboard.js yuklandi');
