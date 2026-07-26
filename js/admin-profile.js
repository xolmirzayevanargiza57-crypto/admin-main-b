// ============================================================
// ADMIN PROFILE - ADMIN-MAIN (TO'LIQ)
// Loyiha: Admin-Main Frontend
// Fayl: js/admin-profile.js
// ============================================================

let adminId = null;
let currentAdmin = null;
let countdownInterval = null;
let notificationRefreshInterval = null;
let profileLoadPromise = null;

// ============================================================
// ⭐ TO'LOV USULI MA'LUMOTLARI
// ============================================================
const PAYMENT_METHODS = {
    cash: {
        id: 'cash',
        name: 'Naqd pul',
        icon: 'https://www.gazeta.uz/sp/32221828/img/tild3365-3235-4161-a437-316637323436__banknoti-uzb.png',
        emoji: '💵'
    },
    click: {
        id: 'click',
        name: 'Click',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Click_uz_logo.svg/1200px-Click_uz_logo.svg.png',
        emoji: '📱'
    },
    paynet: {
        id: 'paynet',
        name: 'Paynet',
        icon: 'https://frankfurt.apollo.olxcdn.com/v1/files/qum4yr71mite1-UZ/image',
        emoji: '💳'
    },
    payme: {
        id: 'payme',
        name: 'Payme',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Paymeuz_logo.png',
        emoji: '📲'
    },
    uzum: {
        id: 'uzum',
        name: 'Uzum',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Uzum_Logo.svg/1200px-Uzum_Logo.svg.png',
        emoji: '🟣'
    }
};

// ============================================================
// ⭐ PULNI FORMATLASH (2 000 000 so'm)
// ============================================================
function formatMoney(amount) {
    if (!amount && amount !== 0) return '0 so\'m';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0 so\'m';
    const formatted = num.toLocaleString('uz-UZ');
    return formatted + ' so\'m';
}

// ============================================================
// ⭐ VAQTNI FORMATLASH (YYYY-MM-DD HH:MM:SS)
// ============================================================
function formatDateTimeFull(date) {
    if (!date) return 'Noma\'lum vaqt';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Noma\'lum vaqt';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
    
    // ⭐ PROFILNI TEZROQ YUKLASH (PARALLEL SO'ROVLAR)
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
    
    const currentPasswordToggle = document.getElementById('currentPasswordToggle');
    if (currentPasswordToggle) {
        currentPasswordToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const input = document.getElementById('currentPasswordDisplay');
            if (input) {
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
                }
            }
        });
    }
    
    const editPasswordToggle = document.getElementById('editPasswordToggle');
    if (editPasswordToggle) {
        editPasswordToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const input = document.getElementById('editPassword');
            if (input) {
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
                }
            }
        });
    }
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
    
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            const isSidebar = sidebar.contains(e.target);
            const isToggle = newToggle.contains(e.target);
            if (!isSidebar && !isToggle) {
                sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('show');
            }
        }
    });
}

// ============================================================
// PROFILNI YUKLASH (TEZLASHTIRILGAN)
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
// COUNTDOWN - REAL TIME
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
    
    const formattedDate = formatDateTimeFull(endDate);
    subEndEl.textContent = `${formattedDate} (${days} kun ${hours}s ${minutes}m ${seconds}s qoldi)`;
}

// ============================================================
// XABARLARNI YUKLASH
// ============================================================
async function loadNotifications() {
    try {
        const data = await API.get('/notifications');
        if (data.success && data.data) {
            renderNotifications(data.data);
        } else {
            const container = document.getElementById('notificationsList');
            if (container) {
                container.innerHTML = `<p class="text-muted">Xabarlar yuklanmadi</p>`;
            }
        }
    } catch (error) {
        console.error('❌ Xabarlarni yuklash xatosi:', error);
    }
}

// ============================================================
// XABARLARNI KO'RSATISH
// ============================================================
function renderNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    
    const user = Auth.getUser();
    const isAdminMain = user?.role === 'admin_main';
    
    let filteredNotifications = notifications.filter(n => {
        return n.recipientId === adminId;
    });
    
    if (!filteredNotifications || filteredNotifications.length === 0) {
        container.innerHTML = '<p class="text-muted" style="text-align: center; padding: 20px;">Xabarlar yo\'q</p>';
        return;
    }
    
    container.innerHTML = filteredNotifications.map((item, index) => {
        const formattedDate = formatDateTimeFull(item.createdAt);
        const isRead = item.isRead;
        const isSentByMe = item.sentBy === user?._id;
        const senderName = item.sentByName || 'Admin';
        const canDelete = isAdminMain;
        const shortMessage = item.message?.length > 300 ? item.message.substring(0, 300) + '...' : item.message;
        
        return `
            <div class="history-item ${isRead ? 'read' : 'unread'}" style="${!isRead ? 'border-left: 3px solid #007aff;' : ''}; display: flex; flex-direction: column; padding: 12px 16px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 8px;">
                <div style="display: flex; gap: 12px; align-items: flex-start; width: 100%;">
                    <span style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: var(--text-primary); color: var(--bg-primary); border-radius: 50%; font-size: 0.8rem; font-weight: 600; flex-shrink: 0;">${index + 1}</span>
                    <div style="flex: 1; min-width: 0;">
                        <p style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin-bottom: 4px;">
                            <strong style="font-size: 0.9rem;">${item.title || 'Xabar'}</strong>
                            <span style="font-size: 0.65rem; color: var(--text-muted);">
                                ${isRead ? '✅ O\'qilgan' : '🟡 O\'qilmagan'} • ${isSentByMe ? '✉️ Men' : `✉️ ${senderName}`}
                            </span>
                        </p>
                        <div style="max-height: 80px; overflow-y: auto; padding-right: 4px; margin: 4px 0;">
                            <p style="word-wrap: break-word; white-space: pre-wrap; margin: 0; font-size: 0.8rem; color: var(--text-secondary);">${shortMessage}</p>
                        </div>
                        <p style="font-size: 0.7rem; color: var(--text-muted); margin: 0;"><i class="fas fa-calendar"></i> ${formattedDate}</p>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color);">
                    ${canDelete ? `
                        <button class="delete-notification-btn" data-id="${item._id}" 
                                style="background: none; border: 1px solid #ff3b30; color: #ff3b30; font-size: 0.65rem; cursor: pointer; padding: 4px 12px; border-radius: 6px;">
                            <i class="fas fa-trash"></i> O'chirish
                        </button>
                    ` : ''}
                    ${isRead ? '<span style="font-size: 0.65rem; color: var(--text-muted);">✓ O\'qilgan</span>' : '<span style="font-size: 0.65rem; color: #ff9500;">⏳ O\'qilmagan</span>'}
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
// ⭐ PROFILNI RENDER QILISH (TO'LOV USULI RASMI BILAN)
// ============================================================
function renderProfile(admin) {
    console.log('🎨 Profil render qilinmoqda:', admin);
    
    // Asosiy ma'lumotlar
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const phoneEl = document.getElementById('profilePhone');
    const initialEl = document.getElementById('profileInitial');
    
    if (nameEl) nameEl.textContent = admin.fullName || '-';
    if (emailEl) emailEl.textContent = admin.email || '-';
    if (phoneEl) phoneEl.textContent = admin.phone || '-';
    if (initialEl) {
        initialEl.textContent = (admin.fullName || 'A').charAt(0).toUpperCase();
    }
    
    // Status
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
    
    // Obuna
    const sub = admin.subscription || {};
    const subType = sub.type || 'none';
    const subStatus = sub.status || 'inactive';
    const subLabelEl = document.getElementById('profileSubscription');
    if (subLabelEl) {
        const now = new Date();
        const endDate = sub.endDate ? new Date(sub.endDate) : null;
        const isExpired = endDate && endDate < now;
        const isActive = subStatus === 'active' && !isExpired;
        if (isActive && subType !== 'none') {
            const typeMap = { 'monthly': 'Oylik', '6months': '6 oylik', 'yearly': 'Yillik', 'custom': 'Custom' };
            subLabelEl.textContent = '✅ ' + (typeMap[subType] || 'Faol');
            subLabelEl.className = 'subscription-badge monthly';
        } else if (isExpired && subType !== 'none') {
            subLabelEl.textContent = '⏰ Muddati tugagan';
            subLabelEl.className = 'subscription-badge expired';
        } else {
            subLabelEl.textContent = '❌ Obunasi yo\'q';
            subLabelEl.className = 'subscription-badge inactive';
        }
    }
    
    // Obuna turi, muddati, to'lov
    const subTypeEl = document.getElementById('profileSubType');
    if (subTypeEl) {
        const typeMap = { 'monthly': 'Oylik', '6months': '6 oylik', 'yearly': 'Yillik', 'custom': 'Custom', 'none': 'Yo\'q' };
        subTypeEl.textContent = typeMap[subType] || 'Yo\'q';
    }
    
    const subEndEl = document.getElementById('profileSubEnd');
    if (subEndEl) {
        const now = new Date();
        const endDate = sub.endDate ? new Date(sub.endDate) : null;
        const isExpired = endDate && endDate < now;
        if (endDate && subStatus === 'active' && !isExpired) {
            const diff = endDate - now;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            subEndEl.textContent = `${formatDateTimeFull(endDate)} (${days} kun ${hours}s ${minutes}m ${seconds}s qoldi)`;
        } else if (isExpired && subType !== 'none') {
            subEndEl.textContent = `⏰ Muddati tugagan: ${formatDateTimeFull(endDate)}`;
        } else {
            subEndEl.textContent = '-';
        }
    }
    
    const amountEl = document.getElementById('profileSubAmount');
    if (amountEl) {
        amountEl.textContent = formatMoney(sub.amount || 0);
    }
    
    // To'lov tarixi
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
        const typeLabel = { 'monthly': '📅 Oylik', '6months': '📅 6 oylik', 'yearly': '📅 Yillik', 'custom': '⚙️ Custom', 'none': '❌ Bekor qilindi' }[item.type] || item.type;
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
// TAHRIRLASH MODAL
// ============================================================
function initEditModal() {
    const editModal = document.getElementById('editModal');
    const editBtn = document.getElementById('editBtn');
    const closeEditBtn = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEditModal');
    const saveEditBtn = document.getElementById('saveEditModal');
    
    if (editBtn) {
        const newEditBtn = editBtn.cloneNode(true);
        editBtn.parentNode.replaceChild(newEditBtn, editBtn);
        newEditBtn.addEventListener('click', () => { if (currentAdmin) openEditModal(); });
    }
    if (closeEditBtn) {
        const newCloseBtn = closeEditBtn.cloneNode(true);
        closeEditBtn.parentNode.replaceChild(newCloseBtn, closeEditBtn);
        newCloseBtn.addEventListener('click', () => { editModal.classList.remove('active'); document.body.style.overflow = ''; });
    }
    if (cancelEditBtn) {
        const newCancelBtn = cancelEditBtn.cloneNode(true);
        cancelEditBtn.parentNode.replaceChild(newCancelBtn, cancelEditBtn);
        newCancelBtn.addEventListener('click', () => { editModal.classList.remove('active'); document.body.style.overflow = ''; });
    }
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                editModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    if (saveEditBtn) {
        const newSaveBtn = saveEditBtn.cloneNode(true);
        saveEditBtn.parentNode.replaceChild(newSaveBtn, saveEditBtn);
        newSaveBtn.addEventListener('click', async () => { await saveEdit(); });
    }
}

function openEditModal() {
    if (!currentAdmin) return;
    document.getElementById('editFullName').value = currentAdmin.fullName || '';
    document.getElementById('editEmail').value = currentAdmin.email || '';
    document.getElementById('editPhone').value = currentAdmin.phone || '';
    document.getElementById('editStatus').value = currentAdmin.status || 'active';
    document.getElementById('editPassword').value = '';
    document.getElementById('editModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function saveEdit() {
    const fullName = document.getElementById('editFullName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const status = document.getElementById('editStatus').value;
    const newPassword = document.getElementById('editPassword').value.trim();
    if (!fullName || !email) { alert('F.I.SH va Email majburiy!'); return; }
    if (!email.includes('@')) { alert('Email noto\'g\'ri formatda!'); return; }
    try {
        const updateData = { fullName, email, phone, status: status === 'none' ? 'inactive' : status };
        if (newPassword && newPassword.length >= 6) {
            updateData.password = newPassword;
        } else if (newPassword && newPassword.length < 6) {
            alert('Yangi parol kamida 6 ta belgi bo\'lishi kerak!');
            return;
        }
        if (status === 'none') {
            updateData.subscription = { type: 'none', status: 'inactive', startDate: null, endDate: null, amount: 0 };
        }
        const response = await API.put(`/admins/${adminId}`, updateData);
        if (response.success) {
            alert('✅ Admin muvaffaqiyatli yangilandi!');
            document.getElementById('editModal').classList.remove('active');
            document.body.style.overflow = '';
            document.getElementById('editPassword').value = '';
            loadProfile();
        }
    } catch (error) {
        alert('❌ Xatolik: ' + error.message);
    }
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
    
    const paymentMethodSelect = document.getElementById('paymentMethodSelect');
    const paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : '';
    
    if (!paymentMethod || paymentMethod === '') {
        alert('❌ Iltimos, to\'lov usulini tanlang!');
        paymentMethodSelect.focus();
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
        document.getElementById('subscriptionTypeSelect').value = 'monthly';
        document.getElementById('subscriptionCustomDays').value = '0';
        document.getElementById('subscriptionCustomHours').value = '0';
        document.getElementById('subscriptionCustomMinutes').value = '0';
        document.getElementById('subscriptionCustomSeconds').value = '0';
        document.getElementById('subscriptionAmount').value = '';
        const customGroup = document.getElementById('subscriptionCustomDurationGroup');
        const amountGroup = document.getElementById('subscriptionAmountGroup');
        if (customGroup) customGroup.style.display = 'none';
        if (amountGroup) amountGroup.style.display = 'none';
    });
    
    const closeBtn = document.getElementById('closeSubscriptionModal');
    const cancelBtn = document.getElementById('cancelSubscriptionModal');
    const saveBtn = document.getElementById('saveSubscriptionModal');
    const typeSelect = document.getElementById('subscriptionTypeSelect');
    
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
            const customGroup = document.getElementById('subscriptionCustomDurationGroup');
            const amountGroup = document.getElementById('subscriptionAmountGroup');
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
// BAN / UNBAN
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
            loadNotifications();
        }
    } catch (error) { alert('❌ Xatolik: ' + error.message); }
}

// ============================================================
// UNBAN MODAL
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
        document.getElementById('unbanPaymentType').value = 'monthly';
        document.getElementById('unbanCustomDays').value = '0';
        document.getElementById('unbanCustomHours').value = '0';
        document.getElementById('unbanCustomMinutes').value = '0';
        document.getElementById('unbanCustomSeconds').value = '0';
        document.getElementById('unbanStartDate').value = '';
        document.getElementById('unbanEndDate').value = '';
        document.getElementById('unbanAmount').value = '';
        const customGroup = document.getElementById('unbanCustomDurationGroup');
        const amountGroup = document.getElementById('unbanAmountGroup');
        if (customGroup) customGroup.style.display = 'none';
        if (amountGroup) amountGroup.style.display = 'none';
        const now = new Date();
        document.getElementById('unbanStartDate').value = now.toISOString().slice(0, 16);
    });
    
    const closeBtn = document.getElementById('closeUnbanModal');
    const cancelBtn = document.getElementById('cancelUnbanModal');
    const saveBtn = document.getElementById('saveUnbanModal');
    const paymentType = document.getElementById('unbanPaymentType');
    
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
            const customGroup = document.getElementById('unbanCustomDurationGroup');
            const amountGroup = document.getElementById('unbanAmountGroup');
            if (customGroup) customGroup.style.display = isCustom ? 'block' : 'none';
            if (amountGroup) amountGroup.style.display = isCustom ? 'block' : 'none';
            if (this.value === 'none') {
                document.getElementById('unbanStartDate').disabled = true;
                document.getElementById('unbanEndDate').disabled = true;
            } else {
                document.getElementById('unbanStartDate').disabled = false;
                document.getElementById('unbanEndDate').disabled = false;
            }
        });
    }
    
    const startDateInput = document.getElementById('unbanStartDate');
    if (startDateInput) {
        startDateInput.addEventListener('change', calculateUnbanEndDate);
        startDateInput.addEventListener('input', calculateUnbanEndDate);
    }
    ['unbanCustomDays', 'unbanCustomHours', 'unbanCustomMinutes', 'unbanCustomSeconds'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', calculateUnbanEndDate);
            el.addEventListener('input', calculateUnbanEndDate);
        }
    });
    
    if (saveBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.addEventListener('click', async function() { await saveUnbanWithPayment(); });
    }
}

function calculateUnbanEndDate() {
    const paymentType = document.getElementById('unbanPaymentType').value;
    const startDate = document.getElementById('unbanStartDate').value;
    const endDateInput = document.getElementById('unbanEndDate');
    if (!startDate || paymentType === 'none') { endDateInput.value = ''; return; }
    const start = new Date(startDate);
    if (isNaN(start.getTime())) { endDateInput.value = ''; return; }
    const end = new Date(start);
    if (paymentType === 'custom') {
        const days = parseInt(document.getElementById('unbanCustomDays').value) || 0;
        const hours = parseInt(document.getElementById('unbanCustomHours').value) || 0;
        const minutes = parseInt(document.getElementById('unbanCustomMinutes').value) || 0;
        const seconds = parseInt(document.getElementById('unbanCustomSeconds').value) || 0;
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
                loadNotifications();
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
        if (!unbanResult.success) { alert('❌ Blokdan chiqarishda xatolik'); saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fas fa-unlock"></i> Blokdan chiqarish'; return; }
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
            loadNotifications();
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
    console.error('⚠️ Xatolik:', message);
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
