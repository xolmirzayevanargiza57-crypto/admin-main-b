// ============================================
// ADMINS - TO'LIQ CRUD
// ============================================

let currentAdmins = [];
let currentSearch = '';
let currentSubscription = 'all';

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    loadAdmins();
    
    document.getElementById('searchInput').addEventListener('input', (e) => {
        currentSearch = e.target.value;
        loadAdmins();
    });
    
    document.querySelectorAll('.filter-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
            currentSubscription = btn.dataset.value || 'all';
            document.querySelectorAll('.filter-pill').forEach((item) => {
                item.classList.toggle('active', item === btn);
            });
            loadAdmins();
        });
    });
    
    document.getElementById('refreshBtn').addEventListener('click', loadAdmins);
});

async function loadAdmins() {
    const tbody = document.getElementById('adminsTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                <div class="loading-spinner"></div>
                <p>Yuklanmoqda...</p>
            </td>
        </tr>
    `;
    
    try {
        const params = new URLSearchParams();
        if (currentSearch) params.append('search', currentSearch);
        if (currentSubscription && currentSubscription !== 'all') params.append('subscription', currentSubscription);
        
        const data = await API.get(`/admins?${params.toString()}`);
        if (data.success) {
            currentAdmins = data.data || [];
            renderAdmins(currentAdmins);
        } else {
            showEmpty('Ma\'lumotlar topilmadi');
        }
    } catch (error) {
        console.error('Admin yuklash xatosi:', error);
        showEmpty('Xatolik yuz berdi: ' + error.message);
    }
}

function renderAdmins(admins) {
    const tbody = document.getElementById('adminsTableBody');
    if (!admins || admins.length === 0) {
        showEmpty('Admin Customerlar topilmadi');
        return;
    }
    
    tbody.innerHTML = admins.map((admin, index) => {
        const subType = admin.subscription?.type || 'none';
        const subStatus = admin.subscription?.status || 'inactive';
        const accountStatus = admin.status === 'active' ? 'active' : 'inactive';
        
        let subLabel = 'Obunasi yo\'q';
        let subClass = 'inactive';
        if (subType === 'none') {
            subLabel = 'Obunasi yo\'q';
            subClass = 'inactive';
        } else if (subStatus === 'active') {
            if (subType === 'monthly') { subLabel = 'Oylik'; subClass = 'active'; }
            else if (subType === '6months') { subLabel = '6 oylik'; subClass = 'active'; }
            else if (subType === 'yearly') { subLabel = 'Yillik'; subClass = 'active'; }
            else { subLabel = 'Faol'; subClass = 'active'; }
        } else {
            subLabel = 'Faol emas';
            subClass = 'inactive';
        }
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${admin.fullName || '-'}</strong></td>
                <td>${admin.email || '-'}</td>
                <td><span class="status-badge ${subClass}">${subLabel}</span></td>
                <td>
                    <span class="status-badge ${accountStatus === 'active' ? 'active' : 'inactive'}">
                        ${accountStatus === 'active' ? 'Faol' : 'Faol emas'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <a href="admin-profile.html?id=${admin._id}" class="btn-secondary table-action">
                            <i class="fas fa-eye"></i> Ko'rish
                        </a>
                        <button onclick="banAdmin('${admin._id}')" class="btn-danger table-action">
                            <i class="fas fa-ban"></i> Blok
                        </button>
                        <button onclick="deleteAdmin('${admin._id}')" class="btn-danger table-action">
                            <i class="fas fa-trash"></i> O'chirish
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function banAdmin(id) {
    const reason = prompt('Bloklash sababi (ixtiyoriy):');
    if (reason === null) return;

    try {
        const result = await API.post(`/admins/${id}/ban`, { reason: reason?.trim() || 'Admin panelda cheklov' });
        if (result.success) {
            alert('✅ Admin Customer bloklandi!');
            loadAdmins();
        }
    } catch (error) {
        alert('❌ Xatolik: ' + error.message);
    }
}

async function deleteAdmin(id) {
    if (!confirm('Haqiqatan ham bu Admin Customerni o\'chirmoqchimisiz? Bu amalni qaytarib bo\'lmaydi!')) {
        return;
    }
    
    try {
        const result = await API.delete(`/admins/${id}`);
        if (result.success) {
            alert('✅ Admin Customer o\'chirildi!');
            loadAdmins();
        }
    } catch (error) {
        alert('❌ Xatolik: ' + error.message);
    }
}

function showEmpty(message) {
    const tbody = document.getElementById('adminsTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center" style="padding: 40px 20px; color: var(--text-muted);">
                <i class="fas fa-users" style="font-size: 2rem; display: block; margin-bottom: 8px; color: var(--text-muted);"></i>
                ${message}
            </td>
        </tr>
    `;
}