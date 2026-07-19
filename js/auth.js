// ============================================
// AUTH - Admin Main (TO'LIQ TUZATILGAN)
// ============================================

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
        window.location.href = 'index.html';
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

    // ⭐ CHECK AUTH - TO'LIQ TUZATILGAN (HEMISHE TRUE QAYTARADI)
    async checkAuth() {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        if (!token) return false;

        // ⭐ 30 daqiqa cache
        const CACHE = 30 * 60 * 1000;
        if (this.getLastAuthAge() < CACHE) {
            console.log('✅ Auth cache — server chaqirilmadi');
            return true;
        }

        try {
            const data = await API.get('/auth/profile');

            // ⭐ Timeout yoki tarmoq xatosi — sahifada qolish
            if (data.status === 0) {
                console.warn('⚠️ Server javob bermadi — sahifada qolindi');
                return true;
            }

            // ⭐ 401 - Token yaroqsiz, LOGOUT
            if (data.status === 401) {
                console.warn('⚠️ Token yaroqsiz → logout');
                localStorage.setItem('authMessage', data.message || 'Sessiya tugagan. Qayta kiring.');
                this.logout();
                return false;
            }

            // ⭐ 403 - Bloklangan
            if (data.status === 403) {
                console.warn('⚠️ Bloklangan (403) → logout');
                localStorage.setItem('authMessage', data.message || 'Kirishga ruxsat yo\'q.');
                this.logout();
                return false;
            }

            // ⭐ Muvaffaqiyatli
            if (data.success && data.user) {
                localStorage.setItem('adminUser', JSON.stringify(data.user));
                sessionStorage.setItem('adminUser', JSON.stringify(data.user));
                localStorage.setItem('adminLastAuth', Date.now().toString());
                return true;
            }

            // ⭐ Boshqa xatoliklar — sahifada qolish
            console.warn('⚠️ Auth xatosi:', data.message);
            return true;

        } catch (error) {
            console.warn('⚠️ checkAuth exception:', error.message, '— sahifada qolindi');
            return true;
        }
    }
};

// ============================================================
// ⭐ SAHIFA YUKLANGANDA - CHEKSIZ LOOP YO'Q
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    const isLoginPage = path.includes('index.html') ||
                        path === '/' ||
                        path.endsWith('/');

    if (isLoginPage) return;

    // ⭐ Token yo'q → login
    if (!Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    // ⭐ checkAuth — xato bo'lsa ham sahifada qolish
    try {
        const isValid = await Auth.checkAuth();
        // ⭐ FAQAT TOKEN YO'Q BO'LSA YO'NALTIR
        if (!isValid && !Auth.isAuthenticated()) {
            window.location.href = 'index.html';
        }
    } catch (e) {
        console.warn('⚠️ Auth error:', e.message);
    }
});
