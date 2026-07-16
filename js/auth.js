// ============================================
// AUTH - TO'LIQ TEKSHIRISH
// ============================================

const Auth = {
    async login(email, password) {
        try {
            const data = await API.post('/auth/login', { email, password });
            
            if (data.success && data.token) {
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.user));
                
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
        localStorage.removeItem('authMessage');
        window.location.href = 'index.html';
    },
    
    isAuthenticated() {
        const token = localStorage.getItem('adminToken');
        return !!token;
    },
    
    getUser() {
        const user = localStorage.getItem('adminUser');
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
    
    async checkAuth() {
        const token = localStorage.getItem('adminToken');
        if (!token) return false;
        
        try {
            const data = await API.get('/auth/profile');
            if (data.success) {
                const user = data.user;
                localStorage.setItem('adminUser', JSON.stringify(user));
                
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

            localStorage.setItem('authMessage', data.message || 'Sizning hisobingizga kirish taqiqlangan.');
            this.logout();
            return false;
        } catch (error) {
            localStorage.setItem('authMessage', error.message || 'Auth xatosi');
            this.logout();
            return false;
        }
    }
};

// Sahifa yuklanganda avtomatik login tekshirish
document.addEventListener('DOMContentLoaded', async () => {
    const isLoginPage = window.location.pathname.includes('index.html') || 
                         window.location.pathname === '/' ||
                         window.location.pathname.endsWith('/');
    
    if (!isLoginPage) {
        if (!Auth.isAuthenticated()) {
            window.location.href = 'index.html';
        } else {
            const isValid = await Auth.checkAuth();
            if (!isValid) {
                window.location.href = 'index.html';
            }
        }
    }
});