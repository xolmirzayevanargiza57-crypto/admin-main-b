// ============================================
// API - TO'LIQ (TUZATILGAN)
// ============================================

const API = {
    baseURL: 'https://admin-main-backend.onrender.com/api',
    
    getToken() {
        return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    },
    
    getHeaders() {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    },

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            console.log('📡 API so\'rov:', url);
            
            const res = await fetch(url, {
                ...options,
                headers: this.getHeaders()
            });
            
            console.log('📥 Javob status:', res.status);
            return this.handleResponse(res);
        } catch (error) {
            console.error('❌ API xatosi:', error);
            // ⭐ TARMOQ XATOSI - LOGOUT QILMA, FAQAT XATOLIK QAYTAR
            return { 
                success: false, 
                status: 0, 
                message: 'Tarmoq xatosi! Internet ulanishini tekshiring.',
                error: error.message
            };
        }
    },
    
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
    
    async handleResponse(res) {
        let data = null;
        let rawText = '';

        try {
            rawText = await res.text();
            console.log('📄 Raw javob:', rawText);
            data = rawText ? JSON.parse(rawText) : null;
        } catch (error) {
            console.warn('⚠️ JSON parse xatosi:', error);
            data = null;
        }

        if (res.status === 404) {
            return { success: false, status: 404, message: '🔍 API topilmadi! Manzilni tekshiring.' };
        }

        if (res.status === 500) {
            return { success: false, status: 500, message: '🔧 Server xatosi! Iltimos, keyinroq urinib ko\'ring.' };
        }

        // ⭐ 401/403 - TOKEN XATOSI, LEKIN BU YERDA LOGOUT QILMAYMIZ
        // ⭐ AUTH.JS DAGI checkAuth() LOGOUT QILADI
        if (res.status === 401 || res.status === 403) {
            return { 
                success: false, 
                status: res.status,
                message: data?.message || 'Ruxsat yo\'q! Qayta kiring.'
            };
        }

        if (!res.ok) {
            const message = data?.message || rawText || `Xatolik kodi: ${res.status}`;
            return { success: false, status: res.status, message: message };
        }

        return data || { success: true };
    }
};
