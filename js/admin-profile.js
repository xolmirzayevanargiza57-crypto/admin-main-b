// ============================================
// ADMIN PROFILE - TO'LIQ
// ============================================

let adminId = null;
let currentAdmin = null;

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
    
    loadProfile();
    initEditModal();
    initPaymentModal();
    initButtons();
});

// ============================================
// PROFILNI YUKLASH
// ============================================
async function loadProfile() {
    try {
        const data = await API.get(`/admins/${adminId}`);
        
        if (data.success && data.data) {
            currentAdmin = data.data;
            renderProfile(currentAdmin);
        } else {
            showError('Ma\'lumotlar topilmadi');
        }
    } catch (error) {
        console.error('❌ Profil yuklash xatosi:', error);
        showError('Profil ma\'lumotlarini yuklashda xatolik: ' + error.message);
    }
}

// ============================================
// PROFILNI RENDER QILISH
// ============================================
function renderProfile(admin) {
    // Ism, email, telefon
    document.getElementById('profileName').textContent = admin.fullName || '-';
    document.getElementById('profileEmail').textContent = admin.email || '-';
    document.getElementById('profilePhone').textContent = admin.phone || '-';
    
    const initial = (admin.fullName || 'A').charAt(0).toUpperCase();
    document.getElementById('profileInitial').textContent = initial;
    
    // ✅ Status - TO'G'RI
    const statusEl = document.getElementById('profileStatus');
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
    
    // ✅ Subscription - TO'G'RI
    const sub = admin.subscription || {};
    const subType = sub.type || 'none';
    const subStatus = sub.status || 'inactive';
    
    const subLabelEl = document.getElementById('profileSubscription');
    
    // ✅ Agar status 'active' bo'lsa va obuna turi 'none' bo'lmasa
    if (admin.status === 'active' && subType !== 'none' && subStatus === 'active') {
        if (subType === 'monthly') {
            subLabelEl.textContent = '✅ Oylik (299,999 so\'m)';
            subLabelEl.className = 'subscription-badge monthly';
        } else if (subType === '6months') {
            subLabelEl.textContent = '✅ 6 oylik (1,899,999 so\'m)';
            subLabelEl.className = 'subscription-badge yearly';
        } else if (subType === 'yearly') {
            subLabelEl.textContent = '✅ Yillik (3,599,999 so\'m)';
            subLabelEl.className = 'subscription-badge yearly';
        } else if (subType === 'custom') {
            subLabelEl.textContent = '✅ Custom obuna';
            subLabelEl.className = 'subscription-badge monthly';
        } else {
            subLabelEl.textContent = '✅ Faol';
            subLabelEl.className = 'subscription-badge monthly';
        }
    } else {
        subLabelEl.textContent = '❌ Obunasi yo\'q';
        subLabelEl.className = 'subscription-badge inactive';
    }
    
    // Obuna turi
    const typeMap = {
        'monthly': 'Oylik (299,999 so\'m)',
        '6months': '6 oylik (1,899,999 so\'m)',
        'yearly': 'Yillik (3,599,999 so\'m)',
        'custom': 'Custom obuna',
        'none': 'Yo\'q'
    };
    document.getElementById('profileSubType').textContent = typeMap[subType] || 'Yo\'q';
    
    // Obuna muddati
    const subEndEl = document.getElementById('profileSubEnd');
    if (sub.endDate && subStatus === 'active') {
        const endDate = new Date(sub.endDate);
        subEndEl.textContent = endDate.toLocaleString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        // ✅ Qancha vaqt qolganini hisoblash
        const now = new Date();
        const diff = endDate - now;
        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            subEndEl.textContent += ` (${days}k ${hours}s ${minutes}m ${seconds}s qoldi)`;
        } else {
            subEndEl.textContent += ' ⚠️ Vaqt tugagan!';
        }
    } else {
        subEndEl.textContent = '-';
    }
    
    // To'lov
    const amount = sub.amount || 0;
    document.getElementById('profileSubAmount').textContent = amount.toLocaleString() + ' so\'m';
    
    // Subscription history
    renderSubscriptionHistory(admin.paymentHistory || admin.subscriptionHistory || []);
}

// ============================================
// SUBSCRIPTION TARIXI
// ============================================
function renderSubscriptionHistory(history) {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    if (!history || history.length === 0) {
        historyList.innerHTML = '<p class="text-muted">To\'lov tarixi yo\'q</p>';
        return;
    }
    
    historyList.innerHTML = history.map((item, index) => {
        const startDate = item.startDate ? new Date(item.startDate).toLocaleString('uz-UZ') : '-';
        const endDate = item.endDate ? new Date(item.endDate).toLocaleString('uz-UZ') : '-';
        
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
        
        return `
            <div class="history-item">
                <div class="history-left">
                    <span class="history-number">#${history.length - index}</span>
                    <div class="history-details">
                        <p class="history-type">${typeLabel} - ${amount.toLocaleString()} so'm</p>
                        <p class="history-dates"><i class="fas fa-calendar"></i> ${startDate} → ${endDate}</p>
                        ${item.note ? `<p class="history-dates"><i class="fas fa-sticky-note"></i> ${item.note}</p>` : ''}
                    </div>
                </div>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
        `;
    }).join('');
}

// ============================================
// TAHRIRLASH MODAL
// ============================================
function initEditModal() {
    const editModal = document.getElementById('editModal');
    const editBtn = document.getElementById('editBtn');
    const closeEditBtn = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEditModal');
    const saveEditBtn = document.getElementById('saveEditModal');
    
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            if (currentAdmin) openEditModal();
        });
    }
    
    if (closeEditBtn) {
        closeEditBtn.addEventListener('click', () => {
            editModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            editModal.classList.remove('active');
            document.body.style.overflow = '';
        });
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
        saveEditBtn.addEventListener('click', async () => {
            await saveEdit();
        });
    }
}

function openEditModal() {
    if (!currentAdmin) return;
    
    document.getElementById('editFullName').value = currentAdmin.fullName || '';
    document.getElementById('editEmail').value = currentAdmin.email || '';
    document.getElementById('editPhone').value = currentAdmin.phone || '';
    document.getElementById('editStatus').value = currentAdmin.status || 'active';
    
    document.getElementById('editModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function saveEdit() {
    const fullName = document.getElementById('editFullName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const status = document.getElementById('editStatus').value;
    
    if (!fullName || !email) {
        alert('F.I.SH va Email majburiy!');
        return;
    }
    
    if (!email.includes('@')) {
        alert('Email noto\'g\'ri formatda!');
        return;
    }
    
    try {
        const response = await API.put(`/admins/${adminId}`, {
            fullName,
            email,
            phone,
            status
        });
        
        if (response.success) {
            alert('✅ Admin muvaffaqiyatli yangilandi!');
            document.getElementById('editModal').classList.remove('active');
            document.body.style.overflow = '';
            loadProfile();
        }
    } catch (error) {
        alert('❌ Xatolik: ' + error.message);
    }
}

// ============================================
// TO'LOV QO'SHISH MODAL
// ============================================
function initPaymentModal() {
    const modal = document.getElementById('paymentModal');
    const addBtn = document.getElementById('addPaymentBtn');
    const closeBtn = document.getElementById('closePaymentModal');
    const cancelBtn = document.getElementById('cancelPaymentModal');
    const saveBtn = document.getElementById('savePaymentModal');
    const paymentType = document.getElementById('paymentType');
    const customGroup = document.getElementById('customDurationGroup');
    
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            // Default values
            document.getElementById('paymentAmount').value = '299999';
            document.getElementById('paymentType').value = 'monthly';
            document.getElementById('customDays').value = '0';
            document.getElementById('customHours').value = '0';
            document.getElementById('customMinutes').value = '0';
            document.getElementById('customSeconds').value = '0';
            document.getElementById('paymentEndDate').value = '';
            document.getElementById('paymentEndTime').value = '';
            document.getElementById('paymentNote').value = '';
            customGroup.style.display = 'none';
        });
    }
    
    // ✅ Custom tanlanganda vaqt maydonlari chiqadi
    if (paymentType) {
        paymentType.addEventListener('change', () => {
            customGroup.style.display = paymentType.value === 'custom' ? 'block' : 'none';
            if (paymentType.value === 'custom') {
                document.getElementById('paymentAmount').value = '1000';
            } else {
                const amounts = {
                    'monthly': '299999',
                    '6months': '1899999',
                    'yearly': '3599999'
                };
                document.getElementById('paymentAmount').value = amounts[paymentType.value] || '1000';
            }
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
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
        saveBtn.addEventListener('click', async () => {
            await savePayment();
        });
    }
}

async function savePayment() {
    const paymentType = document.getElementById('paymentType').value;
    const amount = parseInt(document.getElementById('paymentAmount').value);
    const customDays = parseInt(document.getElementById('customDays').value) || 0;
    const customHours = parseInt(document.getElementById('customHours').value) || 0;
    const customMinutes = parseInt(document.getElementById('customMinutes').value) || 0;
    const customSeconds = parseInt(document.getElementById('customSeconds').value) || 0;
    const endDate = document.getElementById('paymentEndDate').value;
    const endTime = document.getElementById('paymentEndTime').value;
    const note = document.getElementById('paymentNote').value.trim();
    
    if (!amount || amount <= 0) {
        alert('To\'lov miqdorini kiriting!');
        return;
    }
    
    let customDuration = null;
    let endDateTime = null;
    
    // ✅ Custom vaqt
    if (paymentType === 'custom') {
        if (customDays === 0 && customHours === 0 && customMinutes === 0 && customSeconds === 0) {
            alert('Hech qanday vaqt belgilanmadi!');
            return;
        }
        customDuration = { days: customDays, hours: customHours, minutes: customMinutes, seconds: customSeconds };
    }
    
    // ✅ Tugash vaqti
    if (endDate && endTime) {
        endDateTime = new Date(`${endDate}T${endTime}`);
        if (isNaN(endDateTime.getTime())) {
            alert('Noto\'g\'ri vaqt formati!');
            return;
        }
    }
    
    try {
        const response = await API.post(`/admins/${adminId}/payment`, {
            amount: amount,
            subscriptionType: paymentType,
            customDuration: customDuration,
            endDate: endDateTime ? endDateTime.toISOString() : null,
            note: note,
            startDate: new Date().toISOString()
        });
        
        if (response.success) {
            const sub = response.data.subscription || {};
            let msg = '✅ To\'lov muvaffaqiyatli qo\'shildi!\n';
            if (sub.endDate) {
                msg += '📅 Tugash vaqti: ' + new Date(sub.endDate).toLocaleString('uz-UZ');
            }
            alert(msg);
            document.getElementById('paymentModal').classList.remove('active');
            document.body.style.overflow = '';
            loadProfile();
        }
    } catch (error) {
        alert('❌ Xatolik: ' + error.message);
    }
}

// ============================================
// TUGMALAR
// ============================================
function initButtons() {
    // Obuna sotish
    document.getElementById('subscriptionBtn').addEventListener('click', () => {
        const type = prompt(
            'Obuna turini tanlang:\n' +
            '1. Oylik (30 kun) -> monthly\n' +
            '2. 6 oylik (180 kun) -> 6months\n' +
            '3. Yillik (365 kun) -> yearly\n' +
            '4. Custom (qo\'lda vaqt) -> custom\n' +
            '5. Bekor qilish -> none',
            'monthly'
        );
        if (type === 'monthly' || type === '6months' || type === 'yearly' || type === 'custom') {
            // Custom bo'lsa, vaqt so'raymiz
            if (type === 'custom') {
                const days = parseInt(prompt('Kun:', '0')) || 0;
                const hours = parseInt(prompt('Soat:', '0')) || 0;
                const minutes = parseInt(prompt('Daqiqa:', '0')) || 0;
                const seconds = parseInt(prompt('Sekund:', '0')) || 0;
                
                if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
                    alert('Hech qanday vaqt belgilanmadi!');
                    return;
                }
                
                updateSubscription('custom', { days, hours, minutes, seconds });
            } else {
                updateSubscription(type);
            }
        } else if (type === 'none') {
            updateSubscription('none');
        }
    });
    
    // O'chirish
    document.getElementById('deleteBtn').addEventListener('click', async () => {
        if (!confirm('Haqiqatan ham bu Admin Customerni o\'chirmoqchimisiz?')) {
            return;
        }
        
        try {
            const result = await API.delete(`/admins/${adminId}`);
            if (result.success) {
                alert('✅ Admin Customer o\'chirildi!');
                window.location.href = 'admins.html';
            }
        } catch (error) {
            alert('❌ Xatolik: ' + error.message);
        }
    });
}

// ============================================
// OBUNANI YANGILASH
// ============================================
async function updateSubscription(type, customDuration = null) {
    try {
        const data = { subscriptionType: type };
        if (customDuration) {
            data.customDuration = customDuration;
        }
        
        const response = await API.put(`/admins/${adminId}/subscription`, data);
        if (response.success) {
            const msg = type === 'monthly' ? 'Oylik' : 
                       type === '6months' ? '6 oylik' :
                       type === 'yearly' ? 'Yillik' : 
                       type === 'custom' ? 'Custom' : 
                       'Bekor qilindi';
            alert('✅ Obuna muvaffaqiyatli ' + msg + '!');
            loadProfile();
        }
    } catch (error) {
        alert('❌ Xatolik: ' + error.message);
    }
}

// ============================================
// XATOLIK
// ============================================
function showError(message) {
    const container = document.querySelector('.profile-container');
    if (container) {
        container.innerHTML = `
            <div class="error-card" style="text-align: center; padding: 40px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: var(--color-danger); margin-bottom: 16px;"></i>
                <h3 style="color: var(--text-primary); margin-bottom: 8px;">Xatolik yuz berdi</h3>
                <p style="color: var(--text-muted);">${message}</p>
                <button onclick="window.location.href='admins.html'" class="btn-primary" style="margin-top: 16px;">
                    <i class="fas fa-arrow-left"></i> Orqaga
                </button>
            </div>
        `;
    }
}