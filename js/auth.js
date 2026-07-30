// ============================================================
// AUTH - ADMIN MAIN (TO'LIQ)
// ============================================================

const Auth = {
    async login(email, password) {
        try {
            const data = await API.post('/auth/login', { email, password });
            if (data.success && data.token) {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.user));
                sessionStorage.setItem('adminToken', data.token);
                sessionStorage.setItem('adminUser', JSON.stringify(data.user));
                localStorage.setItem('adminLastAuth', Date.now().toString());
                return { success: true };
            }
            return { success: false, error: data.message || 'Login xatosi' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminLastAuth');
        localStorage.removeItem('authMessage');
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminUser');
        window.location.replace('index.html');
    },

    isAuthenticated() {
        return !!(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
    },

    getUser() {
        const u = localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser');
        return u ? JSON.parse(u) : null;
    },

    getUserName() {
        const user = this.getUser();
        return user ? user.fullName || 'Admin' : 'Admin';
    },

    getUserInitial() {
        return this.getUserName().charAt(0).toUpperCase();
    },

    getLastAuthAge() {
        const last = localStorage.getItem('adminLastAuth');
        return last ? Date.now() - parseInt(last) : Infinity;
    },

    // ⭐ PROFIL O'ZGARISHINI TEKSHIRISH (HAR 10 SONIYADA)
    async checkAuth() {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        if (!token) return false;

        const CACHE = 10 * 60 * 1000; // 10 daqiqa
        if (this.getLastAuthAge() < CACHE) {
            console.log('✅ Auth cache — server chaqirilmadi');
            return true;
        }

        try {
            const data = await API.get('/auth/profile');

            if (data.status === 0) {
                console.warn('⚠️ Server javob bermadi — sahifada qolindi');
                return true;
            }

            if (data.status === 401) {
                console.warn('⚠️ Token yaroqsiz → logout');
                localStorage.setItem('authMessage', data.message || 'Sessiya tugagan. Qayta kiring.');
                this.logout();
                return false;
            }

            if (data.status === 403) {
                console.warn('⚠️ Bloklangan (403) → logout');
                localStorage.setItem('authMessage', data.message || 'Kirishga ruxsat yo\'q.');
                this.logout();
                return false;
            }

            if (data.success && data.user) {
                // ⭐ LOCAL VA SERVER USERLARNI SOLISHTIRISH
                const localUser = this.getUser();
                const serverUser = data.user;
                
                if (localUser) {
                    // ⭐ Email o'zgarganmi?
                    if (localUser.email !== serverUser.email) {
                        console.log('📧 Email o\'zgargan:', localUser.email, '→', serverUser.email);
                        // ⭐ Localni yangilash
                        const updatedUser = { ...localUser, email: serverUser.email };
                        localStorage.setItem('adminUser', JSON.stringify(updatedUser));
                        sessionStorage.setItem('adminUser', JSON.stringify(updatedUser));
                        localStorage.setItem('adminLastAuth', Date.now().toString());
                        
                        // ⭐ UI ni yangilash uchun event dispatch
                        document.dispatchEvent(new CustomEvent('profileUpdated', { 
                            detail: { user: updatedUser } 
                        }));
                    }
                    
                    // ⭐ Ism o'zgarganmi?
                    if (localUser.fullName !== serverUser.fullName) {
                        console.log('👤 Ism o\'zgargan:', localUser.fullName, '→', serverUser.fullName);
                        const updatedUser = { ...localUser, fullName: serverUser.fullName };
                        localStorage.setItem('adminUser', JSON.stringify(updatedUser));
                        sessionStorage.setItem('adminUser', JSON.stringify(updatedUser));
                        localStorage.setItem('adminLastAuth', Date.now().toString());
                        
                        document.dispatchEvent(new CustomEvent('profileUpdated', { 
                            detail: { user: updatedUser } 
                        }));
                    }
                    
                    // ⭐ Telefon o'zgarganmi?
                    if (localUser.phone !== serverUser.phone) {
                        console.log('📱 Telefon o\'zgargan:', localUser.phone, '→', serverUser.phone);
                        const updatedUser = { ...localUser, phone: serverUser.phone };
                        localStorage.setItem('adminUser', JSON.stringify(updatedUser));
                        sessionStorage.setItem('adminUser', JSON.stringify(updatedUser));
                        localStorage.setItem('adminLastAuth', Date.now().toString());
                        
                        document.dispatchEvent(new CustomEvent('profileUpdated', { 
                            detail: { user: updatedUser } 
                        }));
                    }
                }
                
                // ⭐ User ma'lumotlarini yangilash
                localStorage.setItem('adminUser', JSON.stringify(serverUser));
                sessionStorage.setItem('adminUser', JSON.stringify(serverUser));
                localStorage.setItem('adminLastAuth', Date.now().toString());
                return true;
            }

            console.warn('⚠️ Auth xatosi:', data.message);
            return true;

        } catch (error) {
            console.warn('⚠️ checkAuth exception:', error.message, '— sahifada qolindi');
            return true;
        }
    },

    init() {
        const path = window.location.pathname;
        const isLoginPage = path.includes('index.html') || path === '/' || path.endsWith('/');

        if (isLoginPage) return;

        if (!this.isAuthenticated()) {
            window.location.replace('index.html');
            return;
        }

        this.checkAuth().then(isValid => {
            if (!isValid && !this.isAuthenticated()) {
                window.location.replace('index.html');
            }
        }).catch(err => {
            console.warn('⚠️ Auth init error:', err);
        });
    }
};

// ⭐ PROFIL YANGILANGANDA EVENT LISTENER
document.addEventListener('profileUpdated', function(e) {
    const user = e.detail?.user;
    if (user) {
        console.log('🔄 Profil yangilandi event:', user);
        // ⭐ settings.js dagi loadSettings() funksiyasi chaqiriladi
        if (typeof loadSettings === 'function') {
            loadSettings();
        }
    }
});

// Sahifa yuklanganda
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Auth.init());
} else {
    Auth.init();
}

console.log('✅ auth.js yuklandi (Admin-Main)');
