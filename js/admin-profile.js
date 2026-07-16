// ============================================
// ADMIN PROFILE - TUZATILGAN
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
    
    // ============================================
    // TAHRIRLASH MODAL
    // ============================================
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
    
    // OBUNA SOTISH
    const subscriptionBtn = document.getElementById('subscriptionBtn');
    if (subscriptionBtn) {
        subscriptionBtn.addEventListener('click', () => {
            const type = prompt(
                'Obuna turini tanlang:\n' +
                '1. Oylik (299,999 so\'m) -> monthly\n' +
                '2. 6 oylik (1,899,999 so\'m) -> 6months\n' +
                '3. Yillik (3,599,999 so\'m) -> yearly\n' +
                '4. Bekor qilish -> none',
                'monthly'
            );
            if (type === 'monthly' || type === '6months' || type === 'yearly' || type === 'none') {
                updateSubscription(type);
            }
        });
    }
    
    // O'CHIRISH
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
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
});

// ============================================
// PROFILNI YUKLASH
// ============================================
async function loadProfile() {
    try {
        console.log('🔄 Profil yuklanmoqda... ID:', adminId);
        
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
            statusEl.textContent = 'Faol';
            statusEl.className = 'status-badge active';
        } else if (admin.status === 'blocked') {
            statusEl.textContent = 'Bloklangan';
            statusEl.className = 'status-badge blocked';
        } else {
            statusEl.textContent = 'Faol emas';
            statusEl.className = 'status-badge inactive';
        }
    }
    
    // Subscription
    const sub = admin.subscription || {};
    const subType = sub.type || 'none';
    const subStatus = sub.status || 'inactive';
    
    const subLabelEl = document.getElementById('profileSubscription');
    if (subLabelEl) {
        if (subStatus === 'active' && subType !== 'none') {
            if (subType === 'monthly') {
                subLabelEl.textContent = 'Oylik (299,999 so\'m)';
                subLabelEl.className = 'subscription-badge monthly';
            } else if (subType === '6months') {
                subLabelEl.textContent = '6 oylik (1,899,999 so\'m)';
                subLabelEl.className = 'subscription-badge yearly';
            } else if (subType === 'yearly') {
                subLabelEl.textContent = 'Yillik (3,599,999 so\'m)';
                subLabelEl.className = 'subscription-badge yearly';
            } else {
                subLabelEl.textContent = 'Faol';
                subLabelEl.className = 'subscription-badge monthly';
            }
        } else {
            subLabelEl.textContent = 'Obunasi yo\'q';
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
            'none': 'Yo\'q'
        };
        subTypeEl.textContent = typeMap[subType] || 'Yo\'q';
    }
    
    // Obuna muddati
    const subEndEl = document.getElementById('profileSubEnd');
    if (subEndEl) {
        if (sub.endDate) {
            const endDate = new Date(sub.endDate);
            subEndEl.textContent = endDate.toLocaleDateString('uz-UZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
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
    
    // Subscription history
    renderSubscriptionHistory(admin.subscriptionHistory || []);
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
        const startDate = item.startDate ? new Date(item.startDate).toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : '-';
        
        const endDate = item.endDate ? new Date(item.endDate).toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : '-';
        
        const typeLabel = {
            'monthly': 'Oylik (299,999 so\'m)',
            '6months': '6 oylik (1,899,999 so\'m)',
            'yearly': 'Yillik (3,599,999 so\'m)',
            'none': 'Bekor qilindi'
        }[item.type] || item.type;
        
        const statusClass = item.status === 'active' ? 'active' : 'inactive';
        const statusText = item.status === 'active' ? 'Faol' : 'Muddati tugagan';
        
        return `
            <div class="history-item">
                <div class="history-left">
                    <span class="history-number">#${history.length - index}</span>
                    <div class="history-details">
                        <p class="history-type">${typeLabel}</p>
                        <p class="history-dates"><i class="fas fa-calendar"></i> ${startDate} - ${endDate}</p>
                    </div>
                </div>
                <span class="status-badge ${statusClass}" style="min-width: 100px; text-align: center;">
                    ${statusText}
                </span>
            </div>
        `;
    }).join('');
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
    
    const editModal = document.getElementById('editModal');
    if (editModal) {
        editModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// ============================================
// TAHRIRLASHNI SAQLASH
// ============================================
async function saveEdit() {
    const fullName = document.getElementById('editFullName')?.value?.trim() || '';
    const email = document.getElementById('editEmail')?.value?.trim() || '';
    const phone = document.getElementById('editPhone')?.value?.trim() || '';
    const selectedValue = document.getElementById('editStatus')?.value || 'active';
    
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
            status: selectedValue
        });
        
        if (response.success) {
            alert('✅ Admin muvaffaqiyatli yangilandi!');
            const editModal = document.getElementById('editModal');
            if (editModal) {
                editModal.classList.remove('active');
                document.body.style.overflow = '';
            }
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

// ============================================
// OBUNANI YANGILASH
// ============================================
async function updateSubscription(type) {
    try {
        const response = await API.put(`/admins/${adminId}/subscription`, { subscriptionType: type });
        if (response.success) {
            const msg = type === 'monthly' ? 'Oylik (299,999 so\'m)' : 
                       type === '6months' ? '6 oylik (1,899,999 so\'m)' :
                       type === 'yearly' ? 'Yillik (3,599,999 so\'m)' : 
                       'Bekor qilindi';
            alert('✅ Obuna muvaffaqiyatli ' + msg + '!');
            
            const editModal = document.getElementById('editModal');
            if (editModal && editModal.classList.contains('active')) {
                editModal.classList.remove('active');
                document.body.style.overflow = '';
            }
            
            loadProfile();
        }
    } catch (error) {
        alert('❌ Xatolik: ' + error.message);
    }
}