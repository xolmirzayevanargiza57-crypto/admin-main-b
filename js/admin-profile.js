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
    
    console.log('🔍 Admin ID:', adminId);
    
    loadProfile();
    initEditModal();
    initPaymentModal();
    initButtons();
    
    // ============================================
    // JORIY PAROL TOGGLE (KO'RSATISH/YASHIRISH)
    // ============================================
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
    
    // ============================================
    // YANGI PAROL TOGGLE (KO'RSATISH/YASHIRISH)
    // ============================================
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

// ============================================
// PROFILNI YUKLASH
// ============================================
async function loadProfile() {
    try {
        console.log('🔄 Profil yuklanmoqda... ID:', adminId);
        console.log('📡 API manzili:', API.baseURL);
        
        const data = await API.get(`/admins/${adminId}`);
        console.log('📦 API javobi:', data);
        
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
    console.log('🎨 Profil render qilinmoqda:', admin);
    
    // Ism, email, telefon
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
    
    // Subscription
    const sub = admin.subscription || {};
    const subType = sub.type || 'none';
    const subStatus = sub.status || 'inactive';
    
    const subLabelEl = document.getElementById('profileSubscription');
    if (subLabelEl) {
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
            let text = endDate.toLocaleString('uz-UZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            
            const now = new Date();
            const diff = endDate - now;
            if (diff > 0) {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                text += ` (${days}k ${hours}s ${minutes}m ${seconds}s qoldi)`;
            } else {
                text += ' ⚠️ Vaqt tugagan!';
            }
            subEndEl.textContent = text;
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
    
    // Payment history
    const history = admin.paymentHistory || admin.subscriptionHistory || [];
    renderSubscriptionHistory(history);
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
        const startDate = item.startDate ? new Date(item.startDate).toLocaleString('uz-UZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }) : '-';
        
        const endDate = item.endDate ? new Date(item.endDate).toLocaleString('uz-UZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }) : '-';
        
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
                    <span class="history-number">#${history.length - index}</span>
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

// ============================================
// TAHRIRLASH MODAL OCHISH
// ============================================
function openEditModal() {
    if (!currentAdmin) return;
    
    document.getElementById('editFullName').value = currentAdmin.fullName || '';
    document.getElementById('editEmail').value = currentAdmin.email || '';
    document.getElementById('editPhone').value = currentAdmin.phone || '';
    document.getElementById('editStatus').value = currentAdmin.status || 'active';
    document.getElementById('editPassword').value = '';
    
    // JORIY PAROL - FAQAT YULDUZCHALAR KO'RINADI
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

// ============================================
// TAHRIRLASHNI SAQLASH (PAROL BILAN)
// ============================================
async function saveEdit() {
    const fullName = document.getElementById('editFullName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const status = document.getElementById('editStatus').value;
    const newPassword = document.getElementById('editPassword').value.trim();
    
    if (!fullName || !email) {
        alert('F.I.SH va Email majburiy!');
        return;
    }
    
    if (!email.includes('@')) {
        alert('Email noto\'g\'ri formatda!');
        return;
    }
    
    try {
        const updateData = {
            fullName,
            email,
            phone,
            status: status === 'none' ? 'inactive' : status
        };
        
        // Agar yangi parol kiritilgan bo'lsa, yangilaymiz
        if (newPassword && newPassword.length >= 6) {
            updateData.password = newPassword;
        } else if (newPassword && newPassword.length < 6) {
            alert('Yangi parol kamida 6 ta belgi bo\'lishi kerak!');
            return;
        }
        
        if (status === 'none') {
            updateData.subscription = {
                type: 'none',
                status: 'inactive',
                startDate: null,
                endDate: null,
                amount: 0
            };
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
    
    if (!modal || !addBtn) return;
    
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
        
        if (customGroup) customGroup.style.display = 'none';
    });
    
    if (paymentType) {
        paymentType.addEventListener('change', () => {
            if (customGroup) {
                customGroup.style.display = paymentType.value === 'custom' ? 'block' : 'none';
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

// ============================================
// TO'LOVNI SAQLASH
// ============================================
async function savePayment() {
    const paymentType = document.getElementById('paymentType').value;
    const amount = document.getElementById('paymentAmount').value.trim();
    const customDays = parseInt(document.getElementById('customDays').value) || 0;
    const customHours = parseInt(document.getElementById('customHours').value) || 0;
    const customMinutes = parseInt(document.getElementById('customMinutes').value) || 0;
    const customSeconds = parseInt(document.getElementById('customSeconds').value) || 0;
    const endDate = document.getElementById('paymentEndDate').value;
    const endTime = document.getElementById('paymentEndTime').value;
    const note = document.getElementById('paymentNote').value.trim();
    
    if (!amount || amount === '') {
        alert('❌ To\'lov miqdorini kiriting!');
        document.getElementById('paymentAmount').focus();
        return;
    }
    
    const amountNumber = parseInt(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
        alert('❌ To\'lov miqdori 0 dan katta bo\'lishi kerak!');
        document.getElementById('paymentAmount').focus();
        return;
    }
    
    if (paymentType === 'custom') {
        if (customDays === 0 && customHours === 0 && customMinutes === 0 && customSeconds === 0) {
            alert('❌ Hech qanday vaqt belgilanmadi!');
            return;
        }
    }
    
    let customDuration = null;
    let endDateTime = null;
    
    if (paymentType === 'custom') {
        customDuration = { 
            days: customDays, 
            hours: customHours, 
            minutes: customMinutes, 
            seconds: customSeconds 
        };
    }
    
    if (endDate && endTime) {
        endDateTime = new Date(`${endDate}T${endTime}`);
        if (isNaN(endDateTime.getTime())) {
            alert('❌ Noto\'g\'ri vaqt formati!');
            return;
        }
    }
    
    try {
        const response = await API.post(`/admins/${adminId}/payment`, {
            amount: amountNumber,
            subscriptionType: paymentType,
            customDuration: customDuration,
            endDate: endDateTime ? endDateTime.toISOString() : null,
            note: note || 'Admin tomonidan qo\'shildi',
            startDate: new Date().toISOString()
        });
        
        if (response.success) {
            const sub = response.data.subscription || {};
            let msg = '✅ To\'lov muvaffaqiyatli qo\'shildi!\n';
            if (sub.endDate) {
                const end = new Date(sub.endDate);
                msg += '📅 Tugash vaqti: ' + end.toLocaleString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                });
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
    const subscriptionBtn = document.getElementById('subscriptionBtn');
    if (subscriptionBtn) {
        subscriptionBtn.addEventListener('click', () => {
            const type = prompt(
                'Obuna turini tanlang:\n' +
                '1. Oylik (30 kun) -> monthly\n' +
                '2. 6 oylik (180 kun) -> 6months\n' +
                '3. Yillik (365 kun) -> yearly\n' +
                '4. Custom (qo\'lda vaqt) -> custom\n' +
                '5. Bekor qilish -> none',
                'monthly'
            );
            
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
            } else if (type === 'monthly' || type === '6months' || type === 'yearly') {
                updateSubscription(type);
            } else if (type === 'none') {
                updateSubscription('none');
            }
        });
    }
    
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!confirm('Haqiqatan ham bu Admin Customerni o\'chirmoqchimisiz?\nBu amalni qaytarib bo\'lmaydi!')) {
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
                <button onclick="window.location.href='admins.html'" class="btn-primary" style="margin-top: 16px; display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px;">
                    <i class="fas fa-arrow-left"></i> Orqaga
                </button>
            </div>
        `;
    }
}
