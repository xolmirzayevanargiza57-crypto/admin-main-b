// ============================================
// AUTH - Admin Main (MOBIL UCHUN TUZATILGAN)
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
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        return !!token;
    },
    
    getUser() {
        const user = localStorage.getItem('adminUser') || sessionStorage.getItem('adminUser');
        return user ? JSON.parse(user) : null;
    },
    
    getUserName() {
        const user = this.getUser();
        return user ? user.fullName || 'Admin' : 'Admin';
    },
    
    getUserInitial() {
        const name = this.getUserName();
        return name.charAt(0).toUpperCase();
    },

    getLastAuthAge() {
        const last = localStorage.getItem('adminLastAuth');
        if (!last) return Infinity;
        return Date.now() - parseInt(last);
    },
    
    async checkAuth() {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        if (!token) return false;

        // ⭐ 15 daqiqa ichida kirgan bo'lsa — API ga umuman murojaat qilmaymiz
        // Mobilda bu eng muhim qism — har sahifada request ketmaydi
        const AGE_LIMIT = 15 * 60 * 1000; // 15 daqiqa
        if (this.getLastAuthAge() < AGE_LIMIT) {
            console.log('✅ Auth cache ishlatildi — API chaqirilmadi');
            return true;
        }

        try {
            // ⭐ AbortController — mobilda ham ishlaydi (AbortSignal.timeout emas)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, 10000); // 10 soniya

            const apiBase = (typeof API !== 'undefined' && API.baseURL)
                ? API.baseURL.replace(/\/api$/, '')   // /api qo'shimchasini olib tashlaymiz
                : (window.__API_BASE_URL__ || '');

            let response;
            try {
                response = await fetch(`${apiBase}/api/auth/profile`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    signal: controller.signal
                });
            } finally {
                clearTimeout(timeoutId);
            }

            const status = response.status;
            console.log('🔐 Auth status:', status);

            // ⭐ FAQAT 401 → logout (token yaroqsiz)
            if (status === 401) {
                // ⭐ Qo'shimcha tekshiruv: JSON da ham success:false bo'lsa
                try {
                    const data = await response.json();
                    // Ba'zi serverlar 401 qaytarsa ham boshqa sabab bo'lishi mumkin
                    // Faqat aniq "token" xatosi bo'lsa logout qilamiz
                    const msg = (data.message || '').toLowerCase();
                    const isRealTokenError = 
                        msg.includes('token') || 
                        msg.includes('unauthorized') ||
                        msg.includes('auth');
                    
                    if (isRealTokenError) {
                        console.warn('⚠️ Token yaroqsiz → logout');
                        localStorage.setItem('authMessage', data.message || 'Sessiya tugagan. Qayta kiring.');
                        this.logout();
                        return false;
                    }
                } catch(e) { /* JSON parse xatosi — logout qilmaymiz */ }
                
                // Aniq token xatosi emas — sahifada qolish
                return true;
            }

            // ⭐ 403 → logout (bloklangan)
            if (status === 403) {
                try {
                    const data = await response.json();
                    console.warn('⚠️ Bloklangan (403) → logout');
                    localStorage.setItem('authMessage', data.message || 'Kirishga ruxsat yo\'q.');
                    this.logout();
                    return false;
                } catch(e) {
                    return true; // JSON parse xatosi — logout qilmaymiz
                }
            }

            // ⭐ 200 → muvaffaqiyatli
            if (status === 200) {
                try {
                    const data = await response.json();
                    if (data.success && data.user) {
                        localStorage.setItem('adminUser', JSON.stringify(data.user));
                        sessionStorage.setItem('adminUser', JSON.stringify(data.user));
                    }
                } catch(e) { /* parse xatosi — lekin auth muvaffaqiyatli */ }
                localStorage.setItem('adminLastAuth', Date.now().toString());
                return true;
            }

            // ⭐ Boshqa barcha statuslar (500, 502, 503...) → sahifada qolish
            console.warn(`⚠️ Server ${status} — logout qilinmadi`);
            return true;

        } catch (error) {
            // ⭐ Timeout (AbortError), offline, CORS — logout QILMAYMIZ
            if (error.name === 'AbortError') {
                console.warn('⚠️ Auth timeout (10s) — mobil tarmoq sekin, sahifada qolindi');
            } else {
                console.warn('⚠️ Auth tarmoq xatosi:', error.message, '— sahifada qolindi');
            }
            return true;
        }
    }
};

// ============================================================
// SAHIFA YUKLANGANDA AUTH TEKSHIRISH
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    const isLoginPage = path.includes('index.html') ||
                        path === '/' ||
                        path.endsWith('/');
    
    if (isLoginPage) return;

    // Token yo'q → login
    if (!Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    // ⭐ checkAuth — xato bo'lsa ham logout bo'lmaydi
    try {
        await Auth.checkAuth();
    } catch(e) {
        // Hech qanday holatda bu yerdan logout bo'lmasin
        console.warn('⚠️ checkAuth umumiy xato:', e.message);
    }
});
