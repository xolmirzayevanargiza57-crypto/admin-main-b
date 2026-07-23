// ============================================================
// ADMIN PROFILE - TO'LIQ TUZATILGAN
// ============================================================

let adminId = null;
let currentAdmin = null;
let countdownInterval = null;
let notificationRefreshInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isAuthenticated()) { window.location.href = 'index.html'; return; }
    const params = new URLSearchParams(window.location.search);
    adminId = params.get('id');
    if (!adminId) { alert('Admin ID topilmadi!'); window.location.href = 'admins.html'; return; }
    loadProfile();
    loadNotifications();
    initEditModal();
    initPaymentModal();
    initSubscriptionModal(); // ⭐ Yangi modal
    initNotificationModal();
    initUnbanModal();
    initButtons();
    notificationRefreshInterval = setInterval(() => { loadNotifications(); }, 5000);

    const currentPasswordToggle = document.getElementById('currentPasswordToggle');
    if (currentPasswordToggle) {
        currentPasswordToggle.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            const input = document.getElementById('currentPasswordDisplay');
            if (input) {
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                const icon = this.querySelector('i');
                if (icon) icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        });
    }
    const editPasswordToggle = document.getElementById('editPasswordToggle');
    if (editPasswordToggle) {
        editPasswordToggle.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            const input = document.getElementById('editPassword');
            if (input) {
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                const icon = this.querySelector('i');
                if (icon) icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        });
    }
});

async function loadProfile() {
    try {
        const data = await API.get(`/admins/${adminId}`);
        if (data.success && data.data) {
            currentAdmin = data.data;
            renderProfile(currentAdmin);
            startCountdown();
        } else {
            showError('Ma\'lumotlar topilmadi');
        }
    } catch (error) {
        showError('Profil ma\'lumotlarini yuklashda xatolik: ' + error.message);
    }
}

function startCountdown() {
    if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    countdownInterval = setInterval(() => { updateCountdown(); }, 1000);
}

function updateCountdown() {
    const subEndEl = document.getElementById('profileSubEnd');
    if (!subEndEl || !currentAdmin) return;
    const sub = currentAdmin.subscription || {};
    if (!sub.endDate || sub.status !== 'active') { subEndEl.textContent = '-'; return; }
    const endDate = new Date(sub.endDate);
    const now = new Date();
    const diff = endDate - now;
    if (diff <= 0) { subEndEl.textContent = '⚠️ Vaqt tugagan!'; return; }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    subEndEl.textContent = `${formatDate(endDate)} (${days} kun ${hours}s ${minutes}m ${seconds}s qoldi)`;
}

function formatDate(date) {
    if (!date) return 'Noma\'lum vaqt';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Noma\'lum vaqt';
        const monthNames = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
        return `${d.getFullYear()}-yil ${d.getDate()}-${monthNames[d.getMonth()]} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    } catch (e) { return 'Noma\'lum vaqt'; }
}

// ============================================================
// ⭐ XABARLAR — SCROLL BILAN
// ============================================================
async function loadNotifications() {
    try {
        const data = await API.get('/notifications');
        if (data.success && data.data) renderNotifications(data.data);
        else {
            const container = document.getElementById('notificationsList');
            if (container) container.innerHTML = `<p class="text-muted">Xabarlar yuklanmadi</p>`;
        }
    } catch (error) {
        const container = document.getElementById('notificationsList');
        if (container) container.innerHTML = `<p class="text-muted">Xatolik: ${error.message}</p>`;
    }
}

function renderNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    const user = Auth.getUser();
    const isAdminMain = user?.role === 'admin_main';
    let filtered = notifications;
    if (!isAdminMain) {
        filtered = notifications.filter(n => n.recipientId === adminId || n.recipientRole === 'admin_customer' || n.recipientRole === 'all');
    }
    if (!filtered || filtered.length === 0) { container.innerHTML = '<p class="text-muted">Xabarlar yo\'q</p>'; return; }

    // ⭐ SCROLL: max-height va overflow-y
    container.style.maxHeight = '320px';
    container.style.overflowY = 'auto';
    container.style.paddingRight = '4px';

    container.innerHTML = filtered.map((item, index) => {
        const date = new Date(item.createdAt);
        const formattedDate = date.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const isRead = item.isRead ? '✅ O\'qilgan' : '🟡 O\'qilmagan';
        const isSentByMe = item.sentBy === user?._id;
        const senderName = item.sentByName || 'Admin';
        const recipientName = item.recipientName || 'Barcha adminlar';
        const canDelete = isAdminMain;
        const canMarkRead = !isAdminMain && !item.isRead && (item.recipientId === adminId || item.recipientRole === 'admin_customer');
        return `
            <div class="history-item" style="${!item.isRead ? 'border-left: 3px solid #007aff;' : ''}">
                <div class="history-left">
                    <span class="history-number">#${index + 1}</span>
                    <div class="history-details">
                        <p class="history-type">
                            <strong>${item.title || 'Xabar'}</strong>
                            <span style="font-size:0.7rem;color:var(--text-muted);">
                                ${isRead} • ${isSentByMe ? '✉️ Yuborgan: Men' : `✉️ Yuborgan: ${senderName}`}
                            </span>
                            <span style="font-size:0.7rem;color:var(--text-muted);margin-left:8px;">📬 Qabul qiluvchi: ${recipientName}</span>
                        </p>
                        <p class="history-dates">${item.message || ''}</p>
                        <p class="history-dates"><i class="fas fa-calendar"></i> ${formattedDate}</p>
                    </div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    ${canMarkRead ? `<button class="mark-read-btn" data-id="${item._id}" style="background:none;border:1px solid #007aff;color:#007aff;font-size:0.65rem;cursor:pointer;padding:3px 10px;border-radius:6px;">O'qildi</button>` : ''}
                    ${canDelete ? `<button class="delete-notification-btn" data-id="${item._id}" style="background:none;border:1px solid #ff3b30;color:#ff3b30;font-size:0.65rem;cursor:pointer;padding:3px 10px;border-radius:6px;"><i class="fas fa-trash"></i> O'chirish</button>` : ''}
                    ${item.isRead ? '<span style="font-size:0.65rem;color:var(--text-muted);">✓ O\'qilgan</span>' : ''}
                </div>
            </div>`;
    }).join('');

    document.querySelectorAll('.mark-read-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            try {
                const response = await API.post(`/notifications/${id}/read`);
                if (response.success) { showSuccess('Xabar o\'qilgan deb belgilandi!'); loadNotifications(); }
                else showError(response.message || 'Xatolik!');
            } catch (error) { showError('Xatolik!'); }
        });
    });

    document.querySelectorAll('.delete-notification-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            if (!confirm('Haqiqatan ham bu xabarni o\'chirmoqchimisiz?')) return;
            try {
                const response = await API.delete(`/notifications/${id}`);
                if (response.success) { showSuccess('Xabar o\'chirildi!'); loadNotifications(); }
                else showError(response.message || 'Xatolik!');
            } catch (error) { showError('Xatolik!'); }
        });
    });
}

// ============================================================
// PROFIL RENDER
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
        if (admin.status === 'active') { statusEl.textContent = '✅ Faol'; statusEl.className = 'status-badge active'; }
        else if (admin.status === 'blocked') { statusEl.textContent = '⛔ Bloklangan'; statusEl.className = 'status-badge blocked'; }
        else { statusEl.textContent = '❌ Faol emas'; statusEl.className = 'status-badge inactive'; }
    }

    const sub = admin.subscription || {};
    const subType = sub.type || 'none';
    const subStatus = sub.status || 'inactive';

    const subLabelEl = document.getElementById('profileSubscription');
    if (subLabelEl) {
        if (admin.status === 'active' && subType !== 'none' && subStatus === 'active') {
            const typeMap = { 'monthly': 'Oylik (299,999 so\'m)', '6months': '6 oylik (1,899,999 so\'m)', 'yearly': 'Yillik (3,599,999 so\'m)', 'custom': 'Custom obuna' };
            subLabelEl.textContent = '✅ ' + (typeMap[subType] || 'Faol');
            subLabelEl.className = 'subscription-badge monthly';
        } else {
            subLabelEl.textContent = '❌ Obunasi yo\'q';
            subLabelEl.className = 'subscription-badge inactive';
        }
    }

    const subTypeEl = document.getElementById('profileSubType');
    if (subTypeEl) {
        const typeMap = { 'monthly': 'Oylik (299,999 so\'m)', '6months': '6 oylik (1,899,999 so\'m)', 'yearly': 'Yillik (3,599,999 so\'m)', 'custom': 'Custom obuna', 'none': 'Yo\'q' };
        subTypeEl.textContent = typeMap[subType] || 'Yo\'q';
    }

    const subEndEl = document.getElementById('profileSubEnd');
    if (subEndEl) {
        if (sub.endDate && subStatus === 'active') {
            const endDate = new Date(sub.endDate);
            const diff = endDate - new Date();
            if (diff > 0) {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                subEndEl.textContent = `${formatDate(endDate)} (${days} kun ${hours}s ${minutes}m ${seconds}s qoldi)`;
            } else { subEndEl.textContent = '⚠️ Vaqt tugagan!'; }
        } else { subEndEl.textContent = '-'; }
    }

    const amountEl = document.getElementById('profileSubAmount');
    if (amountEl) amountEl.textContent = (sub.amount || 0).toLocaleString() + ' so\'m';

    renderSubscriptionHistory(admin.paymentHistory || admin.subscriptionHistory || []);
}

function renderSubscriptionHistory(history) {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    if (!history || history.length === 0) { historyList.innerHTML = '<p class="text-muted">To\'lov tarixi yo\'q</p>'; return; }
    historyList.innerHTML = history.slice(-10).reverse().map((item, index) => {
        const startDate = item.startDate ? formatDate(new Date(item.startDate)) : '-';
        const endDate = item.endDate ? formatDate(new Date(item.endDate)) : '-';
        const typeLabel = { 'monthly': 'Oylik', '6months': '6 oylik', 'yearly': 'Yillik', 'custom': 'Custom', 'none': 'Bekor qilindi' }[item.type] || item.type;
        const statusClass = item.status === 'active' ? 'active' : 'inactive';
        const statusText = item.status === 'active' ? '✅ Faol' : '❌ Tugagan';
        const note = item.note ? `<p class="history-dates"><i class="fas fa-sticky-note"></i> ${item.note}</p>` : '';
        return `
            <div class="history-item">
                <div class="history-left">
                    <span class="history-number">#${index + 1}</span>
                    <div class="history-details">
                        <p class="history-type">${typeLabel} - ${(item.amount || 0).toLocaleString()} so'm</p>
                        <p class="history-dates"><i class="fas fa-calendar"></i> ${startDate} → ${endDate}</p>
                        ${note}
                    </div>
                </div>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>`;
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
    if (editBtn) editBtn.addEventListener('click', () => { if (currentAdmin) openEditModal(); });
    if (closeEditBtn) closeEditBtn.addEventListener('click', () => { editModal.classList.remove('active'); document.body.style.overflow = ''; });
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => { editModal.classList.remove('active'); document.body.style.overflow = ''; });
    if (editModal) editModal.addEventListener('click', (e) => { if (e.target === editModal) { editModal.classList.remove('active'); document.body.style.overflow = ''; } });
    if (saveEditBtn) saveEditBtn.addEventListener('click', async () => { await saveEdit(); });
}

function openEditModal() {
    if (!currentAdmin) return;
    document.getElementById('editFullName').value = currentAdmin.fullName || '';
    document.getElementById('editEmail').value = currentAdmin.email || '';
    document.getElementById('editPhone').value = currentAdmin.phone || '';
    document.getElementById('editStatus').value = currentAdmin.status || 'active';
    document.getElementById('editPassword').value = '';
    const cp = document.getElementById('currentPasswordDisplay');
    if (cp) { cp.value = '••••••••••'; cp.type = 'password'; cp.dataset.oldPassword = currentAdmin.password || ''; }
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
        if (newPassword && newPassword.length >= 6) updateData.password = newPassword;
        else if (newPassword && newPassword.length < 6) { alert('Yangi parol kamida 6 ta belgi!'); return; }
        if (status === 'none') updateData.subscription = { type: 'none', status: 'inactive', startDate: null, endDate: null, amount: 0 };
        const response = await API.put(`/admins/${adminId}`, updateData);
        if (response.success) {
            alert('✅ Admin muvaffaqiyatli yangilandi!');
            document.getElementById('editModal').classList.remove('active');
            document.body.style.overflow = '';
            loadProfile();
        }
    } catch (error) { alert('❌ Xatolik: ' + error.message); }
}

// ============================================================
// ⭐ TO'LOV QO'SHISH MODAL — BOSHLANISH SANASI + CUSTOM DA NARX
// ============================================================
function initPaymentModal() {
    const modal = document.getElementById('paymentModal');
    const addBtn = document.getElementById('addPaymentBtn');
    const closeBtn = document.getElementById('closePaymentModal');
    const cancelBtn = document.getElementById('cancelPaymentModal');
    const saveBtn = document.getElementById('savePaymentModal');
    const paymentType = document.getElementById('paymentType');
    const customGroup = document.getElementById('customDurationGroup');
    const amountGroup = document.getElementById('paymentAmountGroup');
    if (!modal || !addBtn) return;

    function toggleAmountAndCustom() {
        const val = paymentType.value;
        // ⭐ To'lov miqdori faqat custom da ko'rinadi
        if (amountGroup) amountGroup.style.display = val === 'custom' ? 'block' : 'none';
        if (customGroup) customGroup.style.display = val === 'custom' ? 'block' : 'none';
    }

    addBtn.addEventListener('click', () => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('paymentAmount').value = '';
        document.getElementById('paymentType').value = 'monthly';
        document.getElementById('customDays').value = '0';
        document.getElementById('customHours').value = '0';
        document.getElementById('customMinutes').value = '0';
        document.getElementById('customSeconds').value = '0';
        document.getElementById('paymentEndDate').value = '';
        document.getElementById('paymentEndTime').value = '';
        document.getElementById('paymentNote').value = '';
        // Boshlanish sanasini hozirgi vaqtga o'rnat
        const now = new Date();
        const startInput = document.getElementById('paymentStartDate');
        if (startInput) {
            startInput.value = now.getFullYear() + '-' +
                String(now.getMonth()+1).padStart(2,'0') + '-' +
                String(now.getDate()).padStart(2,'0') + 'T' +
                String(now.getHours()).padStart(2,'0') + ':' +
                String(now.getMinutes()).padStart(2,'0');
        }
        toggleAmountAndCustom();
    });

    if (paymentType) paymentType.addEventListener('change', toggleAmountAndCustom);
    if (closeBtn) closeBtn.addEventListener('click', () => { modal.classList.remove('active'); document.body.style.overflow = ''; });
    if (cancelBtn) cancelBtn.addEventListener('click', () => { modal.classList.remove('active'); document.body.style.overflow = ''; });
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.remove('active'); document.body.style.overflow = ''; } });
    if (saveBtn) saveBtn.addEventListener('click', async () => { await savePayment(); });
}

async function savePayment() {
    const paymentType = document.getElementById('paymentType').value;
    const amount = document.getElementById('paymentAmount').value.trim();
    const customDays = parseInt(document.getElementById('customDays').value) || 0;
    const customHours = parseInt(document.getElementById('customHours').value) || 0;
    const customMinutes = parseInt(document.getElementById('customMinutes').value) || 0;
    const customSeconds = parseInt(document.getElementById('customSeconds').value) || 0;
    const endDate = document.getElementById('paymentEndDate').value;
    const endTime = document.getElementById('paymentEndTime').value;
    const startDateInput = document.getElementById('paymentStartDate');
    const note = document.getElementById('paymentNote').value.trim();

    // ⭐ Faqat custom da narx tekshiriladi
    if (paymentType === 'custom') {
        if (!amount || amount === '') { alert('❌ To\'lov miqdorini kiriting!'); document.getElementById('paymentAmount').focus(); return; }
        const amountNumber = parseInt(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) { alert('❌ To\'lov miqdori 0 dan katta bo\'lishi kerak!'); return; }
        if (customDays === 0 && customHours === 0 && customMinutes === 0 && customSeconds === 0) { alert('❌ Hech qanday vaqt belgilanmadi!'); return; }
    }

    let customDuration = null;
    let endDateTime = null;
    let startDateTime = null;

    if (paymentType === 'custom') customDuration = { days: customDays, hours: customHours, minutes: customMinutes, seconds: customSeconds };
    if (endDate && endTime) {
        endDateTime = new Date(`${endDate}T${endTime}`);
        if (isNaN(endDateTime.getTime())) { alert('❌ Noto\'g\'ri vaqt formati!'); return; }
    }
    if (startDateInput && startDateInput.value) {
        startDateTime = new Date(startDateInput.value);
        if (isNaN(startDateTime.getTime())) startDateTime = null;
    }

    // Narxni avtomatik qo'yish (custom bo'lmasa)
    let amountNumber = 0;
    if (paymentType === 'custom') {
        amountNumber = parseInt(amount) || 0;
    } else {
        const priceMap = { 'monthly': 299999, '6months': 1899999, 'yearly': 3599999 };
        amountNumber = priceMap[paymentType] || 0;
    }

    try {
        const response = await API.post(`/admins/${adminId}/payment`, {
            amount: amountNumber,
            subscriptionType: paymentType,
            customDuration,
            endDate: endDateTime ? endDateTime.toISOString() : null,
            startDate: startDateTime ? startDateTime.toISOString() : null,
            note: note || 'Admin tomonidan qo\'shildi'
        });
        if (response.success) {
            const sub = response.data.subscription || {};
            let msg = '✅ To\'lov muvaffaqiyatli qo\'shildi!\n';
            if (sub.endDate) msg += '📅 Tugash vaqti: ' + formatDate(new Date(sub.endDate));
            alert(msg);
            document.getElementById('paymentModal').classList.remove('active');
            document.body.style.overflow = '';
            loadProfile();
        }
    } catch (error) { alert('❌ Xatolik: ' + error.message); }
}

// ============================================================
// ⭐ OBUNA SOTISH MODAL (prompt o'rniga modal)
// ============================================================
function initSubscriptionModal() {
    const subscriptionBtn = document.getElementById('subscriptionBtn');
    if (!subscriptionBtn) return;

    subscriptionBtn.addEventListener('click', () => {
        // paymentModal ni ishlatamiz — bir xil
        const modal = document.getElementById('paymentModal');
        if (!modal) return;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('paymentAmount').value = '';
        document.getElementById('paymentType').value = 'monthly';
        document.getElementById('customDays').value = '0';
        document.getElementById('customHours').value = '0';
        document.getElementById('customMinutes').value = '0';
        document.getElementById('customSeconds').value = '0';
        document.getElementById('paymentEndDate').value = '';
        document.getElementById('paymentEndTime').value = '';
        document.getElementById('paymentNote').value = '';
        const now = new Date();
        const startInput = document.getElementById('paymentStartDate');
        if (startInput) {
            startInput.value = now.getFullYear() + '-' +
                String(now.getMonth()+1).padStart(2,'0') + '-' +
                String(now.getDate()).padStart(2,'0') + 'T' +
                String(now.getHours()).padStart(2,'0') + ':' +
                String(now.getMinutes()).padStart(2,'0');
        }
        // Custom group va amount ni toggle qil
        const amountGroup = document.getElementById('paymentAmountGroup');
        const customGroup = document.getElementById('customDurationGroup');
        if (amountGroup) amountGroup.style.display = 'none';
        if (customGroup) customGroup.style.display = 'none';
    });
}

// ============================================================
// XABAR YUBORISH MODAL
// ============================================================
function initNotificationModal() {
    const modal = document.getElementById('notificationModal');
    const sendBtn = document.getElementById('sendNotificationSubmitBtn');
    const closeBtn = document.getElementById('closeNotificationModal');
    const cancelBtn = document.getElementById('cancelNotificationModal');
    const titleInput = document.getElementById('notificationTitle');
    const messageInput = document.getElementById('notificationMessage');
    const resultDiv = document.getElementById('notificationResult');
    if (!modal || !sendBtn) return;
    const profileSendBtn = document.getElementById('sendNotificationBtn');
    if (profileSendBtn) {
        profileSendBtn.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (titleInput) titleInput.value = '';
            if (messageInput) messageInput.value = '';
            if (resultDiv) { resultDiv.style.display = 'none'; resultDiv.className = 'form-message'; }
            if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish'; }
            if (titleInput) titleInput.focus();
        });
    }
    if (closeBtn) closeBtn.addEventListener('click', () => { modal.classList.remove('active'); document.body.style.overflow = ''; });
    if (cancelBtn) cancelBtn.addEventListener('click', () => { modal.classList.remove('active'); document.body.style.overflow = ''; });
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.remove('active'); document.body.style.overflow = ''; } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('active')) { modal.classList.remove('active'); document.body.style.overflow = ''; } });
    if (sendBtn) sendBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); sendNotification(); });
}

async function sendNotification() {
    const titleInput = document.getElementById('notificationTitle');
    const messageInput = document.getElementById('notificationMessage');
    const sendBtn = document.getElementById('sendNotificationSubmitBtn');
    const title = titleInput ? titleInput.value.trim() : '';
    const message = messageInput ? messageInput.value.trim() : '';
    if (!title) { showNotificationResult('❌ Iltimos, sarlavhani kiriting!', 'error'); if (titleInput) titleInput.focus(); return; }
    if (!message) { showNotificationResult('❌ Iltimos, xabar matnini kiriting!', 'error'); if (messageInput) messageInput.focus(); return; }
    if (!adminId) { showNotificationResult('❌ Admin ID topilmadi!', 'error'); return; }
    if (sendBtn) { sendBtn.disabled = true; sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yuborilmoqda...'; }
    showNotificationResult('⏳ Xabar yuborilmoqda...', 'info');
    try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch('https://admin-main-backend.onrender.com/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title, message, type: 'info', recipientId: adminId, recipientRole: 'admin_customer', expiresInDays: 30 })
        });
        const data = await response.json();
        if (response.ok && data.success) {
            showNotificationResult('✅ Xabar muvaffaqiyatli yuborildi!', 'success');
            if (titleInput) titleInput.value = '';
            if (messageInput) messageInput.value = '';
            loadNotifications();
            setTimeout(() => {
                const modal = document.getElementById('notificationModal');
                if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
                if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish'; }
            }, 2000);
        } else {
            showNotificationResult('❌ Xatolik: ' + (data.message || 'Noma\'lum xatolik'), 'error');
            if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish'; }
        }
    } catch (error) {
        showNotificationResult('❌ Xatolik: ' + error.message, 'error');
        if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish'; }
    }
}

function showNotificationResult(msg, type) {
    const resultDiv = document.getElementById('notificationResult');
    if (!resultDiv) return;
    resultDiv.textContent = msg;
    resultDiv.className = 'form-message ' + type;
    resultDiv.style.display = 'block';
    setTimeout(() => { if (type !== 'success') resultDiv.style.display = 'none'; }, 6000);
}

// ============================================================
// BAN
// ============================================================
async function banAdmin(id) {
    const reason = prompt('Bloklash sababini yozing:');
    if (reason === null) return;
    try {
        const result = await API.post(`/admins/${id}/ban`, { reason: reason?.trim() || 'Admin panelda cheklov' });
        if (result.success) {
            alert(`✅ Admin Customer bloklandi!\n📌 Sabab: ${reason || 'Admin panelda cheklov'}\n📅 ${result.data?.formattedBannedAt || ''}`);
            loadProfile();
            loadNotifications();
        }
    } catch (error) { alert('❌ Xatolik: ' + error.message); }
}

// ============================================================
// ⭐ UNBAN MODAL
// ============================================================
function initUnbanModal() {
    const modal = document.getElementById('unbanModal');
    const unbanBtn = document.getElementById('unbanBtn');
    const closeBtn = document.getElementById('closeUnbanModal');
    const cancelBtn = document.getElementById('cancelUnbanModal');
    const saveBtn = document.getElementById('saveUnbanModal');
    const paymentType = document.getElementById('unbanPaymentType');
    const customGroup = document.getElementById('unbanCustomDurationGroup');
    const amountGroup = document.getElementById('unbanAmountGroup');
    if (!modal || !unbanBtn) return;

    unbanBtn.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('unbanPaymentType').value = 'monthly';
        document.getElementById('unbanCustomDays').value = '0';
        document.getElementById('unbanCustomHours').value = '0';
        document.getElementById('unbanCustomMinutes').value = '0';
        document.getElementById('unbanCustomSeconds').value = '0';
        document.getElementById('unbanEndDate').value = '';
        document.getElementById('unbanAmount').value = '';
        if (customGroup) customGroup.style.display = 'none';
        if (amountGroup) amountGroup.style.display = 'none';
        const now = new Date();
        const startInput = document.getElementById('unbanStartDate');
        if (startInput) {
            startInput.value = now.getFullYear() + '-' +
                String(now.getMonth()+1).padStart(2,'0') + '-' +
                String(now.getDate()).padStart(2,'0') + 'T' +
                String(now.getHours()).padStart(2,'0') + ':' +
                String(now.getMinutes()).padStart(2,'0');
        }
    });

    if (paymentType) {
        paymentType.addEventListener('change', function() {
            const val = this.value;
            if (customGroup) customGroup.style.display = val === 'custom' ? 'block' : 'none';
            // ⭐ To'lov miqdori faqat custom da
            if (amountGroup) amountGroup.style.display = val === 'custom' ? 'block' : 'none';
            const disabled = val === 'none';
            document.getElementById('unbanStartDate').disabled = disabled;
            document.getElementById('unbanEndDate').disabled = disabled;
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', () => { modal.classList.remove('active'); document.body.style.overflow = ''; });
    if (cancelBtn) cancelBtn.addEventListener('click', () => { modal.classList.remove('active'); document.body.style.overflow = ''; });
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.remove('active'); document.body.style.overflow = ''; } });
    if (saveBtn) saveBtn.addEventListener('click', async () => { await saveUnbanWithPayment(); });
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
                loadProfile(); loadNotifications();
            } else { alert('❌ Xatolik: ' + (result.message || 'Noma\'lum xatolik')); }
        } catch (error) { alert('❌ Xatolik: ' + error.message); }
        return;
    }

    if (paymentType === 'custom') {
        if (customDays === 0 && customHours === 0 && customMinutes === 0 && customSeconds === 0) { alert('❌ Custom vaqt uchun vaqt belgilang!'); return; }
        const amountNumber = parseInt(amount);
        if (!amount || isNaN(amountNumber) || amountNumber <= 0) { alert('❌ To\'lov miqdorini kiriting!'); return; }
    }

    const saveBtn = document.getElementById('saveUnbanModal');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...';

    try {
        const unbanResult = await API.post(`/admins/${adminId}/unban`);
        if (!unbanResult.success) {
            alert('❌ Blokdan chiqarishda xatolik: ' + (unbanResult.message || 'Noma\'lum xatolik'));
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-unlock"></i> Blokdan chiqarish va faollashtirish';
            return;
        }

        let customDuration = null;
        if (paymentType === 'custom') customDuration = { days: customDays, hours: customHours, minutes: customMinutes, seconds: customSeconds };

        // Narxni avtomatik qo'yish
        let amountNumber = 0;
        if (paymentType === 'custom') amountNumber = parseInt(amount) || 0;
        else { const priceMap = { 'monthly': 299999, '6months': 1899999, 'yearly': 3599999 }; amountNumber = priceMap[paymentType] || 0; }

        const paymentResult = await API.post(`/admins/${adminId}/payment`, {
            amount: amountNumber,
            subscriptionType: paymentType,
            customDuration,
            startDate: startDate || null,
            endDate: endDate || null,
            note: 'Blokdan chiqarishda qo\'shildi'
        });

        if (paymentResult.success) {
            alert('✅ Admin Customer blokdan chiqarildi va to\'lov qo\'shildi!');
            document.getElementById('unbanModal').classList.remove('active');
            document.body.style.overflow = '';
            loadProfile(); loadNotifications();
        } else { alert('❌ To\'lov qo\'shishda xatolik: ' + (paymentResult.message || 'Noma\'lum xatolik')); }
    } catch (error) {
        alert('❌ Xatolik: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-unlock"></i> Blokdan chiqarish va faollashtirish';
    }
}

// ============================================================
// TUGMALAR
// ============================================================
function initButtons() {
    const banBtn = document.getElementById('banBtn');
    if (banBtn) banBtn.addEventListener('click', () => { if (!adminId) return; banAdmin(adminId); });

    const unbanBtn = document.getElementById('unbanBtn');
    if (unbanBtn) {
        const newUnbanBtn = unbanBtn.cloneNode(true);
        unbanBtn.parentNode.replaceChild(newUnbanBtn, unbanBtn);
        initUnbanModal();
    }

    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!confirm('Haqiqatan ham bu Admin Customerni o\'chirmoqchimisiz?')) return;
            try {
                const result = await API.delete(`/admins/${adminId}`);
                if (result.success) { alert('✅ Admin Customer o\'chirildi!'); window.location.href = 'admins.html'; }
            } catch (error) { alert('❌ Xatolik: ' + error.message); }
        });
    }
}

function showError(message) {
    const container = document.querySelector('.profile-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size:3rem;color:var(--color-danger);margin-bottom:16px;"></i>
                <h3 style="color:var(--text-primary);margin-bottom:8px;">Xatolik yuz berdi</h3>
                <p style="color:var(--text-muted);">${message}</p>
                <button onclick="window.location.href='admins.html'" class="btn-primary" style="margin-top:16px;display:inline-flex;align-items:center;gap:8px;padding:12px 24px;">
                    <i class="fas fa-arrow-left"></i> Orqaga
                </button>
            </div>`;
    }
}

function showSuccess(message) {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:14px 18px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;color:#065f46;max-width:400px;box-shadow:0 10px 40px rgba(0,0,0,0.1);display:flex;align-items:center;gap:10px;font-size:0.85rem;';
    div.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span><button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;color:#065f46;cursor:pointer;font-size:1.1rem;">×</button>`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

window.addEventListener('beforeunload', function() {
    if (countdownInterval) clearInterval(countdownInterval);
    if (notificationRefreshInterval) clearInterval(notificationRefreshInterval);
});

console.log('✅ admin-profile.js yuklandi');
