// ============================================================
// ADMIN PROFILE - ADMIN-MAIN (TO'LIQ)
// Loyiha: Admin-Main Frontend
// Fayl: js/admin-profile.js
// ============================================================

let adminId = null;
let currentAdmin = null;
let countdownInterval = null;
let notificationRefreshInterval = null;

// ============================================================
// ⭐ TO'LOV USULI MA'LUMOTLARI (TO'LIQ)
// ============================================================
const PAYMENT_METHODS = {
    // 1. Naqd pul
    cash: {
        id: 'cash',
        name: 'Naqd pul',
        icon: 'https://www.gazeta.uz/sp/32221828/img/tild3365-3235-4161-a437-316637323436__banknoti-uzb.png',
        keywords: ['naqd', 'cash', 'pul', 'qog\'oz'],
        emoji: '💵'
    },
    
    // 2. Click
    click: {
        id: 'click',
        name: 'Click',
        icon: 'https://api.logobank.uz/media/logos_preview/Click-01_0xvqWH8.png',
        keywords: ['click'],
        emoji: '📱'
    },
    
    // 3. Paynet
    paynet: {
        id: 'paynet',
        name: 'Paynet',
        icon: 'https://frankfurt.apollo.olxcdn.com/v1/files/qum4yr71mite1-UZ/image',
        keywords: ['paynet'],
        emoji: '💳'
    },
    
    // 4. Payme
    payme: {
        id: 'payme',
        name: 'Payme',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Paymeuz_logo.png',
        keywords: ['payme'],
        emoji: '📲'
    },
    
    // 5. Uzum (Uzum Bank)
    uzum: {
        id: 'uzum',
        name: 'Uzum',
        icon: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/e6/37/36/e63736b4-eaad-b8d8-0c7d-6be94529a18e/AppIcon-0-0-1x_U007emarketing-0-11-0-85-220.png/1200x630wa.png',
        keywords: ['uzum', 'uzum bank'],
        emoji: '🟣'
    },
    
    // 6. Uzcard
    uzcard: {
        id: 'uzcard',
        name: 'Uzcard',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Uzcard.jpg/500px-Uzcard.jpg',
        keywords: ['uzcard', 'uz card'],
        emoji: '💳'
    },
    
    // 7. Humo
    humo: {
        id: 'humo',
        name: 'Humo',
        icon: 'https://payform.global/img/humo.png',
        keywords: ['humo'],
        emoji: '🟠'
    },
    
    // 8. Visa
    visa: {
        id: 'visa',
        name: 'Visa',
        icon: 'https://i.pinimg.com/originals/1f/50/0c/1f500cb49b3c529f6a88b9a0fa6070e4.jpg?nii=t',
        keywords: ['visa'],
        emoji: '💳'
    },
    
    // 9. Agrobank
    agrobank: {
        id: 'agrobank',
        name: 'Agrobank',
        icon: 'https://cdn.forbes.ru/forbes-static/new/2023/03/AgroBank-mini-6414643a35289.jpg',
        keywords: ['agrobank', 'agro bank'],
        emoji: '🌾'
    },
    
    // 10. TBC Bank
    tbc: {
        id: 'tbc',
        name: 'TBC Bank',
        icon: 'https://yt3.googleusercontent.com/ytc/AIdro_k6EoLZ1l7Xp-B7UADAullK6FNC9C0HE_74uOF2a46H3V4=s900-c-k-c0x00ffffff-no-rj',
        keywords: ['tbc', 'tbcbank'],
        emoji: '🔷'
    },
    
    // 11. Anorbank
    anorbank: {
        id: 'anorbank',
        name: 'Anorbank',
        icon: 'https://cbu.uz/upload/iblock/53c/3.jpg',
        keywords: ['anorbank', 'anor bank', 'anor'],
        emoji: '🍊'
    },
    
    // 12. Xazna (G'azna)
    xazna: {
        id: 'xazna',
        name: 'Xazna Bank',
        icon: 'https://api.logobank.uz/media/logos_preview/XAZNA-01.png',
        keywords: ['xazna', 'xasna', 'xazna bank', 'g\'azna', 'gazna'],
        emoji: '🏦'
    },
    
    // 13. Anjir (Anjir Pay)
    anjir: {
        id: 'anjir',
        name: 'Anjir Pay',
        icon: 'https://yt3.googleusercontent.com/CY0fy5wKvwqDsmlRnUkV6xFQzGJQbxbhxMCIPMehKgBgawYm4KNlgt6dp8avty7TQpb8Y8h1=s900-c-k-c0x00ffffff-no-rj',
        keywords: ['anjir', 'anjir pay', 'anjir bank'],
        emoji: '🍐'
    },
    
    // 14. Boshqa (Default - karta)
    other: {
        id: 'other',
        name: 'Boshqa',
        icon: 'https://png.pngtree.com/png-clipart/20211017/original/pngtree-credit-card-vector-illustration-png-image_6857353.png',
        keywords: ['karta', 'card', 'bank', 'to\'lov'],
        emoji: '💳'
    }
};

// ============================================================
// ⭐ TO'LOV USULINI MATN ORQALI AVTOMATIK ANIQLASH
// ============================================================
function detectPaymentMethod(text) {
    if (!text) return PAYMENT_METHODS.other;
    
    const lowerText = text.toLowerCase().trim();
    
    for (const [key, method] of Object.entries(PAYMENT_METHODS)) {
        if (key === 'other') continue;
        if (method.keywords && method.keywords.some(kw => lowerText.includes(kw))) {
            return method;
        }
    }
    
    return PAYMENT_METHODS.other;
}

// ============================================================
// ⭐ PULNI FORMATLASH
// ============================================================
function formatMoney(amount) {
    if (!amount && amount !== 0) return '0 so\'m';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0 so\'m';
    return num.toLocaleString('uz-UZ') + ' so\'m';
}

// ============================================================
// ⭐ VAQTNI FORMATLASH
// ============================================================
function formatDateTimeFull(date) {
    if (!date) return 'Noma\'lum vaqt';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Noma\'lum vaqt';
        return d.toLocaleString('uz-UZ', {
            timeZone: 'Asia/Tashkent',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch (error) {
        return 'Noma\'lum vaqt';
    }
}

// ============================================================
// SAHIFA YUKLANGANDA
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    const params = new URLSearchParams(window.location.search);
    adminId = params.get('id');
    
    if (!adminId) {
        alert('Admin ID topilmadi!');
        window.location.href = 'admins.html';
        return;
    }
    
    console.log('🔍 Admin ID:', adminId);
    
    loadProfile();
    loadNotifications();
    initEditModal();
    initPaymentModal();
    initSubscriptionModal();
    initNotificationModal();
    initUnbanModal();
    initButtons();
    initSidebar();
    
    notificationRefreshInterval = setInterval(() => {
        loadNotifications();
    }, 3000);
});

// ============================================================
// SIDEBAR TOGGLE
// ============================================================
function initSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (!menuToggle || !sidebar) return;
    
    const newToggle = menuToggle.cloneNode(true);
    menuToggle.parentNode.replaceChild(newToggle, menuToggle);
    
    newToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('show');
    });
    
    if (overlay) {
        const newOverlay = overlay.cloneNode(true);
        overlay.parentNode.replaceChild(newOverlay, overlay);
        newOverlay.addEventListener('click', function() {
            sidebar.classList.remove('open');
            this.classList.remove('show');
        });
    }
}

// ============================================================
// PROFILNI YUKLASH
// ============================================================
async function loadProfile() {
    try {
        console.log('🔄 Profil yuklanmoqda... ID:', adminId);
        const data = await API.get(`/admins/${adminId}`);
        console.log('📦 API javobi:', data);
        if (data.success && data.data) {
            currentAdmin = data.data;
            renderProfile(currentAdmin);
            startCountdown();
        } else {
            showError('Ma\'lumotlar topilmadi');
        }
    } catch (error) {
        console.error('❌ Profil yuklash xatosi:', error);
        showError('Profil ma\'lumotlarini yuklashda xatolik: ' + error.message);
    }
}

// ============================================================
// COUNTDOWN
// ============================================================
function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    countdownInterval = setInterval(() => {
        updateCountdown();
    }, 1000);
}

function updateCountdown() {
    const subEndEl = document.getElementById('profileSubEnd');
    if (!subEndEl || !currentAdmin) return;
    
    const sub = currentAdmin.subscription || {};
    if (!sub.endDate || sub.status !== 'active') {
        subEndEl.textContent = '-';
        return;
    }
    
    const endDate = new Date(sub.endDate);
    const now = new Date();
    const diff = endDate - now;
    
    if (diff <= 0) {
        subEndEl.textContent = '⚠️ Vaqt tugagan!';
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    subEndEl.textContent = `${formatDateTimeFull(endDate)} (${days} kun ${hours}s ${minutes}m ${seconds}s qoldi)`;
}

// ============================================================
// XABARLARNI YUKLASH
// ============================================================
async function loadNotifications() {
    try {
        const data = await API.get('/notifications');
        if (data.success && data.data) {
            renderNotifications(data.data);
        }
    } catch (error) {
        console.error('❌ Xabarlarni yuklash xatosi:', error);
    }
}

function renderNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    
    const user = Auth.getUser();
    let filtered = notifications.filter(n => n.recipientId === adminId);
    
    if (!filtered || filtered.length === 0) {
        container.innerHTML = '<p class="text-muted" style="text-align:center;padding:20px;">Xabarlar yo\'q</p>';
        return;
    }
    
    container.innerHTML = filtered.map((item, index) => {
        const isRead = item.isRead;
        const isSentByMe = item.sentBy === user?._id;
        const senderName = item.sentByName || 'Admin';
        const formattedDate = formatDateTimeFull(item.createdAt);
        
        return `
            <div class="history-item ${isRead ? 'read' : 'unread'}" style="${!isRead ? 'border-left: 3px solid #007aff;' : ''}; padding: 12px 16px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 8px;">
                <div style="display:flex;gap:12px;align-items:flex-start;">
                    <span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:var(--text-primary);color:var(--bg-primary);border-radius:50%;font-weight:600;flex-shrink:0;">${index + 1}</span>
                    <div style="flex:1;">
                        <p style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-bottom:4px;">
                            <strong>${item.title || 'Xabar'}</strong>
                            <span style="font-size:0.65rem;color:var(--text-muted);">${isRead ? '✅ O\'qilgan' : '🟡 O\'qilmagan'} • ${isSentByMe ? '✉️ Men' : `✉️ ${senderName}`}</span>
                        </p>
                        <p style="font-size:0.8rem;color:var(--text-secondary);word-wrap:break-word;">${item.message || ''}</p>
                        <p style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;"><i class="fas fa-calendar"></i> ${formattedDate}</p>
                    </div>
                </div>
                <div style="display:flex;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid var(--border-color);">
                    <button class="delete-notification-btn" data-id="${item._id}" style="background:none;border:1px solid #ff3b30;color:#ff3b30;font-size:0.65rem;cursor:pointer;padding:4px 12px;border-radius:6px;">
                        <i class="fas fa-trash"></i> O'chirish
                    </button>
                    ${isRead ? '<span style="font-size:0.65rem;color:var(--text-muted);">✓ O\'qilgan</span>' : '<span style="font-size:0.65rem;color:#ff9500;">⏳ O\'qilmagan</span>'}
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.delete-notification-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            if (!confirm('Haqiqatan ham bu xabarni o\'chirmoqchimisiz?')) return;
            try {
                const response = await API.delete(`/notifications/${id}`);
                if (response.success) {
                    showSuccess('Xabar o\'chirildi!');
                    loadNotifications();
                }
            } catch (error) {
                showError('Xabarni o\'chirishda xatolik!');
            }
        });
    });
}

// ============================================================
// PROFILNI RENDER QILISH
// ============================================================
function renderProfile(admin) {
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const phoneEl = document.getElementById('profilePhone');
    const initialEl = document.getElementById('profileInitial');
    
    if (nameEl) nameEl.textContent = admin.fullName || '-';
    if (emailEl) emailEl.textContent = admin.email || '-';
    if (phoneEl) phoneEl.textContent = admin.phone || '-';
    if (initialEl) initialEl.textContent = (admin.fullName || 'A').charAt(0).toUpperCase();
    
    const statusEl = document.getElementById('profileStatus');
    if (statusEl) {
        if (admin.status === 'active') {
            statusEl.textContent = '✅ Faol';
            statusEl.className = 'status-badge active';
        } else if (admin.status === 'blocked') {
            statusEl.textContent = '⛔ Bloklangan';
            statusEl.className = 'status-badge blocked';
        } else {
            statusEl.textContent = '❌ Faol emas';
            statusEl.className = 'status-badge inactive';
        }
    }
    
    const sub = admin.subscription || {};
    const subLabelEl = document.getElementById('profileSubscription');
    if (subLabelEl) {
        const now = new Date();
        const endDate = sub.endDate ? new Date(sub.endDate) : null;
        const isExpired = endDate && endDate < now;
        const isActive = sub.status === 'active' && !isExpired;
        if (isActive && sub.type !== 'none') {
            const typeMap = { 'monthly': 'Oylik', '6months': '6 oylik', 'yearly': 'Yillik', 'custom': 'Custom' };
            subLabelEl.textContent = '✅ ' + (typeMap[sub.type] || 'Faol');
            subLabelEl.className = 'subscription-badge monthly';
        } else if (isExpired && sub.type !== 'none') {
            subLabelEl.textContent = '⏰ Muddati tugagan';
            subLabelEl.className = 'subscription-badge expired';
        } else {
            subLabelEl.textContent = '❌ Obunasi yo\'q';
            subLabelEl.className = 'subscription-badge inactive';
        }
    }
    
    document.getElementById('profileSubType').textContent = sub.type || 'Yo\'q';
    document.getElementById('profileSubAmount').textContent = formatMoney(sub.amount || 0);
    
    const history = admin.paymentHistory || admin.subscriptionHistory || [];
    renderSubscriptionHistory(history);
}

// ============================================================
// ⭐ TO'LOV TARIXINI RENDER QILISH (RASM BILAN)
// ============================================================
function renderSubscriptionHistory(history) {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    if (!history || history.length === 0) {
        historyList.innerHTML = '<p class="text-muted">To\'lov tarixi yo\'q</p>';
        return;
    }
    
    const sortedHistory = [...history].sort((a, b) => {
        return new Date(b.purchaseDate) - new Date(a.purchaseDate);
    });
    
    historyList.innerHTML = sortedHistory.map((item, index) => {
        const startDate = item.startDate ? formatDateTimeFull(item.startDate) : '-';
        const endDate = item.endDate ? formatDateTimeFull(item.endDate) : '-';
        const now = new Date();
        const endDateTime = item.endDate ? new Date(item.endDate) : null;
        const isExpired = endDateTime && endDateTime < now;
        const isActive = item.status === 'active' && !isExpired;
        
        let statusLabel = '❌ Faol emas';
        let statusClass = 'inactive';
        let statusColor = '#ff3b30';
        if (isActive) { statusLabel = '✅ Faol'; statusClass = 'active'; statusColor = '#34c759'; }
        else if (isExpired) { statusLabel = '⏰ Muddati tugagan'; statusClass = 'expired'; statusColor = '#ff9500'; }
        
        const typeLabel = { 'monthly': '📅 Oylik', '6months': '📅 6 oylik', 'yearly': '📅 Yillik', 'custom': '⚙️ Custom' }[item.type] || item.type;
        const amount = item.amount || 0;
        const note = item.note ? `<p class="history-dates"><i class="fas fa-sticky-note"></i> ${item.note}</p>` : '';
        const purchaseDate = item.purchaseDate ? formatDateTimeFull(item.purchaseDate) : '-';
        
        // ⭐ TO'LOV USULI RASMI
        const paymentMethod = item.paymentMethod || 'cash';
        const methodInfo = PAYMENT_METHODS[paymentMethod] || PAYMENT_METHODS.cash;
        const methodDisplay = methodInfo ? `
            <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.7rem; color: var(--text-muted);">
                <img src="${methodInfo.icon}" style="width: 20px; height: 20px; object-fit: contain; border-radius: 4px; background: white; padding: 2px;" onerror="this.style.display='none'">
                ${methodInfo.name}
            </span>
        ` : '';
        
        return `
            <div class="history-item" style="border-left: 4px solid ${statusColor};">
                <div class="history-left">
                    <span class="history-number">#${index + 1}</span>
                    <div class="history-details">
                        <p class="history-type">
                            ${typeLabel} - ${formatMoney(amount)}
                            <span style="font-size: 0.7rem; margin-left: 8px;">
                                <span class="status-badge ${statusClass}" style="font-size: 0.7rem; padding: 2px 10px;">${statusLabel}</span>
                            </span>
                            ${methodDisplay}
                        </p>
                        <p class="history-dates"><i class="fas fa-calendar"></i> ${startDate} → ${endDate}</p>
                        <p class="history-dates"><i class="fas fa-shopping-cart"></i> Sotib olingan: ${purchaseDate}</p>
                        ${note}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================
// ⭐ TO'LOV USULI SELECT VA RASM
// ============================================================
function initPaymentMethodSelect() {
    const select = document.getElementById('paymentMethodSelect');
    const previewDiv = document.getElementById('paymentMethodPreview');
    if (!select || !previewDiv) return;
    
    const newSelect = select.cloneNode(true);
    select.parentNode.replaceChild(newSelect, select);
    
    newSelect.addEventListener('change', function() {
        const methodId = this.value;
        const method = PAYMENT_METHODS[methodId];
        if (method && methodId !== '') {
            previewDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--bg-hover); border-radius: 8px; border: 1px solid var(--border-color); margin-top: 8px; animation: fadeIn 0.3s ease;">
                    <img src="${method.icon}" alt="${method.name}" 
                         style="width: 40px; height: 40px; object-fit: contain; border-radius: 6px; background: white; padding: 4px;"
                         onerror="this.style.display='none'; this.parentElement.querySelector('.method-emoji').style.display='block';">
                    <span class="method-emoji" style="font-size: 1.5rem; display: none;">${method.emoji}</span>
                    <div>
                        <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-primary);">${method.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">To'lov usuli tanlandi</div>
                    </div>
                    <span style="margin-left: auto; color: var(--color-success);"><i class="fas fa-check-circle"></i></span>
                </div>
            `;
            previewDiv.style.display = 'block';
        } else {
            previewDiv.innerHTML = '';
            previewDiv.style.display = 'none';
        }
    });
}

// ============================================================
// ⭐ TO'LOV QO'SHISH MODAL
// ============================================================
function initPaymentModal() {
    const modal = document.getElementById('paymentModal');
    const addBtn = document.getElementById('addPaymentBtn');
    const closeBtn = document.getElementById('closePaymentModal');
    const cancelBtn = document.getElementById('cancelPaymentModal');
    const saveBtn = document.getElementById('savePaymentModal');
    const paymentType = document.getElementById('paymentType');
    const amountGroup = document.getElementById('paymentAmountGroup');
    const customGroup = document.getElementById('paymentCustomDurationGroup');
    
    if (!modal || !addBtn) return;
    
    const newAddBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newAddBtn, addBtn);
    
    newAddBtn.addEventListener('click', () => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('paymentType').value = 'monthly';
        document.getElementById('paymentAmount').value = '';
        document.getElementById('paymentCustomDays').value = '0';
        document.getElementById('paymentCustomHours').value = '0';
        document.getElementById('paymentCustomMinutes').value = '0';
        document.getElementById('paymentCustomSeconds').value = '0';
        document.getElementById('paymentStartDate').value = '';
        document.getElementById('paymentEndDate').value = '';
        document.getElementById('paymentNote').value = '';
        if (amountGroup) amountGroup.style.display = 'none';
        if (customGroup) customGroup.style.display = 'none';
        
        const select = document.getElementById('paymentMethodSelect');
        if (select) {
            select.value = '';
            const previewDiv = document.getElementById('paymentMethodPreview');
            if (previewDiv) {
                previewDiv.innerHTML = '';
                previewDiv.style.display = 'none';
            }
        }
        
        const now = new Date();
        document.getElementById('paymentStartDate').value = now.toISOString().slice(0, 16);
        initPaymentMethodSelect();
    });
    
    if (paymentType) {
        paymentType.addEventListener('change', function() {
            const isCustom = this.value === 'custom';
            if (amountGroup) amountGroup.style.display = isCustom ? 'block' : 'none';
            if (customGroup) customGroup.style.display = isCustom ? 'block' : 'none';
            if (!isCustom) {
                document.getElementById('paymentCustomDays').value = '0';
                document.getElementById('paymentCustomHours').value = '0';
                document.getElementById('paymentCustomMinutes').value = '0';
                document.getElementById('paymentCustomSeconds').value = '0';
                document.getElementById('paymentAmount').value = '';
            }
            calculatePaymentEndDate();
        });
    }
    
    const startDateInput = document.getElementById('paymentStartDate');
    if (startDateInput) {
        startDateInput.addEventListener('change', calculatePaymentEndDate);
        startDateInput.addEventListener('input', calculatePaymentEndDate);
    }
    
    ['paymentCustomDays', 'paymentCustomHours', 'paymentCustomMinutes', 'paymentCustomSeconds'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', calculatePaymentEndDate);
            el.addEventListener('input', calculatePaymentEndDate);
        }
    });
    
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', () => { modal.classList.remove('active'); document.body.style.overflow = ''; });
    }
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.addEventListener('click', () => { modal.classList.remove('active'); document.body.style.overflow = ''; });
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    if (saveBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.addEventListener('click', async () => { await savePayment(); });
    }
}

function calculatePaymentEndDate() {
    const paymentType = document.getElementById('paymentType').value;
    const startDate = document.getElementById('paymentStartDate').value;
    const endDateInput = document.getElementById('paymentEndDate');
    if (!startDate) { endDateInput.value = ''; return; }
    const start = new Date(startDate);
    if (isNaN(start.getTime())) { endDateInput.value = ''; return; }
    const end = new Date(start);
    if (paymentType === 'custom') {
        const days = parseInt(document.getElementById('paymentCustomDays').value) || 0;
        const hours = parseInt(document.getElementById('paymentCustomHours').value) || 0;
        const minutes = parseInt(document.getElementById('paymentCustomMinutes').value) || 0;
        const seconds = parseInt(document.getElementById('paymentCustomSeconds').value) || 0;
        if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) { endDateInput.value = ''; return; }
        end.setDate(end.getDate() + days);
        end.setHours(end.getHours() + hours);
        end.setMinutes(end.getMinutes() + minutes);
        end.setSeconds(end.getSeconds() + seconds);
    } else {
        const durationMap = { 'monthly': 30, '6months': 180, 'yearly': 365 };
        const days = durationMap[paymentType] || 0;
        if (days === 0) { endDateInput.value = ''; return; }
        end.setDate(end.getDate() + days);
    }
    endDateInput.value = end.toISOString().slice(0, 16);
}

// ============================================================
// ⭐ TO'LOVNI SAQLASH
// ============================================================
async function savePayment() {
    const paymentType = document.getElementById('paymentType').value;
    const amount = document.getElementById('paymentAmount').value.trim();
    const customDays = parseInt(document.getElementById('paymentCustomDays').value) || 0;
    const customHours = parseInt(document.getElementById('paymentCustomHours').value) || 0;
    const customMinutes = parseInt(document.getElementById('paymentCustomMinutes').value) || 0;
    const customSeconds = parseInt(document.getElementById('paymentCustomSeconds').value) || 0;
    const startDate = document.getElementById('paymentStartDate').value;
    const endDate = document.getElementById('paymentEndDate').value;
    const note = document.getElementById('paymentNote').value.trim();
    
    // ⭐ TO'LOV USULINI OLISH
    const paymentMethodSelect = document.getElementById('paymentMethodSelect');
    let paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : '';
    
    // Agar select dan kelmasa yoki "Boshqa" tanlangan bo'lsa, matn orqali aniqlash
    if (!paymentMethod || paymentMethod === 'other' || paymentMethod === '') {
        const detected = detectPaymentMethod(note);
        paymentMethod = detected.id;
        console.log('🔍 Avtomatik aniqlangan:', detected.name);
    }
    
    if (!paymentMethod || paymentMethod === '') {
        alert('❌ Iltimos, to\'lov usulini tanlang yoki izohda yozing!');
        if (paymentMethodSelect) paymentMethodSelect.focus();
        return;
    }
    
    if (paymentType === 'custom') {
        if (!amount || amount === '') { alert('❌ Iltimos, to\'lov miqdorini kiriting!'); document.getElementById('paymentAmount').focus(); return; }
        const amountNumber = parseInt(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) { alert('❌ To\'lov miqdori 0 dan katta bo\'lishi kerak!'); document.getElementById('paymentAmount').focus(); return; }
        if (customDays === 0 && customHours === 0 && customMinutes === 0 && customSeconds === 0) { alert('❌ Iltimos, custom vaqt uchun vaqt belgilang!'); document.getElementById('paymentCustomMinutes').focus(); return; }
    }
    if (paymentType !== 'none' && !startDate) { alert('❌ Iltimos, boshlanish sanasini tanlang!'); document.getElementById('paymentStartDate').focus(); return; }
    
    let customDuration = null;
    let amountNumber = 0;
    if (paymentType === 'custom') {
        customDuration = { days: customDays, hours: customHours, minutes: customMinutes, seconds: customSeconds };
        amountNumber = parseInt(amount) || 0;
    }
    let endDateTime = null;
    if (endDate) { endDateTime = new Date(endDate); if (isNaN(endDateTime.getTime())) { alert('❌ Noto\'g\'ri tugash vaqti formati!'); return; } }
    let startDateTime = null;
    if (startDate) { startDateTime = new Date(startDate); if (isNaN(startDateTime.getTime())) { alert('❌ Noto\'g\'ri boshlanish vaqti formati!'); return; } }
    
    const saveBtn = document.getElementById('savePaymentModal');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...';
    try {
        const response = await API.post(`/admins/${adminId}/payment`, {
            amount: amountNumber,
            subscriptionType: paymentType,
            customDuration: customDuration,
            endDate: endDateTime ? endDateTime.toISOString() : null,
            startDate: startDateTime ? startDateTime.toISOString() : null,
            note: note || 'Admin tomonidan qo\'shildi',
            paymentMethod: paymentMethod
        });
        if (response.success) {
            const methodName = PAYMENT_METHODS[paymentMethod]?.name || paymentMethod;
            alert(`✅ To\'lov muvaffaqiyatli qo\'shildi!\n💳 To\'lov usuli: ${methodName}`);
            document.getElementById('paymentModal').classList.remove('active');
            document.body.style.overflow = '';
            loadProfile();
        } else { alert('❌ Xatolik: ' + (response.message || 'Noma\'lum xatolik')); }
    } catch (error) { console.error('❌ Xatolik:', error); alert('❌ Xatolik: ' + error.message); }
    finally { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fas fa-save"></i> To\'lovni qo\'shish'; }
}

// ============================================================
// OBUNA SOTISH MODAL
// ============================================================
function initSubscriptionModal() {
    const modal = document.getElementById('subscriptionModal');
    const subscriptionBtn = document.getElementById('subscriptionBtn');
    if (!modal || !subscriptionBtn) return;
    
    const newBtn = subscriptionBtn.cloneNode(true);
    subscriptionBtn.parentNode.replaceChild(newBtn, subscriptionBtn);
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    const closeBtn = document.getElementById('closeSubscriptionModal');
    const cancelBtn = document.getElementById('cancelSubscriptionModal');
    const saveBtn = document.getElementById('saveSubscriptionModal');
    const typeSelect = document.getElementById('subscriptionTypeSelect');
    const customGroup = document.getElementById('subscriptionCustomDurationGroup');
    const amountGroup = document.getElementById('subscriptionAmountGroup');
    
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', function() { modal.classList.remove('active'); document.body.style.overflow = ''; });
    }
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.addEventListener('click', function() { modal.classList.remove('active'); document.body.style.overflow = ''; });
    }
    if (modal) {
        modal.addEventListener('click', function(e) { if (e.target === modal) { modal.classList.remove('active'); document.body.style.overflow = ''; } });
    }
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            const isCustom = this.value === 'custom';
            if (customGroup) customGroup.style.display = isCustom ? 'block' : 'none';
            if (amountGroup) amountGroup.style.display = isCustom ? 'block' : 'none';
        });
    }
    if (saveBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.addEventListener('click', async function() { await saveSubscription(); });
    }
}

async function saveSubscription() {
    const type = document.getElementById('subscriptionTypeSelect').value;
    const customDays = parseInt(document.getElementById('subscriptionCustomDays').value) || 0;
    const customHours = parseInt(document.getElementById('subscriptionCustomHours').value) || 0;
    const customMinutes = parseInt(document.getElementById('subscriptionCustomMinutes').value) || 0;
    const customSeconds = parseInt(document.getElementById('subscriptionCustomSeconds').value) || 0;
    const amount = document.getElementById('subscriptionAmount').value.trim();
    
    if (type === 'custom') {
        if (customDays === 0 && customHours === 0 && customMinutes === 0 && customSeconds === 0) { alert('❌ Custom vaqt uchun vaqt belgilang!'); return; }
        if (!amount || amount === '') { alert('❌ To\'lov miqdorini kiriting!'); document.getElementById('subscriptionAmount').focus(); return; }
        const amountNumber = parseInt(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) { alert('❌ To\'lov miqdori 0 dan katta bo\'lishi kerak!'); return; }
    }
    
    const saveBtn = document.getElementById('saveSubscriptionModal');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...';
    try {
        let customDuration = null;
        let amountNumber = 0;
        if (type === 'custom') { customDuration = { days: customDays, hours: customHours, minutes: customMinutes, seconds: customSeconds }; amountNumber = parseInt(amount) || 0; }
        const response = await API.put(`/admins/${adminId}/subscription`, {
            subscriptionType: type, customDuration: customDuration, amount: amountNumber
        });
        if (response.success) {
            const msg = type === 'monthly' ? 'Oylik' : type === '6months' ? '6 oylik' : type === 'yearly' ? 'Yillik' : type === 'custom' ? 'Custom' : 'Bekor qilindi';
            alert('✅ Obuna muvaffaqiyatli ' + msg + '!');
            document.getElementById('subscriptionModal').classList.remove('active');
            document.body.style.overflow = '';
            loadProfile();
        } else { alert('❌ Xatolik: ' + (response.message || 'Noma\'lum xatolik')); }
    } catch (error) { console.error('❌ Xatolik:', error); alert('❌ Xatolik: ' + error.message); }
    finally { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fas fa-save"></i> Saqlash'; }
}

// ============================================================
// XABAR YUBORISH MODAL
// ============================================================
function initNotificationModal() {
    const modal = document.getElementById('notificationModal');
    const sendBtn = document.getElementById('sendNotificationSubmitBtn');
    const profileSendBtn = document.getElementById('sendNotificationBtn');
    
    if (!modal || !sendBtn) return;
    
    if (profileSendBtn) {
        const newBtn = profileSendBtn.cloneNode(true);
        profileSendBtn.parentNode.replaceChild(newBtn, profileSendBtn);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            document.getElementById('notificationTitle').value = '';
            document.getElementById('notificationMessage').value = '';
            const resultDiv = document.getElementById('notificationResult');
            if (resultDiv) { resultDiv.style.display = 'none'; resultDiv.className = 'form-message'; }
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish';
            document.getElementById('notificationTitle').focus();
        });
    }
    
    const closeBtn = document.getElementById('closeNotificationModal');
    const cancelBtn = document.getElementById('cancelNotificationModal');
    
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', function() { modal.classList.remove('active'); document.body.style.overflow = ''; sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish'; });
    }
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.addEventListener('click', function() { modal.classList.remove('active'); document.body.style.overflow = ''; sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish'; });
    }
    if (modal) {
        modal.addEventListener('click', function(e) { if (e.target === modal) { modal.classList.remove('active'); document.body.style.overflow = ''; sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish'; } });
    }
    
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    newSendBtn.addEventListener('click', function(e) { e.preventDefault(); e.stopPropagation(); sendNotification(); });
}

async function sendNotification() {
    const titleInput = document.getElementById('notificationTitle');
    const messageInput = document.getElementById('notificationMessage');
    const sendBtn = document.getElementById('sendNotificationSubmitBtn');
    const resultDiv = document.getElementById('notificationResult');
    const title = titleInput ? titleInput.value.trim() : '';
    const message = messageInput ? messageInput.value.trim() : '';
    
    if (!title) {
        showNotificationResult('❌ Iltimos, sarlavhani kiriting!', 'error');
        titleInput.focus();
        return;
    }
    if (!message) {
        showNotificationResult('❌ Iltimos, xabar matnini kiriting!', 'error');
        messageInput.focus();
        return;
    }
    if (!adminId) {
        showNotificationResult('❌ Admin ID topilmadi!', 'error');
        return;
    }
    
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yuborilmoqda...';
    showNotificationResult('⏳ Xabar yuborilmoqda...', 'info');
    
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('https://admin-main-backend.onrender.com/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                title: title,
                message: message,
                type: 'info',
                recipientId: adminId,
                recipientRole: 'admin_customer',
                expiresInDays: 30
            })
        });
        const data = await response.json();
        if (response.ok && data.success) {
            showNotificationResult('✅ Xabar muvaffaqiyatli yuborildi!', 'success');
            titleInput.value = '';
            messageInput.value = '';
            loadNotifications();
            setTimeout(() => {
                document.getElementById('notificationModal').classList.remove('active');
                document.body.style.overflow = '';
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish';
            }, 2000);
        } else {
            showNotificationResult('❌ Xabar yuborishda xatolik: ' + (data.message || 'Noma\'lum xatolik'), 'error');
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish';
        }
    } catch (error) {
        showNotificationResult('❌ Xabar yuborishda xatolik: ' + error.message, 'error');
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish';
    }
}

function showNotificationResult(msg, type) {
    const resultDiv = document.getElementById('notificationResult');
    if (!resultDiv) return;
    resultDiv.textContent = msg;
    resultDiv.className = 'form-message ' + type;
    resultDiv.style.display = 'block';
}

// ============================================================
// BAN
// ============================================================
async function banAdmin(id) {
    if (!currentAdmin || currentAdmin.status === 'blocked') { alert('⚠️ Bu Admin Customer allaqachon bloklangan!'); return; }
    const reason = prompt('Bloklash sababini yozing:');
    if (reason === null) return;
    try {
        const result = await API.post(`/admins/${id}/ban`, { reason: reason?.trim() || 'Admin panelda cheklov' });
        if (result.success) {
            alert('✅ Admin Customer bloklandi!');
            loadProfile();
        }
    } catch (error) { alert('❌ Xatolik: ' + error.message); }
}

// ============================================================
// UNBAN
// ============================================================
function initUnbanModal() {
    const modal = document.getElementById('unbanModal');
    const unbanBtn = document.getElementById('unbanBtn');
    if (!modal || !unbanBtn) return;
    
    const newBtn = unbanBtn.cloneNode(true);
    unbanBtn.parentNode.replaceChild(newBtn, unbanBtn);
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (currentAdmin && currentAdmin.status !== 'blocked') { alert('⚠️ Bu Admin Customer bloklanmagan!'); return; }
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    const closeBtn = document.getElementById('closeUnbanModal');
    const cancelBtn = document.getElementById('cancelUnbanModal');
    const saveBtn = document.getElementById('saveUnbanModal');
    const paymentType = document.getElementById('unbanPaymentType');
    const customGroup = document.getElementById('unbanCustomDurationGroup');
    const amountGroup = document.getElementById('unbanAmountGroup');
    
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', function() { modal.classList.remove('active'); document.body.style.overflow = ''; });
    }
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.addEventListener('click', function() { modal.classList.remove('active'); document.body.style.overflow = ''; });
    }
    if (modal) {
        modal.addEventListener('click', function(e) { if (e.target === modal) { modal.classList.remove('active'); document.body.style.overflow = ''; } });
    }
    if (paymentType) {
        paymentType.addEventListener('change', function() {
            const isCustom = this.value === 'custom';
            if (customGroup) customGroup.style.display = isCustom ? 'block' : 'none';
            if (amountGroup) amountGroup.style.display = isCustom ? 'block' : 'none';
        });
    }
    if (saveBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.addEventListener('click', async function() { await saveUnbanWithPayment(); });
    }
}

async function saveUnbanWithPayment() {
    const paymentType = document.getElementById('unbanPaymentType').value;
    const customDays = parseInt(document.getElementById('unbanCustomDays').value) || 0;
    const customHours = parseInt(document.getElementById('unbanCustomHours').value) || 0;
    const customMinutes = parseInt(document.getElementById('unbanCustomMinutes').value) || 0;
    const customSeconds = parseInt(document.getElementById('unbanCustomSeconds').value) || 0;
    const startDate = document.getElementById('unbanStartDate').value;
    const endDate = document.getElementById('unbanEndDate').value;
    const amount = document.getElementById('unbanAmount').value.trim();

    if (paymentType === 'none') {
        if (!confirm('Haqiqatan ham bu Admin Customerni blokdan chiqarmoqchimisiz (obunasiz)?')) return;
        try {
            const result = await API.post(`/admins/${adminId}/unban`);
            if (result.success) {
                alert('✅ Admin Customer blokdan chiqarildi!');
                document.getElementById('unbanModal').classList.remove('active');
                document.body.style.overflow = '';
                loadProfile();
            }
        } catch (error) { alert('❌ Xatolik: ' + error.message); }
        return;
    }

    if (paymentType === 'custom') {
        if (customDays === 0 && customHours === 0 && customMinutes === 0 && customSeconds === 0) { alert('❌ Custom vaqt uchun vaqt belgilang!'); return; }
        if (!amount || amount === '') { alert('❌ To\'lov miqdorini kiriting!'); document.getElementById('unbanAmount').focus(); return; }
        const amountNumber = parseInt(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) { alert('❌ To\'lov miqdori 0 dan katta bo\'lishi kerak!'); return; }
    }
    if (!startDate) { alert('❌ Iltimos, boshlanish sanasini tanlang!'); document.getElementById('unbanStartDate').focus(); return; }

    const saveBtn = document.getElementById('saveUnbanModal');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...';
    try {
        const unbanResult = await API.post(`/admins/${adminId}/unban`);
        if (!unbanResult.success) { alert('❌ Blokdan chiqarishda xatolik'); saveBtn.disabled = false; return; }
        let customDuration = null;
        let amountNumber = 0;
        if (paymentType === 'custom') { customDuration = { days: customDays, hours: customHours, minutes: customMinutes, seconds: customSeconds }; amountNumber = parseInt(amount) || 0; }
        const paymentData = { amount: amountNumber, subscriptionType: paymentType, customDuration: customDuration, startDate: startDate || null, endDate: endDate || null, note: 'Blokdan chiqarishda qo\'shildi', paymentMethod: 'cash' };
        const paymentResult = await API.post(`/admins/${adminId}/payment`, paymentData);
        if (paymentResult.success) {
            alert('✅ Admin Customer blokdan chiqarildi va to\'lov qo\'shildi!');
            document.getElementById('unbanModal').classList.remove('active');
            document.body.style.overflow = '';
            loadProfile();
        } else { alert('❌ To\'lov qo\'shishda xatolik'); }
    } catch (error) { console.error('❌ Xatolik:', error); alert('❌ Xatolik: ' + error.message); }
    finally { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fas fa-unlock"></i> Blokdan chiqarish'; }
}

// ============================================================
// TUGMALAR
// ============================================================
function initButtons() {
    const banBtn = document.getElementById('banBtn');
    if (banBtn) {
        const newBtn = banBtn.cloneNode(true);
        banBtn.parentNode.replaceChild(newBtn, banBtn);
        newBtn.addEventListener('click', () => { if (!adminId) return; banAdmin(adminId); });
    }
    
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        const newBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newBtn, deleteBtn);
        newBtn.addEventListener('click', async () => {
            if (!confirm('Haqiqatan ham bu Admin Customerni o\'chirmoqchimisiz?')) return;
            try {
                const result = await API.delete(`/admins/${adminId}`);
                if (result.success) { alert('✅ Admin Customer o\'chirildi!'); window.location.href = 'admins.html'; }
            } catch (error) { alert('❌ Xatolik: ' + error.message); }
        });
    }
}

function showError(message) {
    const div = document.createElement('div');
    div.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999;padding:14px 18px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#dc2626;max-width:400px;box-shadow:0 10px 40px rgba(0,0,0,0.1);display:flex;align-items:center;gap:10px;font-size:0.85rem;`;
    div.innerHTML = `<i class="fas fa-exclamation-circle"></i><span>${message}</span><button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;color:#dc2626;cursor:pointer;font-size:1.1rem;">×</button>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 5000);
}

function showSuccess(message) {
    const div = document.createElement('div');
    div.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999;padding:14px 18px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;color:#065f46;max-width:400px;box-shadow:0 10px 40px rgba(0,0,0,0.1);display:flex;align-items:center;gap:10px;font-size:0.85rem;`;
    div.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span><button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;color:#065f46;cursor:pointer;font-size:1.1rem;">×</button>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

window.addEventListener('beforeunload', function() {
    if (countdownInterval) clearInterval(countdownInterval);
    if (notificationRefreshInterval) clearInterval(notificationRefreshInterval);
});

console.log('✅ admin-profile.js yuklandi (Admin-Main)');
