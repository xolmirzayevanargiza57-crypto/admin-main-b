// ============================================
// ADMIN PROFILE - TAHRIRLASH BILAN
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
    
    // ============================================
    // TAHRIRLASH MODAL
    // ============================================
    const editModal = document.getElementById('editModal');
    const editBtn = document.getElementById('editBtn');
    const closeEditBtn = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEditModal');
    const saveEditBtn = document.getElementById('saveEditModal');
    
    // Modal ochish
    editBtn.addEventListener('click', () => {
        openEditModal();
    });
    
    // Modal yopish
    function closeEditModal() {
        editModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    closeEditBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editModal.classList.contains('active')) {
            closeEditModal();
        }
    });
    
    // Saqlash
    saveEditBtn.addEventListener('click', async () => {
        await saveEdit();
    });
    
    // Enter tugmasi
    document.getElementById('editForm').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEditBtn.click();
        }
    });
    
    // ============================================
    // OBUNA SOTISH
    // ============================================
    document.getElementById('subscriptionBtn').addEventListener('click', () => {
        const type = prompt(
            'Obuna turini tanlang:\n' +
            '1. Oylik (299,999 so\'m) -> monthly\n' +
            '2. 6 oylik (1,899,999 so\'m) -> 6months\n' +
            '3. Yillik (3,599,999 so\'m) -> yearly\n' +
            '4. Bekor qilish -> none',
            'monthly'
        );
        if (type === 'monthly' || type === '6months' || type === 'yearly') {
            updateSubscription(type);
        } else if (type === 'none') {
            updateSubscription('none');
        }
    });
    
    // ============================================
    // O'CHIRISH
    // ============================================
    document.getElementById('deleteBtn').addEventListener('click', async () => {
        if (!confirm('Haqiqatan ham bu Admin Customerni o\'chirmoqchimisiz?')) {
            return;
        }
        
        try {
            const result = await API.delete(`/admins/${adminId}`);
            if (result.success) {
                alert('✅ Admin Customer faol emas qilindi va tizimga kirishi bloklandi!');
                window.location.href = 'admins.html';
            }
        } catch (error) {
            alert('❌ Xatolik: ' + error.message);
        }
    });
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
        showError('Profil ma\'lumotlarini yuklashda xatolik yuz berdi: ' + error.message);
    }
}

// ============================================
// PROFILNI RENDER QILISH
// ============================================
function renderProfile(admin) {
    document.getElementById('profileName').textContent = admin.fullName || '-';
    document.getElementById('profileEmail').textContent = admin.email || '-';
    document.getElementById('profilePhone').textContent = admin.phone || '-';
    
    const initial = (admin.fullName || 'A').charAt(0).toUpperCase();
    document.getElementById('profileInitial').textContent = initial;
    
    // Status
    const statusEl = document.getElementById('profileStatus');
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
    
    // Subscription
    const sub = admin.subscription || {};
    const subType = sub.type || 'none';
    const subStatus = sub.status || 'inactive';
    
    const subLabelEl = document.getElementById('profileSubscription');
    if (subStatus === 'active') {
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
    
    // Obuna turi
    const subTypeMap = {
        'monthly': 'Oylik (299,999 so\'m)',
        '6months': '6 oylik (1,899,999 so\'m)',
        'yearly': 'Yillik (3,599,999 so\'m)',
        'none': 'Yo\'q'
    };
    document.getElementById('profileSubType').textContent = subTypeMap[subType] || 'Yo\'q';
    
    // Obuna muddati
    if (sub.endDate) {
        const endDate = new Date(sub.endDate);
        document.getElementById('profileSubEnd').textContent = endDate.toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else {
        document.getElementById('profileSubEnd').textContent = '-';
    }
    
    // To'lov
    const amount = sub.amount || 0;
    document.getElementById('profileSubAmount').textContent = amount.toLocaleString() + ' so\'m';
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
    
    document.getElementById('editModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ============================================
// TAHRIRLASHNI SAQLASH
// ============================================
async function saveEdit() {
    const fullName = document.getElementById('editFullName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const status = document.getElementById('editStatus').value;
    
    // Validatsiya
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
                       type === 'yearly' ? 'Yillik (3,599,999 so\'m)' : 
                       'Bekor qilindi';
            alert('✅ Obuna muvaffaqiyatli ' + msg + '!');
            loadProfile();
        }
    } catch (error) {
        alert('❌ Xatolik: ' + error.message);
    }
}