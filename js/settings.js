// ============================================
// SETTINGS - SOZLAMALAR (Admin-Main)
// TELEFON UCHUN TUZATILGAN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Settings sahifasi yuklanmoqda...');
    
    // ⭐ Auth tekshirish
    if (!Auth.isAuthenticated()) {
        console.warn('⚠️ Auth topilmadi, login sahifasiga o\'tish');
        window.location.href = 'index.html';
        return;
    }
    
    try {
        // ⭐ Profil ma'lumotlarini yuklash
        loadSettings();
        updateThemeUI();
        initPasswordToggle();
        initPasswordForm();
        initProfileForm();
        initLogoutButton();
        initThemeOptions();
        
        // ⭐ REAL-TIME PROFILE SYNC (HAR 10 SONIYADA)
        setInterval(function() {
            syncProfileFromServer();
        }, 10000);
        
        // ⭐ SAHIFA YUKLANGANDA PROFILNI YANGILASH
        setTimeout(function() {
            syncProfileFromServer();
        }, 2000);
        
        console.log('✅ Settings sahifasi yuklandi!');
    } catch (error) {
        console.error('❌ Settings yuklash xatosi:', error);
        showError('Sozlamalar yuklanmadi: ' + error.message);
    }
});

// ============================================
// PASSWORD TOGGLE
// ============================================
function initPasswordToggle() {
    var toggles = document.querySelectorAll('.password-toggle');
    toggles.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var targetId = this.getAttribute('data-target');
            var input = document.getElementById(targetId);
            
            if (!input) return;
            
            var type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            
            var icon = this.querySelector('i');
            if (icon) {
                icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        });
    });
}

// ============================================
// PASSWORD FORM
// ============================================
function initPasswordForm() {
    var passwordForm = document.getElementById('passwordForm');
    if (!passwordForm) return;
    
    var oldPasswordInput = document.getElementById('oldPassword');
    var newPasswordInput = document.getElementById('newPassword');
    var confirmPasswordInput = document.getElementById('confirmPassword');
    var passwordMessage = document.getElementById('passwordMessage');
    
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            var isValid = this.value.length >= 6;
            this.classList.toggle('error', !isValid && this.value.length > 0);
            this.classList.toggle('success', isValid);
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            var isMatch = this.value === newPasswordInput.value;
            this.classList.toggle('error', !isMatch && this.value.length > 0);
            this.classList.toggle('success', isMatch && this.value.length > 0);
        });
    }
    
    passwordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        var oldPassword = oldPasswordInput.value;
        var newPassword = newPasswordInput.value;
        var confirmPassword = confirmPasswordInput.value;
        
        if (passwordMessage) {
            passwordMessage.className = 'form-message';
            passwordMessage.style.display = 'none';
        }
        
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
        
        var btn = passwordForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kutilmoqda...';
        
        try {
            var response = await API.post('/auth/change-password', {
                oldPassword: oldPassword,
                newPassword: newPassword
            });
            
            if (response.success) {
                showPasswordMessage('✅ Parol muvaffaqiyatli yangilandi!', 'success');
                oldPasswordInput.value = '';
                newPasswordInput.value = '';
                confirmPasswordInput.value = '';
                oldPasswordInput.classList.remove('success', 'error');
                newPasswordInput.classList.remove('success', 'error');
                confirmPasswordInput.classList.remove('success', 'error');
            } else {
                showPasswordMessage(response.message || 'Xatolik yuz berdi!', 'error');
            }
        } catch (error) {
            console.error('❌ Parol o\'zgartirish xatosi:', error);
            if (error.message && error.message.includes('Eski parol noto\'g\'ri')) {
                oldPasswordInput.classList.add('error');
                showPasswordMessage('Eski parol noto\'g\'ri!', 'error');
            } else {
                showPasswordMessage(error.message || 'Tarmoq xatosi!', 'error');
            }
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-key"></i> Parolni yangilash';
        }
    });
}

// ============================================
// PROFILE FORM
// ============================================
function initProfileForm() {
    var profileForm = document.getElementById('profileForm');
    if (!profileForm) return;
    
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await updateProfile();
    });
}

// ============================================
// LOGOUT BUTTON
// ============================================
function initLogoutButton() {
    var settingsLogout = document.getElementById('settingsLogout');
    if (settingsLogout) {
        settingsLogout.addEventListener('click', function() {
            if (confirm('Haqiqatan ham chiqmoqchimisiz?')) {
                Auth.logout();
            }
        });
    }
}

// ============================================
// THEME OPTIONS
// ============================================
function initThemeOptions() {
    document.querySelectorAll('.theme-option').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var theme = this.dataset.theme;
            if (theme) {
                Theme.applyTheme(theme);
            }
        });
    });
}

// ============================================
// LOAD SETTINGS
// ============================================
function loadSettings() {
    try {
        var user = Auth.getUser();
        if (!user) {
            console.warn('⚠️ User topilmadi');
            return;
        }
        
        console.log('👤 User ma\'lumotlari:', user);
        
        var nameInput = document.getElementById('settingsName');
        var emailInput = document.getElementById('settingsEmail');
        var phoneInput = document.getElementById('settingsPhone');
        
        if (nameInput) nameInput.value = user.fullName || '';
        if (emailInput) emailInput.value = user.email || '';
        if (phoneInput) phoneInput.value = user.phone || '';
        
        // ⭐ User ma'lumotlarini ekranda ko'rsatish
        var nameDisplay = document.getElementById('profileNameDisplay');
        var emailDisplay = document.getElementById('profileEmailDisplay');
        var phoneDisplay = document.getElementById('profilePhoneDisplay');
        
        if (nameDisplay) nameDisplay.textContent = user.fullName || '-';
        if (emailDisplay) emailDisplay.textContent = user.email || '-';
        if (phoneDisplay) phoneDisplay.textContent = user.phone || '-';
        
        // ⭐ Header ma'lumotlarini yangilash
        var userName = document.getElementById('userName');
        var userInitial = document.getElementById('userInitial');
        if (userName) userName.textContent = user.fullName || 'Admin';
        if (userInitial) userInitial.textContent = (user.fullName || 'A').charAt(0).toUpperCase();
        
        console.log('✅ Settings yuklandi');
    } catch (error) {
        console.error('❌ loadSettings xatosi:', error);
    }
}

// ============================================
// ⭐ PROFILNI SERVERDAN YANGILASH (BARCHA QURILMALAR UCHUN)
// ============================================
async function syncProfileFromServer() {
    try {
        var token = Auth.getToken();
        if (!token) {
            console.warn('⚠️ Token topilmadi, sinxronlash o\'tkazib yuborildi');
            return;
        }
        
        console.log('🔄 Profil sinxronlash...');
        
        var response = await API.get('/auth/profile');
        
        if (response.success && response.user) {
            var serverUser = response.user;
            var localUser = Auth.getUser();
            
            // ⭐ Serverdagi ma'lumotlar bilan localni solishtirish
            var changed = false;
            
            if (localUser) {
                if (localUser.fullName !== serverUser.fullName) {
                    console.log('📝 Ism o\'zgargan:', localUser.fullName, '→', serverUser.fullName);
                    changed = true;
                }
                if (localUser.email !== serverUser.email) {
                    console.log('📝 Email o\'zgargan:', localUser.email, '→', serverUser.email);
                    changed = true;
                }
                if (localUser.phone !== serverUser.phone) {
                    console.log('📝 Telefon o\'zgargan:', localUser.phone, '→', serverUser.phone);
                    changed = true;
                }
            }
            
            // ⭐ Agar o'zgarish bo'lsa, localni yangilash
            if (changed || !localUser) {
                console.log('🔄 Profil yangilanmoqda...');
                
                // ⭐ LocalStorage ni yangilash
                var updatedUser = {
                    id: serverUser._id || serverUser.id,
                    fullName: serverUser.fullName,
                    email: serverUser.email,
                    phone: serverUser.phone || '',
                    role: serverUser.role,
                    status: serverUser.status,
                    subscription: serverUser.subscription
                };
                
                try {
                    localStorage.setItem('adminUser', JSON.stringify(updatedUser));
                    sessionStorage.setItem('adminUser', JSON.stringify(updatedUser));
                    localStorage.setItem('adminLastAuth', Date.now().toString());
                } catch (e) {
                    console.warn('⚠️ Storage yozish xatosi:', e);
                }
                
                // ⭐ UI ni yangilash
                loadSettings();
                
                // ⭐ User name va initial ni yangilash
                var userName = document.getElementById('userName');
                var userInitial = document.getElementById('userInitial');
                if (userName) userName.textContent = serverUser.fullName || 'Admin';
                if (userInitial) userInitial.textContent = (serverUser.fullName || 'A').charAt(0).toUpperCase();
                
                showSuccess('✅ Profil yangilandi!');
            }
        }
    } catch (error) {
        console.error('❌ Profil sinxronlash xatosi:', error);
    }
}

// ============================================
// UPDATE PROFILE
// ============================================
async function updateProfile() {
    var user = Auth.getUser();
    if (!user) {
        alert('Foydalanuvchi topilmadi!');
        return;
    }
    
    var fullName = document.getElementById('settingsName').value.trim();
    var email = document.getElementById('settingsEmail').value.trim();
    var phone = document.getElementById('settingsPhone').value.trim();
    
    if (!fullName || !email) {
        alert('F.I.SH va Email majburiy!');
        return;
    }
    
    var btn = document.querySelector('#profileForm button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yangilanmoqda...';
    
    try {
        var data = await API.put('/auth/profile', {
            fullName: fullName,
            email: email,
            phone: phone
        });
        
        if (data.success) {
            // ⭐ Local ma'lumotlarni yangilash
            var updatedUser = { 
                id: user.id || user._id,
                fullName: fullName,
                email: email,
                phone: phone,
                role: user.role,
                status: user.status,
                subscription: user.subscription
            };
            
            try {
                localStorage.setItem('adminUser', JSON.stringify(updatedUser));
                sessionStorage.setItem('adminUser', JSON.stringify(updatedUser));
                localStorage.setItem('adminLastAuth', Date.now().toString());
            } catch (e) {
                console.warn('⚠️ Storage yozish xatosi:', e);
            }
            
            // ⭐ UI ni yangilash
            loadSettings();
            
            // ⭐ Header dagi ism va initialni yangilash
            var userName = document.getElementById('userName');
            var userInitial = document.getElementById('userInitial');
            if (userName) userName.textContent = fullName;
            if (userInitial) userInitial.textContent = fullName.charAt(0).toUpperCase();
            
            showSuccess('✅ Profil muvaffaqiyatli yangilandi!');
        } else {
            alert('❌ Xatolik: ' + (data.message || 'Noma\'lum xatolik'));
        }
    } catch (error) {
        console.error('❌ Profil yangilash xatosi:', error);
        alert('❌ Xatolik: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Yangilash';
    }
}

// ============================================
// UPDATE THEME UI
// ============================================
function updateThemeUI() {
    try {
        var currentTheme = localStorage.getItem('theme') || 'system';
        document.querySelectorAll('.theme-option').forEach(function(btn) {
            btn.classList.toggle('active', btn.dataset.theme === currentTheme);
        });

        var statusText = document.getElementById('themeStatus');
        if (!statusText) return;

        var actualTheme = currentTheme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Qorong\'u' : 'Yorug\'')
            : currentTheme === 'dark'
                ? 'Qorong\'u'
                : 'Yorug\'';

        if (currentTheme === 'system') {
            statusText.textContent = 'Hozirgi holat: Avtomatik (' + actualTheme + ')';
        } else {
            statusText.textContent = 'Hozirgi holat: ' + actualTheme;
        }
    } catch (error) {
        console.warn('⚠️ Theme UI yangilash xatosi:', error);
    }
}

// ============================================
// PASSWORD MESSAGE
// ============================================
function showPasswordMessage(msg, type) {
    var passwordMessage = document.getElementById('passwordMessage');
    if (!passwordMessage) return;
    passwordMessage.textContent = msg;
    passwordMessage.className = 'form-message ' + type;
    passwordMessage.style.display = 'block';
    setTimeout(function() {
        passwordMessage.style.display = 'none';
    }, 5000);
}

// ============================================
// XATOLIK VA MUVAFFAQIYAT XABARLARI
// ============================================
function showError(msg) {
    console.error('⚠️ Xatolik:', msg);
    var div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:14px 18px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#dc2626;max-width:400px;box-shadow:0 10px 40px rgba(0,0,0,0.1);display:flex;align-items:center;gap:10px;font-size:0.85rem;z-index:10000;';
    div.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>' + msg + '</span><button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;color:#dc2626;cursor:pointer;font-size:1.1rem;">×</button>';
    document.body.appendChild(div);
    setTimeout(function() { if (div.parentElement) div.remove(); }, 5000);
}

function showSuccess(msg) {
    console.log('✅ Muvaffaqiyat:', msg);
    var div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:14px 18px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;color:#065f46;max-width:400px;box-shadow:0 10px 40px rgba(0,0,0,0.1);display:flex;align-items:center;gap:10px;font-size:0.85rem;z-index:10000;';
    div.innerHTML = '<i class="fas fa-check-circle"></i><span>' + msg + '</span><button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;color:#065f46;cursor:pointer;font-size:1.1rem;">×</button>';
    document.body.appendChild(div);
    setTimeout(function() { if (div.parentElement) div.remove(); }, 3000);
}

console.log('✅ settings.js yuklandi (Admin-Main)');
