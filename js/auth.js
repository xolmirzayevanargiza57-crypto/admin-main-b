// ============================================
// AUTH - Admin Main (RENDER COLD START + MOBIL UCHUN)
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
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminUser');
        localStorage.removeItem('authMessage');
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

    // Oxirgi muvaffaqiyatli auth qancha vaqt oldin bo'lgan (ms)
    getLastAuthAge() {
        const last = localStorage.getItem('adminLastAuth');
        return last ? Date.now() - parseInt(last) : Infinity;
    },

    async checkAuth() {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        if (!token) return false;

        // ⭐ 30 daqiqa ichida muvaffaqiyatli auth bo'lgan bo'lsa —
        // API ga umuman murojaat qilmaymiz (Render cold start va mobil uchun)
        const CACHE = 30 * 60 * 1000; // 30 daqiqa
        if (this.getLastAuthAge() < CACHE) {
            console.log('✅ Auth cache — server chaqirilmadi');
            return true;
        }

        try {
            // ⭐ API.get ishlatamiz — timeout va xato handling api.js da
            const data = await API.get('/auth/profile');

            // ⭐ Timeout yoki tarmoq xatosi — logout QILMAYMIZ
            if (data.status === 0) {
                console.warn('⚠️ Server javob bermadi (timeout/offline) — sahifada qolindi');
                return true;
            }

            // ⭐ 401 — token haqiqatan yaroqsiz
            if (data.status === 401) {
                const msg = (data.message || '').toLowerCase();
                // Faqat aniq token xatosi bo'lsa logout
                if (msg.includes('token') || msg.includes('auth') || msg.includes('unauthorized')) {
                    console.warn('⚠️ Token yaroqsiz → logout');
                    localStorage.setItem('authMessage', data.message || 'Sessiya tugagan. Qayta kiring.');
                    this.logout();
                    return false;
                }
                // Boshqa sabab bo'lsa — sahifada qolish
                return true;
            }

            // ⭐ 403 — bloklangan
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
            }

            // ⭐ Boshqa barcha holatlar — sahifada qolish
            return true;

        } catch (error) {
            // ⭐ Hech qanday exception logout qilmasin
            console.warn('⚠️ checkAuth exception:', error.message, '— sahifada qolindi');
            return true;
        }
    }
};

// ============================================================
// SAHIFA YUKLANGANDA — FAQAT TOKEN YO'Q BO'LSA REDIRECT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    const isLoginPage = path.includes('index.html') ||
                        path === '/' ||
                        path.endsWith('/');

    if (isLoginPage) return;

    // Token umuman yo'q → login
    if (!Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    // ⭐ checkAuth — ichida xato bo'lsa ham try/catch bilan o'ralgan
    // Hech qanday holatda bu blok logout qilmasligi kerak (faqat checkAuth ichida)
    try {
        await Auth.checkAuth();
    } catch (e) {
        console.warn('⚠️ DOMContentLoaded auth xato:', e.message, '— sahifada qolindi');
    }
});
