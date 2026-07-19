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
                // ✅ Oxirgi muvaffaqiyatli auth vaqtini saqlaymiz
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

    // ⭐ Oxirgi muvaffaqiyatli auth qancha vaqt oldin bo'lgani
    getLastAuthAge() {
        const last = localStorage.getItem('adminLastAuth');
        if (!last) return Infinity;
        return Date.now() - parseInt(last);
    },
    
    // ⭐ CHECK AUTH — faqat haqiqiy 401/403 da logout qiladi
    async checkAuth() {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        if (!token) return false;

        // ⭐ Agar oxirgi muvaffaqiyatli auth 5 daqiqadan kam bo'lsa —
        // qayta tekshirmasdan sahifada qolishga ruxsat beramiz
        // (mobilda har sahifada API chaqirilmaydi → logout yo'q)
        const AGE_LIMIT = 5 * 60 * 1000; // 5 daqiqa
        if (this.getLastAuthAge() < AGE_LIMIT) {
            console.log('✅ Auth cache — qayta tekshirilmadi');
            return true;
        }

        try {
            // ⭐ fetch to'g'ridan-to'g'ri — status kodini o'zimiz olamiz
            const apiBase = window.__API_BASE_URL__ || API.baseURL || '';
            const response = await fetch(`${apiBase}/api/auth/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // ⭐ Mobilda 8 soniya kutamiz, keyin timeout
                signal: AbortSignal.timeout(8000)
            });

            // ⭐ Tarmoq javob bermasa (timeout, offline) — logout qilmaymiz
            const status = response.status;

            // ⭐ FAQAT 401 — token yaroqsiz → logout
            if (status === 401) {
                console.warn('⚠️ Token yaroqsiz (401) → logout');
                localStorage.setItem('authMessage', 'Sessiya muddati tugagan. Qayta kiring.');
                this.logout();
                return false;
            }

            // ⭐ 403 — bloklangan yoki ruxsat yo'q → logout
            if (status === 403) {
                const data = await response.json().catch(() => ({}));
                console.warn('⚠️ Ruxsat yo\'q (403) → logout');
                localStorage.setItem('authMessage', data.message || 'Kirishga ruxsat yo\'q.');
                this.logout();
                return false;
            }

            // ⭐ 200 — muvaffaqiyatli
            if (status === 200) {
                const data = await response.json().catch(() => ({}));
                if (data.success && data.user) {
                    localStorage.setItem('adminUser', JSON.stringify(data.user));
                    sessionStorage.setItem('adminUser', JSON.stringify(data.user));
                    // ✅ Muvaffaqiyatli auth vaqtini yangilaymiz
                    localStorage.setItem('adminLastAuth', Date.now().toString());
                }
                return true;
            }

            // ⭐ 500, 502, 503 yoki boshqa server xatolari — logout QILMAYMIZ
            console.warn(`⚠️ Server xatosi (${status}) — sahifada qolindi`);
            return true;

        } catch (error) {
            // ⭐ Timeout, offline, CORS — logout QILMAYMIZ
            console.warn('⚠️ Tarmoq xatosi (checkAuth):', error.message, '— sahifada qolindi');
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
    
    if (isLoginPage) return; // Login sahifasida tekshirish shart emas

    // Token yo'q → login sahifasiga
    if (!Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    // ⭐ checkAuth — faqat haqiqiy 401/403 da logout bo'ladi
    // Tarmoq xatosi, timeout, server xatosi → sahifada qoladi
    await Auth.checkAuth();
});
