// ============================================
// AUTH - TO'LIQ (TUZATILGAN)
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
                
                // ✅ Obuna holatini tekshirish
                const subscriptionStatus = await this.checkSubscriptionStatus();
                if (!subscriptionStatus.isActive && data.user.role !== 'admin_main') {
                    this.logout();
                    return { 
                        success: false, 
                        error: subscriptionStatus.message || 'Obunangiz muddati tugagan yoki mavjud emas!' 
                    };
                }
                
                return { success: true };
            }
            return { success: false, error: data.message || 'Login xatosi' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async checkSubscriptionStatus() {
        try {
            const response = await API.get('/auth/subscription-status');
            if (response.success) {
                return response.data;
            }
            return { isActive: false, message: 'Obuna holatini tekshirib bo\'lmadi' };
        } catch (error) {
            return { isActive: false, message: error.message };
        }
    },
    
    logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
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
    
    // ⭐ CHECK AUTH - TUZATILGAN (CHEKSIZ LOOP YO'Q)
    async checkAuth() {
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        if (!token) return false;
        
        try {
            const data = await API.get('/auth/profile');
            
            // ⭐ TARMOQ XATOSI (status 0) - LOGOUT QILMA
            if (data.status === 0) {
                console.warn('⚠️ Tarmoq xatosi, lekin logout qilinmadi');
                return true; // Sahifada qolish
            }
            
            if (data.success) {
                const user = data.user;
                localStorage.setItem('adminUser', JSON.stringify(user));
                sessionStorage.setItem('adminUser', JSON.stringify(user));
                
                // ✅ Admin Main bo'lmasa obuna tekshir
                if (user.role !== 'admin_main') {
                    const subscriptionStatus = await this.checkSubscriptionStatus();
                    if (!subscriptionStatus.isActive) {
                        localStorage.setItem('authMessage', subscriptionStatus.message || 'Obunangiz muddati tugagan!');
                        this.logout();
                        return false;
                    }
                }
                
                return true;
            }

            // ⭐ FAQAT 401 YOKI 403 BO'LSA LOGOUT
            if (data.status === 401 || data.status === 403) {
                localStorage.setItem('authMessage', data.message || 'Sizning hisobingizga kirish taqiqlangan.');
                this.logout();
                return false;
            }
            
            // ⭐ BOSHQA XATOLIKLAR - LOGOUT QILMA
            console.warn('⚠️ Auth xatosi:', data.message);
            return true; // Sahifada qolish
            
        } catch (error) {
            console.error('❌ Auth check error:', error);
            // ⭐ TARMOQ XATOSI - LOGOUT QILMA
            return true; // Sahifada qolish
        }
    }
};

// ============================================================
// AUTO-REDIRECT - TUZATILGAN (CHEKSIZ LOOP YO'Q)
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const isLoginPage = window.location.pathname.includes('index.html') || 
                         window.location.pathname === '/' ||
                         window.location.pathname.endsWith('/');
    
    if (!isLoginPage) {
        // ⭐ AUTH TEKSHIRISH
        if (!Auth.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }
        
        // ⭐ CHECK AUTH - XATOLIK BO'LSA HAM LOGOUT QILMAYDI
        const isValid = await Auth.checkAuth();
        if (!isValid) {
            // ⭐ FAQAT TOKEN YO'Q BO'LSA YO'NALTIR
            if (!Auth.isAuthenticated()) {
                window.location.href = 'index.html';
            }
        }
    }
});
