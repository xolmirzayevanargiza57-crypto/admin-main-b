// ============================================
// SETTINGS - TO'LIQ
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    loadSettings();
    updateThemeUI();
    
    // Password toggle
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            
            if (!input) return;
            
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            
            const icon = this.querySelector('i');
            if (icon) {
                icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        });
    });
    
    // Password change
    const passwordForm = document.getElementById('passwordForm');
    const oldPasswordInput = document.getElementById('oldPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordMessage = document.getElementById('passwordMessage');
    
    newPasswordInput.addEventListener('input', () => {
        const isValid = newPasswordInput.value.length >= 6;
        newPasswordInput.classList.toggle('error', !isValid && newPasswordInput.value.length > 0);
        newPasswordInput.classList.toggle('success', isValid);
    });
    
    confirmPasswordInput.addEventListener('input', () => {
        const isMatch = confirmPasswordInput.value === newPasswordInput.value;
        confirmPasswordInput.classList.toggle('error', !isMatch && confirmPasswordInput.value.length > 0);
        confirmPasswordInput.classList.toggle('success', isMatch && confirmPasswordInput.value.length > 0);
    });
    
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const oldPassword = oldPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        passwordMessage.className = 'form-message';
        passwordMessage.style.display = 'none';
        
        if (!oldPassword || !newPassword || !confirmPassword) {
            showPasswordMessage('Barcha maydonlarni to\'ldiring!', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showPasswordMessage('Yangi parol va tasdiqlash mos kelmadi!', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showPasswordMessage('Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak!', 'error');
            return;
        }
        
        const btn = passwordForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kutilmoqda...';
        
        try {
            const response = await API.post('/auth/change-password', {
                oldPassword,
                newPassword
            });
            
            if (response.success) {
                showPasswordMessage('✅ Parol muvaffaqiyatli yangilandi!', 'success');
                oldPasswordInput.value = '';
                newPasswordInput.value = '';
                confirmPasswordInput.value = '';
                oldPasswordInput.classList.remove('success', 'error');
                newPasswordInput.classList.remove('success', 'error');
                confirmPasswordInput.classList.remove('success', 'error');
            }
        } catch (error) {
            if (error.message.includes('Eski parol noto\'g\'ri')) {
                oldPasswordInput.classList.add('error');
                showPasswordMessage('Eski parol noto\'g\'ri!', 'error');
            } else {
                showPasswordMessage(error.message || 'Xatolik yuz berdi!', 'error');
            }
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-key"></i> Parolni yangilash';
        }
    });
    
    function showPasswordMessage(msg, type) {
        passwordMessage.textContent = msg;
        passwordMessage.className = `form-message ${type}`;
        passwordMessage.style.display = 'block';
        setTimeout(() => {
            passwordMessage.style.display = 'none';
        }, 5000);
    }
    
    // Profile update
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateProfile();
    });
    
    // Logout
    document.getElementById('settingsLogout').addEventListener('click', () => {
        if (confirm('Haqiqatan ham chiqmoqchimisiz?')) {
            Auth.logout();
        }
    });
});

function loadSettings() {
    const user = Auth.getUser();
    if (!user) return;
    
    document.getElementById('settingsName').value = user.fullName || '';
    document.getElementById('settingsEmail').value = user.email || '';
    document.getElementById('settingsPhone').value = user.phone || '';
}

function updateThemeUI() {
    const currentTheme = localStorage.getItem('theme') || 'system';
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    });

    const statusText = document.getElementById('themeStatus');
    if (!statusText) return;

    const actualTheme = currentTheme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Qorong\'' : 'Yorug\'')
        : currentTheme === 'dark'
            ? 'Qorong\''
            : 'Yorug\'';

    if (currentTheme === 'system') {
        statusText.textContent = `Hozirgi holat: Avtomatik (${actualTheme})`;
    } else {
        statusText.textContent = `Hozirgi holat: ${actualTheme}`;
    }
}

async function updateProfile() {
    const user = Auth.getUser();
    if (!user) return;
    
    const fullName = document.getElementById('settingsName').value.trim();
    const email = document.getElementById('settingsEmail').value.trim();
    const phone = document.getElementById('settingsPhone').value.trim();
    
    if (!fullName || !email) {
        alert('F.I.SH va Email majburiy!');
        return;
    }
    
    try {
        const data = await API.put('/auth/profile', {
            fullName,
            email,
            phone
        });
        
        if (data.success) {
            const updatedUser = { ...user, fullName, email, phone };
            localStorage.setItem('adminUser', JSON.stringify(updatedUser));
            alert('✅ Profil yangilandi!');
            loadSettings();
        }
    } catch (error) {
        alert('❌ Xatolik: ' + error.message);
    }
}