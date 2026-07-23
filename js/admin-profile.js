// ============================================================
// ADMIN PROFILE - Admin-Main Frontend (TO'LIQ)
// ============================================================

let adminId = null;
let currentAdmin = null;
let countdownInterval = null;
let notificationRefreshInterval = null;

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
    
    // ⭐ HAR 5 SONIYADA XABARLARNI YANGILASH (REAL-TIME)
    notificationRefreshInterval = setInterval(() => {
        loadNotifications();
    }, 5000);
    
    // Joriy parol toggle
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
// ⭐ COUNTDOWN - REAL TIME
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
    
    const formattedDate = formatDate(endDate);
    subEndEl.textContent = `${formattedDate} (${days} kun ${hours}s ${minutes}m ${seconds}s qoldi)`;
}

// ============================================================
// ⭐ DATE FORMAT FUNKSIYASI
// ============================================================
function formatDate(date) {
    if (!date) return 'Noma\'lum vaqt';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Noma\'lum vaqt';
        const year = d.getFullYear();
        const monthNames = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
        const month = monthNames[d.getMonth()];
        const day = d.getDate();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${year}-yil ${day}-${month} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
        return 'Noma\'lum vaqt';
    }
}

// ============================================================
// ⭐ XABARLARNI YUKLASH
// ============================================================
async function loadNotifications() {
    try {
        console.log('📨 Xabarlar yuklanmoqda...');
        const data = await API.get('/notifications');
        console.log('📨 Xabarlar javobi:', data);
        if (data.success && data.data) {
            renderNotifications(data.data);
        } else {
            const container = document.getElementById('notificationsList');
            if (container) {
                container.innerHTML = `<p class="text-muted">Xabarlar yuklanmadi: ${data.message || 'Noma\'lum xatolik'}</p>`;
            }
        }
    } catch (error) {
        console.error('❌ Xabarlarni yuklash xatosi:', error);
        const container = document.getElementById('notificationsList');
        if (container) {
            container.innerHTML = `<p class="text-muted">Xabarlarni yuklashda xatolik: ${error.message}</p>`;
        }
    }
}

// ============================================================
// ⭐ XABARLARNI KO'RSATISH (SCROLL QILINADI)
// ============================================================
function renderNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    if (!container) return;
    
    const user = Auth.getUser();
    const isAdminMain = user?.role === 'admin_main';
    
    // ⭐ TO'G'RI FILTRLASH: faqat o'sha adminId ga yuborilgan xabarlar
    let filteredNotifications = notifications.filter(n => {
        if (isAdminMain) {
            return n.recipientId === adminId;
        }
        return n.recipientId === adminId || 
               n.recipientRole === 'admin_customer' ||
               n.recipientRole === 'all';
    });
    
    if (!filteredNotifications || filteredNotifications.length === 0) {
        container.innerHTML = '<p class="text-muted">Xabarlar yo\'q</p>';
        return;
    }
    
    container.innerHTML = filteredNotifications.map((item, index) => {
        const date = new Date(item.createdAt);
        const formattedDate = date.toLocaleString('uz-UZ', {
            timeZone: 'Asia/Tashkent',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
        const isRead = item.isRead ? '✅ O\'qilgan' : '🟡 O\'qilmagan';
        const isSentByMe = item.sentBy === user?._id;
        const senderName = item.sentByName || 'Admin';
        const recipientName = item.recipientName || 'Barcha adminlar';
        
        const canDelete = isAdminMain;
        const canMarkRead = !isAdminMain && 
                           !item.isRead && 
                           (item.recipientId === adminId || item.recipientRole === 'admin_customer');
        
        return `
            <div class="history-item" style="${!item.isRead ? 'border-left: 3px solid #007aff;' : ''}">
                <div class="history-left">
                    <span class="history-number">#${index + 1}</span>
                    <div class="history-details">
                        <p class="history-type">
                            <strong>${item.title || 'Xabar'}</strong>
                            <span style="font-size: 0.7rem; color: var(--text-muted);">
                                ${isRead} • ${isSentByMe ? '✉️ Yuborgan: Men' : `✉️ Yuborgan: ${senderName}`}
                            </span>
                            <span style="font-size: 0.7rem; color: var(--text-muted); margin-left: 8px;">
                                📬 Qabul qiluvchi: ${recipientName}
                            </span>
                        </p>
                        <p class="history-dates" style="word-wrap: break-word; overflow-wrap: break-word; max-width: 100%;">${item.message || ''}</p>
                        <p class="history-dates"><i class="fas fa-calendar"></i> ${formattedDate}</p>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                    ${canMarkRead ? `
                        <button class="mark-read-btn" data-id="${item._id}" 
                                style="background: none; border: 1px solid #007aff; color: #007aff; font-size: 0.65rem; cursor: pointer; padding: 3px 10px; border-radius: 6px;">
                            O'qildi
                        </button>
                    ` : ''}
                    ${canDelete ? `
                        <button class="delete-notification-btn" data-id="${item._id}" 
                                style="background: none; border: 1px solid #ff3b30; color: #ff3b30; font-size: 0.65rem; cursor: pointer; padding: 3px 10px; border-radius: 6px;">
                            <i class="fas fa-trash"></i> O'chirish
                        </button>
                    ` : ''}
                    ${item.isRead ? '<span style="font-size: 0.65rem; color: var(--text-muted);">✓ O\'qilgan</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.mark-read-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            try {
                const response = await API.post(`/notifications/${id}/read`);
                if (response.success) {
                    showSuccess('Xabar o\'qilgan deb belgilandi!');
                    loadNotifications();
                } else {
                    showError(response.message || 'Xatolik yuz berdi!');
                }
            } catch (error) {
                console.error('❌ Xatolik:', error);
                showError('Xabarni o\'qilgan deb belgilashda xatolik!');
            }
        });
    });
    
    document.querySelectorAll('.delete-notification-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            if (!confirm('Haqiqatan ham bu xabarni o\'chirmoqchimisiz?')) return;
            try {
                const response = await API.delete(`/notifications/${id}`);
                if (response.success) {
                    showSuccess('Xabar o\'chirildi!');
                    loadNotifications();
                } else {
                    showError(response.message || 'Xatolik yuz berdi!');
                }
            } catch (error) {
                console.error('❌ Xatolik:', error);
                showError('Xabarni o\'chirishda xatolik!');
            }
        });
    });
}

// ============================================================
// PROFILNI RENDER QILISH
// ============================================================
function renderProfile(admin) {
    console.log('🎨 Profil render qilinmoqda:', admin);
    
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const phoneEl = document.getElementById('profilePhone');
    const initialEl = document.getElementById('profileInitial');
    
    if (nameEl) nameEl.textContent = admin.fullName || '-';
    if (emailEl) emailEl.textContent = admin.email || '-';
    if (phoneEl) phoneEl.textContent = admin.phone || '-';
    if (initialEl) {
        const initial = (admin.fullName || 'A').charAt(0).toUpperCase();
        initialEl.textContent = initial;
    }
    
    // STATUS
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
    
    // SUBSCRIPTION
    const sub = admin.subscription || {};
    const subType = sub.type || 'none';
    const subStatus = sub.status || 'inactive';
    
    const subLabelEl = document.getElementById('profileSubscription');
    if (subLabelEl) {
        if (admin.status === 'active' && subType !== 'none' && subStatus === 'active') {
            const typeMap = {
                'monthly': 'Oylik (299,999 so\'m)',
                '6months': '6 oylik (1,899,999 so\'m)',
                'yearly': 'Yillik (3,599,999 so\'m)',
                'custom': 'Custom obuna'
            };
            subLabelEl.textContent = '✅ ' + (typeMap[subType] || 'Faol');
            subLabelEl.className = 'subscription-badge monthly';
        } else {
            subLabelEl.textContent = '❌ Obunasi yo\'q';
            subLabelEl.className = 'subscription-badge inactive';
        }
    }
    
    // Obuna turi
    const subTypeEl = document.getElementById('profileSubType');
    if (subTypeEl) {
        const typeMap = {
            'monthly': 'Oylik (299,999 so\'m)',
            '6months': '6 oylik (1,899,999 so\'m)',
            'yearly': 'Yillik (3,599,999 so\'m)',
            'custom': 'Custom obuna',
            'none': 'Yo\'q'
        };
        subTypeEl.textContent = typeMap[subType] || 'Yo\'q';
    }
    
    // Obuna muddati
    const subEndEl = document.getElementById('profileSubEnd');
    if (subEndEl) {
        if (sub.endDate && subStatus === 'active') {
            const endDate = new Date(sub.endDate);
            const now = new Date();
            const diff = endDate - now;
            if (diff > 0) {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                const formattedDate = formatDate(endDate);
                subEndEl.textContent = `${formattedDate} (${days} kun ${hours}s ${minutes}m ${seconds}s qoldi)`;
            } else {
                subEndEl.textContent = '⚠️ Vaqt tugagan!';
            }
        } else {
            subEndEl.textContent = '-';
        }
    }
    
    // To'lov
    const amountEl = document.getElementById('profileSubAmount');
    if (amountEl) {
        const amount = sub.amount || 0;
        amountEl.textContent = amount.toLocaleString() + ' so\'m';
    }
    
    // To'lov tarixi
    const history = admin.paymentHistory || admin.subscriptionHistory || [];
    renderSubscriptionHistory(history);
}

function renderSubscriptionHistory(history) {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    if (!history || history.length === 0) {
        historyList.innerHTML = '<p class="text-muted">To\'lov tarixi yo\'q</p>';
        return;
    }
    historyList.innerHTML = history.slice(-10).reverse().map((item, index) => {
        const startDate = item.startDate ? formatDate(new Date(item.startDate)) : '-';
        const endDate = item.endDate ? formatDate(new Date(item.endDate)) : '-';
        const typeLabel = {
            'monthly': 'Oylik',
            '6months': '6 oylik',
            'yearly': 'Yillik',
            'custom': 'Custom',
            'none': 'Bekor qilindi'
        }[item.type] || item.type;
        const statusClass = item.status === 'active' ? 'active' : 'inactive';
        const statusText = item.status === 'active' ? '✅ Faol' : '❌ Tugagan';
        const amount = item.amount || 0;
        const note = item.note ? `<p class="history-dates"><i class="fas fa-sticky-note"></i> ${item.note}</p>` : '';
        return `
            <div class="history-item">
                <div class="history-left">
                    <span class="history-number">#${index + 1}</span>
                    <div class="history-details">
                        <p class="history-type">${typeLabel} - ${amount.toLocaleString()} so'm</p>
                        <p class="history-dates"><i class="fas fa-calendar"></i> ${startDate} → ${endDate}</p>
                        ${note}
                    </div>
                </div>
                <span class="status-badge ${statusClass}">${statusText}</span>
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
        editBtn.addEventListener('click', () => { if (currentAdmin) openEditModal(); });
    }
    if (closeEditBtn) {
        closeEditBtn.addEventListener('click', () => { editModal.classList.remove('active'); document.body.style.overflow = ''; });
    }
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => { editModal.classList.remove('active'); document.body.style.overflow = ''; });
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
        saveEditBtn.addEventListener('click', async () => { await saveEdit(); });
    }
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (saveEditBtn) saveEditBtn.click();
            }
        });
    }
}

function openEditModal() {
    if (!currentAdmin) return;
    document.getElementById('editFullName').value = currentAdmin.fullName || '';
    document.getElementById('editEmail').value = currentAdmin.email || '';
    document.getElementById('editPhone').value = currentAdmin.phone || '';
    document.getElementById('editStatus').value = currentAdmin.status || 'active';
    document.getElementById('editPassword').value = '';
    const currentPasswordDisplay = document.getElementById('currentPasswordDisplay');
    if (currentPasswordDisplay) {
        currentPasswordDisplay.value = '••••••••••';
        currentPasswordDisplay.type = 'password';
        currentPasswordDisplay.style.fontSize = '1.2rem';
        currentPasswordDisplay.style.letterSpacing = '2px';
        currentPasswordDisplay.dataset.oldPassword = currentAdmin.password || '';
    }
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
// ⭐ TO'LOV QO'SHISH MODAL (TUZATILGAN)
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
    
    addBtn.addEventListener('click', () => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // ⭐ DEFAULT QIYMATLAR
        document.getElementById('paymentType').value = 'monthly';
        document.getElementById('paymentAmount').value = '';
        document.getElementById('paymentCustomDays').value = '0';
        document.getElementById('paymentCustomHours').value = '0';
        document.getElementById('paymentCustomMinutes').value = '0';
        document.getElementById('paymentCustomSeconds').value = '0';
        document.getElementById('paymentStartDate').value = '';
        document.getElementById('paymentEndDate').value = '';
        document.getElementById('paymentNote').value = '';
        
        // ⭐ Custom ga tegishli maydonlarni yashirish
        if (amountGroup) amountGroup.style.display = 'none';
        if (customGroup) customGroup.style.display = 'none';
        
        // ⭐ Hozirgi vaqtni boshlanish sanasiga qo'yish
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('paymentStartDate').value = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
    });
    
    // ⭐ Payment type o'zgarganda
    if (paymentType) {
        paymentType.addEventListener('change', function() {
            const isCustom = this.value === 'custom';
            
            // ⭐ To'lov miqdori — faqat custom uchun
            if (amountGroup) {
                amountGroup.style.display = isCustom ? 'block' : 'none';
            }
            
            // ⭐ Vaqtni belgilash — faqat custom uchun
            if (customGroup) {
                customGroup.style.display = isCustom ? 'block' : 'none';
            }
            
            // ⭐ Custom bo'lmasa, vaqt maydonlarini tozalash
            if (!isCustom) {
                document.getElementById('paymentCustomDays').value = '0';
                document.getElementById('paymentCustomHours').value = '0';
                document.getElementById('paymentCustomMinutes').value = '0';
                document.getElementById('paymentCustomSeconds').value = '0';
                document.getElementById('paymentAmount').value = '';
            }
            
            // ⭐ Tugash sanasini avtomatik hisoblash
            calculatePaymentEndDate();
        });
    }
    
    // ⭐ Boshlanish sanasi o'zgarganda tugash sanasini hisoblash
    const startDateInput = document.getElementById('paymentStartDate');
    if (startDateInput) {
        startDateInput.addEventListener('change', function() {
            calculatePaymentEndDate();
        });
        startDateInput.addEventListener('input', function() {
            calculatePaymentEndDate();
        });
    }
    
    // ⭐ Custom vaqt o'zgarganda tugash sanasini hisoblash
    ['paymentCustomDays', 'paymentCustomHours', 'paymentCustomMinutes', 'paymentCustomSeconds'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', function() {
                calculatePaymentEndDate();
            });
            el.addEventListener('input', function() {
                calculatePaymentEndDate();
            });
        }
    });
    
    if (closeBtn) closeBtn.addEventListener('click', () => { modal.classList.remove('active'); document.body.style.overflow = ''; });
    if (cancelBtn) cancelBtn.addEventListener('click', () => { modal.classList.remove('active'); document.body.style.overflow = ''; });
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.remove('active'); document.body.style.overflow = ''; } });
    if (saveBtn) saveBtn.addEventListener('click', async () => { await savePayment(); });
}

// ============================================================
// ⭐ TO'LOV TUGASH SANASINI HISOBLASH (REAL-TIME)
// ============================================================
function calculatePaymentEndDate() {
    const paymentType = document.getElementById('paymentType').value;
    const startDate = document.getElementById('paymentStartDate').value;
    const endDateInput = document.getElementById('paymentEndDate');
    
    if (!startDate) {
        endDateInput.value = '';
        return;
    }
    
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
        endDateInput.value = '';
        return;
    }
    
    const end = new Date(start);
    
    // ⭐ Custom bo'lsa, qo'lda belgilangan vaqtni qo'shamiz
    if (paymentType === 'custom') {
        const days = parseInt(document.getElementById('paymentCustomDays').value) || 0;
        const hours = parseInt(document.getElementById('paymentCustomHours').value) || 0;
        const minutes = parseInt(document.getElementById('paymentCustomMinutes').value) || 0;
        const seconds = parseInt(document.getElementById('paymentCustomSeconds').value) || 0;
        
        if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
            endDateInput.value = '';
            return;
        }
        
        end.setDate(end.getDate() + days);
        end.setHours(end.getHours() + hours);
        end.setMinutes(end.getMinutes() + minutes);
        end.setSeconds(end.getSeconds() + seconds);
    } else {
        // ⭐ Monthly, 6months, yearly
        const durationMap = {
            'monthly': 30,
            '6months': 180,
            'yearly': 365
        };
        const days = durationMap[paymentType] || 0;
        if (days === 0) {
            endDateInput.value = '';
            return;
        }
        end.setDate(end.getDate() + days);
    }
    
    // ⭐ Format: YYYY-MM-DDTHH:mm
    const year = end.getFullYear();
    const month = String(end.getMonth() + 1).padStart(2, '0');
    const day = String(end.getDate()).padStart(2, '0');
    const hours = String(end.getHours()).padStart(2, '0');
    const minutes = String(end.getMinutes()).padStart(2, '0');
    
    endDateInput.value = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
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
    
    console.log('📤 To\'lov ma\'lumotlari:', { paymentType, amount, customDays, customHours, customMinutes, customSeconds, startDate, endDate, note });
    
    // ⭐ Custom bo'lsa, validatsiya
    if (paymentType === 'custom') {
        // To'lov miqdori majburiy
        if (!amount || amount === '') {
            alert('❌ Iltimos, to\'lov miqdorini kiriting!');
            document.getElementById('paymentAmount').focus();
            return;
        }
        const amountNumber = parseInt(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) {
            alert('❌ To\'lov miqdori 0 dan katta bo\'lishi kerak!');
            document.getElementById('paymentAmount').focus();
            return;
        }
        
        // Vaqt majburiy (hech bo'lmaganda bittasi 0 dan katta bo'lishi kerak)
        if (customDays === 0 && customHours === 0 && customMinutes === 0 && customSeconds === 0) {
            alert('❌ Iltimos, custom vaqt uchun vaqt belgilang (kun, soat, daqiqa yoki sekund)!');
            document.getElementById('paymentCustomMinutes').focus();
            return;
        }
    }
    
    // ⭐ Boshlanish sanasi majburiy (agar paymentType 'none' bo'lmasa)
    if (paymentType !== 'none' && !startDate) {
        alert('❌ Iltimos, boshlanish sanasini tanlang!');
        document.getElementById('paymentStartDate').focus();
        return;
    }
    
    // ⭐ Custom bo'lmasa, amount va vaqt kerak emas
    let customDuration = null;
    let amountNumber = 0;
    
    if (paymentType === 'custom') {
        customDuration = { 
            days: customDays, 
            hours: customHours, 
            minutes: customMinutes, 
            seconds: customSeconds 
        };
        amountNumber = parseInt(amount) || 0;
    } else {
        amountNumber = 0;
    }
    
    // ⭐ Tugash sanasi
    let endDateTime = null;
    if (endDate) {
        endDateTime = new Date(endDate);
        if (isNaN(endDateTime.getTime())) {
            alert('❌ Noto\'g\'ri tugash vaqti formati!');
            return;
        }
    }
    
    // ⭐ Boshlanish sanasi
    let startDateTime = null;
    if (startDate) {
        startDateTime = new Date(startDate);
        if (isNaN(startDateTime.getTime())) {
            alert('❌ Noto\'g\'ri boshlanish vaqti formati!');
            return;
        }
    }
    
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
            note: note || 'Admin tomonidan qo\'shildi'
        });
        
        if (response.success) {
            const sub = response.data.subscription || {};
            let msg = '✅ To\'lov muvaffaqiyatli qo\'shildi va admin faollashtirildi!\n';
            if (sub.endDate) {
                const end = new Date(sub.endDate);
                msg += '📅 Tugash vaqti: ' + formatDate(end);
            }
            alert(msg);
            document.getElementById('paymentModal').classList.remove('active');
            document.body.style.overflow = '';
            loadProfile();
        } else {
            alert('❌ Xatolik: ' + (response.message || 'Noma\'lum xatolik'));
        }
    } catch (error) {
        console.error('❌ Xatolik:', error);
        alert('❌ Xatolik: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> To\'lovni qo\'shish';
    }
}

// ============================================================
// ⭐ OBUNA SOTISH MODAL
// ============================================================
function initSubscriptionModal() {
    const modal = document.getElementById('subscriptionModal');
    const subscriptionBtn = document.getElementById('subscriptionBtn');
    const closeBtn = document.getElementById('closeSubscriptionModal');
    const cancelBtn = document.getElementById('cancelSubscriptionModal');
    const saveBtn = document.getElementById('saveSubscriptionModal');
    const typeSelect = document.getElementById('subscriptionTypeSelect');
    const customGroup = document.getElementById('subscriptionCustomDurationGroup');
    const amountGroup = document.getElementById('subscriptionAmountGroup');
    
    if (!modal || !subscriptionBtn) return;
    
    subscriptionBtn.addEventListener('click', function(e) {
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
        if (customGroup) customGroup.style.display = 'none';
        if (amountGroup) amountGroup.style.display = 'none';
    });
    
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            const isCustom = this.value === 'custom';
            if (customGroup) {
                customGroup.style.display = isCustom ? 'block' : 'none';
            }
            if (amountGroup) {
                amountGroup.style.display = isCustom ? 'block' : 'none';
            }
        });
    }
    
    if (closeBtn) closeBtn.addEventListener('click', function() { modal.classList.remove('active'); document.body.style.overflow = ''; });
    if (cancelBtn) cancelBtn.addEventListener('click', function() { modal.classList.remove('active'); document.body.style.overflow = ''; });
    if (modal) modal.addEventListener('click', function(e) { if (e.target === modal) { modal.classList.remove('active'); document.body.style.overflow = ''; } });
    if (saveBtn) saveBtn.addEventListener('click', async function() { await saveSubscription(); });
}

async function saveSubscription() {
    const type = document.getElementById('subscriptionTypeSelect').value;
    const customDays = parseInt(document.getElementById('subscriptionCustomDays').value) || 0;
    const customHours = parseInt(document.getElementById('subscriptionCustomHours').value) || 0;
    const customMinutes = parseInt(document.getElementById('subscriptionCustomMinutes').value) || 0;
    const customSeconds = parseInt(document.getElementById('subscriptionCustomSeconds').value) || 0;
    const amount = document.getElementById('subscriptionAmount').value.trim();
    
    if (type === 'custom') {
        if (customDays === 0 && customHours === 0 && customMinutes === 0 && customSeconds === 0) {
            alert('❌ Custom vaqt uchun vaqt belgilang!');
            return;
        }
        if (!amount || amount === '') { 
            alert('❌ To\'lov miqdorini kiriting!'); 
            document.getElementById('subscriptionAmount').focus(); 
            return; 
        }
        const amountNumber = parseInt(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) { 
            alert('❌ To\'lov miqdori 0 dan katta bo\'lishi kerak!'); 
            return; 
        }
    }
    
    const saveBtn = document.getElementById('saveSubscriptionModal');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...';
    
    try {
        let customDuration = null;
        let amountNumber = 0;
        
        if (type === 'custom') {
            customDuration = { days: customDays, hours: customHours, minutes: customMinutes, seconds: customSeconds };
            amountNumber = parseInt(amount) || 0;
        }
        
        const response = await API.put(`/admins/${adminId}/subscription`, {
            subscriptionType: type,
            customDuration: customDuration,
            amount: amountNumber
        });
        
        if (response.success) {
            const msg = type === 'monthly' ? 'Oylik' : type === '6months' ? '6 oylik' : type === 'yearly' ? 'Yillik' : type === 'custom' ? 'Custom' : 'Bekor qilindi';
            alert('✅ Obuna muvaffaqiyatli ' + msg + '!');
            document.getElementById('subscriptionModal').classList.remove('active');
            document.body.style.overflow = '';
            loadProfile();
        } else {
            alert('❌ Xatolik: ' + (response.message || 'Noma\'lum xatolik'));
        }
    } catch (error) {
        console.error('❌ Xatolik:', error);
        alert('❌ Xatolik: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Saqlash';
    }
}

// ============================================================
// ⭐ XABAR YUBORISH MODAL
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
            e.preventDefault();
            e.stopPropagation();
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (titleInput) titleInput.value = '';
            if (messageInput) messageInput.value = '';
            if (resultDiv) { resultDiv.style.display = 'none'; resultDiv.className = 'form-message'; }
            if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish'; }
            if (titleInput) titleInput.focus();
        });
    }
    
    if (closeBtn) closeBtn.addEventListener('click', function() { 
        modal.classList.remove('active'); 
        document.body.style.overflow = ''; 
        if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish'; } 
    });
    
    if (cancelBtn) cancelBtn.addEventListener('click', function() { 
        modal.classList.remove('active'); 
        document.body.style.overflow = ''; 
        if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish'; } 
    });
    
    if (modal) modal.addEventListener('click', function(e) { 
        if (e.target === modal) { 
            modal.classList.remove('active'); 
            document.body.style.overflow = ''; 
            if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish'; } 
        } 
    });
    
    document.addEventListener('keydown', function(e) { 
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) { 
            modal.classList.remove('active'); 
            document.body.style.overflow = ''; 
            if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish'; } 
        } 
    });
    
    if (messageInput) messageInput.addEventListener('keydown', function(e) { 
        if (e.key === 'Enter' && e.ctrlKey) { 
            e.preventDefault(); 
            sendNotification(); 
        } 
    });
    
    if (sendBtn) sendBtn.addEventListener('click', function(e) { 
        e.preventDefault(); 
        e.stopPropagation(); 
        sendNotification(); 
    });
}

async function sendNotification() {
    const titleInput = document.getElementById('notificationTitle');
    const messageInput = document.getElementById('notificationMessage');
    const sendBtn = document.getElementById('sendNotificationSubmitBtn');
    const resultDiv = document.getElementById('notificationResult');
    const title = titleInput ? titleInput.value.trim() : '';
    const message = messageInput ? messageInput.value.trim() : '';
    
    console.log('🔍 Title:', title);
    console.log('🔍 Message:', message);
    console.log('🔍 Admin ID:', adminId);
    
    if (!title) { 
        showNotificationResult('❌ Iltimos, sarlavhani kiriting!', 'error'); 
        if (titleInput) titleInput.focus(); 
        return; 
    }
    
    if (!message) { 
        showNotificationResult('❌ Iltimos, xabar matnini kiriting!', 'error'); 
        if (messageInput) messageInput.focus(); 
        return; 
    }
    
    if (!adminId) { 
        showNotificationResult('❌ Admin ID topilmadi!', 'error'); 
        return; 
    }
    
    if (sendBtn) { 
        sendBtn.disabled = true; 
        sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yuborilmoqda...'; 
    }
    
    showNotificationResult('⏳ Xabar yuborilmoqda...', 'info');
    
    try {
        const token = localStorage.getItem('adminToken');
        const API_URL = 'https://admin-main-backend.onrender.com/api/notifications';
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
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
        console.log('📨 API javobi:', data);
        
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
            showNotificationResult('❌ Xabar yuborishda xatolik: ' + (data.message || 'Noma\'lum xatolik'), 'error');
            if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish'; }
        }
    } catch (error) {
        console.error('❌ Xabar yuborish xatosi:', error);
        showNotificationResult('❌ Xabar yuborishda xatolik: ' + (error.message || 'Server xatosi!'), 'error');
        if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish'; }
    }
}

function showNotificationResult(msg, type) {
    const resultDiv = document.getElementById('notificationResult');
    if (!resultDiv) return;
    resultDiv.textContent = msg;
    resultDiv.className = 'form-message ' + type;
    resultDiv.style.display = 'block';
    setTimeout(() => { 
        if (type !== 'success') { 
            resultDiv.style.display = 'none'; 
        } 
    }, 6000);
}

// ============================================================
// ⭐ BAN / UNBAN
// ============================================================
async function banAdmin(id) {
    if (!currentAdmin) return;
    
    if (currentAdmin.status === 'blocked') {
        alert('⚠️ Bu Admin Customer allaqachon bloklangan!');
        return;
    }
    
    const reason = prompt('Bloklash sababini yozing:');
    if (reason === null) return;
    
    try {
        const result = await API.post(`/admins/${id}/ban`, { reason: reason?.trim() || 'Admin panelda cheklov' });
        if (result.success) {
            const msg = result.data?.formattedBannedAt 
                ? `✅ Admin Customer bloklandi!\n📌 Sabab: ${reason || 'Admin panelda cheklov'}\n📅 Bloklangan vaqt: ${result.data.formattedBannedAt}`
                : `✅ Admin Customer bloklandi!\n📌 Sabab: ${reason || 'Admin panelda cheklov'}`;
            alert(msg);
            loadProfile();
            loadNotifications();
        }
    } catch (error) {
        alert('❌ Xatolik: ' + error.message);
    }
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
        e.preventDefault();
        e.stopPropagation();
        
        if (currentAdmin && currentAdmin.status !== 'blocked') {
            alert('⚠️ Bu Admin Customer bloklanmagan!');
            return;
        }
        
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
        if (customGroup) customGroup.style.display = 'none';
        if (amountGroup) amountGroup.style.display = 'none';
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('unbanStartDate').value = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
    });

    if (paymentType) {
        paymentType.addEventListener('change', function() {
            const isCustom = this.value === 'custom';
            if (customGroup) {
                customGroup.style.display = isCustom ? 'block' : 'none';
            }
            if (amountGroup) {
                amountGroup.style.display = isCustom ? 'block' : 'none';
            }
            if (this.value === 'none') {
                document.getElementById('unbanStartDate').disabled = true;
                document.getElementById('unbanEndDate').disabled = true;
            } else {
                document.getElementById('unbanStartDate').disabled = false;
                document.getElementById('unbanEndDate').disabled = false;
            }
        });
    }

    // ⭐ Boshlanish sanasi o'zgarganda tugash sanasini hisoblash
    const startDateInput = document.getElementById('unbanStartDate');
    if (startDateInput) {
        startDateInput.addEventListener('change', function() {
            calculateUnbanEndDate();
        });
        startDateInput.addEventListener('input', function() {
            calculateUnbanEndDate();
        });
    }
    
    // ⭐ Custom vaqt o'zgarganda tugash sanasini hisoblash
    ['unbanCustomDays', 'unbanCustomHours', 'unbanCustomMinutes', 'unbanCustomSeconds'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', function() {
                calculateUnbanEndDate();
            });
            el.addEventListener('input', function() {
                calculateUnbanEndDate();
            });
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            await saveUnbanWithPayment();
        });
    }
}

// ============================================================
// ⭐ UNBAN TUGASH SANASINI HISOBLASH
// ============================================================
function calculateUnbanEndDate() {
    const paymentType = document.getElementById('unbanPaymentType').value;
    const startDate = document.getElementById('unbanStartDate').value;
    const endDateInput = document.getElementById('unbanEndDate');
    
    if (!startDate || paymentType === 'none') {
        endDateInput.value = '';
        return;
    }
    
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
        endDateInput.value = '';
        return;
    }
    
    const end = new Date(start);
    
    if (paymentType === 'custom') {
        const days = parseInt(document.getElementById('unbanCustomDays').value) || 0;
        const hours = parseInt(document.getElementById('unbanCustomHours').value) || 0;
        const minutes = parseInt(document.getElementById('unbanCustomMinutes').value) || 0;
        const seconds = parseInt(document.getElementById('unbanCustomSeconds').value) || 0;
        
        if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
            endDateInput.value = '';
            return;
        }
        
        end.setDate(end.getDate() + days);
        end.setHours(end.getHours() + hours);
        end.setMinutes(end.getMinutes() + minutes);
        end.setSeconds(end.getSeconds() + seconds);
    } else {
        const durationMap = {
            'monthly': 30,
            '6months': 180,
            'yearly': 365
        };
        const days = durationMap[paymentType] || 0;
        if (days === 0) {
            endDateInput.value = '';
            return;
        }
        end.setDate(end.getDate() + days);
    }
    
    const year = end.getFullYear();
    const month = String(end.getMonth() + 1).padStart(2, '0');
    const day = String(end.getDate()).padStart(2, '0');
    const hours = String(end.getHours()).padStart(2, '0');
    const minutes = String(end.getMinutes()).padStart(2, '0');
    
    endDateInput.value = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
}

// ============================================================
// ⭐ UNBAN + TO'LOV QO'SHISH (BIR VAQTDA)
// ============================================================
async function saveUnbanWithPayment() {
    const paymentType = document.getElementById('unbanPaymentType').value;
    const customDays = parseInt(document.getElementById('unbanCustomDays').value) || 0;
    const customHours = parseInt(document.getElementById('unbanCustomHours').value) || 0;
    const customMinutes = parseInt(document.getElementById('unbanCustomMinutes').value) || 0;
    const customSeconds = parseInt(document.getElementById('unbanCustomSeconds').value) || 0;
    const startDate = document.getElementById('unbanStartDate').value;
    const endDate = document.getElementById('unbanEndDate').value;
    const amount = document.getElementById('unbanAmount').value.trim();

    // ⭐ Agar paymentType 'none' bo'lsa, faqat unban qilamiz
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
            } else {
                alert('❌ Xatolik: ' + (result.message || 'Noma\'lum xatolik'));
            }
        } catch (error) {
            alert('❌ Xatolik: ' + error.message);
        }
        return;
    }

    // ⭐ Custom bo'lsa, vaqt va amount majburiy
    if (paymentType === 'custom') {
        if (customDays === 0 && customHours === 0 && customMinutes === 0 && customSeconds === 0) {
            alert('❌ Custom vaqt uchun vaqt belgilang!');
            return;
        }
        if (!amount || amount === '') { 
            alert('❌ To\'lov miqdorini kiriting!'); 
            document.getElementById('unbanAmount').focus(); 
            return; 
        }
        const amountNumber = parseInt(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) { 
            alert('❌ To\'lov miqdori 0 dan katta bo\'lishi kerak!'); 
            return; 
        }
    }

    // ⭐ Boshlanish sanasi majburiy
    if (!startDate) {
        alert('❌ Iltimos, boshlanish sanasini tanlang!');
        document.getElementById('unbanStartDate').focus();
        return;
    }

    const saveBtn = document.getElementById('saveUnbanModal');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...';

    try {
        // ⭐ 1. Avval Unban qilamiz
        const unbanResult = await API.post(`/admins/${adminId}/unban`);
        if (!unbanResult.success) {
            alert('❌ Blokdan chiqarishda xatolik: ' + (unbanResult.message || 'Noma\'lum xatolik'));
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-unlock"></i> Blokdan chiqarish va faollashtirish';
            return;
        }

        // ⭐ 2. Keyin to'lov qo'shamiz
        let customDuration = null;
        let amountNumber = 0;
        
        if (paymentType === 'custom') {
            customDuration = { days: customDays, hours: customHours, minutes: customMinutes, seconds: customSeconds };
            amountNumber = parseInt(amount) || 0;
        }

        const paymentData = {
            amount: amountNumber,
            subscriptionType: paymentType,
            customDuration: customDuration,
            startDate: startDate || null,
            endDate: endDate || null,
            note: 'Blokdan chiqarishda qo\'shildi'
        };

        const paymentResult = await API.post(`/admins/${adminId}/payment`, paymentData);

        if (paymentResult.success) {
            alert('✅ Admin Customer blokdan chiqarildi va to\'lov qo\'shildi!');
            document.getElementById('unbanModal').classList.remove('active');
            document.body.style.overflow = '';
            loadProfile();
            loadNotifications();
        } else {
            alert('❌ To\'lov qo\'shishda xatolik: ' + (paymentResult.message || 'Noma\'lum xatolik'));
        }
    } catch (error) {
        console.error('❌ Xatolik:', error);
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
    
    const subscriptionBtn = document.getElementById('subscriptionBtn');
    if (subscriptionBtn) {
        const newSubscriptionBtn = subscriptionBtn.cloneNode(true);
        subscriptionBtn.parentNode.replaceChild(newSubscriptionBtn, subscriptionBtn);
        initSubscriptionModal();
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
    console.error('⚠️ Xatolik:', message);
    const container = document.querySelector('.profile-container');
    if (container) {
        container.innerHTML = `
            <div class="error-card" style="text-align: center; padding: 40px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--color-danger); margin-bottom: 16px;"></i>
                <h3 style="color: var(--text-primary); margin-bottom: 8px;">Xatolik yuz berdi</h3>
                <p style="color: var(--text-muted);">${message}</p>
                <button onclick="window.location.href='admins.html'" class="btn-primary" style="margin-top: 16px; display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px;">
                    <i class="fas fa-arrow-left"></i> Orqaga
                </button>
            </div>
        `;
    }
}

function showSuccess(message) {
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        padding: 14px 18px; background: #ecfdf5;
        border: 1px solid #a7f3d0; border-radius: 10px;
        color: #065f46; max-width: 400px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        display: flex; align-items: center; gap: 10px;
        font-size: 0.85rem;
    `;
    div.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: #065f46; cursor: pointer; font-size: 1.1rem;">×</button>
    `;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// ⭐ CLEANUP
window.addEventListener('beforeunload', function() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    if (notificationRefreshInterval) {
        clearInterval(notificationRefreshInterval);
        notificationRefreshInterval = null;
    }
});

console.log('✅ admin-profile.js yuklandi');
