// ============================================
// API - TO'LIQ
// ============================================

const API = {
    baseURL: 'https://admin-main-backend.onrender.com/api',
    
    getToken() {
        return localStorage.getItem('adminToken');
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
            console.log('📦 Headers:', this.getHeaders());
            
            const res = await fetch(url, {
                ...options,
                headers: this.getHeaders()
            });
            
            console.log('📥 Javob status:', res.status);
            return this.handleResponse(res);
        } catch (error) {
            console.error('❌ API xatosi:', error);
            throw new Error('Tarmoq xatosi! Serverga ulanib bo\'lmadi. Qayta urinib ko\'ring.');
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
            throw new Error('🔍 API topilmadi! Manzilni tekshiring.');
        }

        if (res.status === 500) {
            throw new Error('🔧 Server xatosi! Iltimos, keyinroq urinib ko\'ring.');
        }

        if ((res.status === 401 || res.status === 403) && !res.url.includes('/auth/login')) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            localStorage.setItem('authMessage', data?.message || 'Sizning hisobingizga kirish taqiqlangan.');
            window.location.replace('index.html');
            throw new Error('⛔ Kirish taqiqlangan! Qayta kiring.');
        }

        if (!res.ok) {
            const message = data?.message || rawText || `Xatolik kodi: ${res.status}`;
            throw new Error(`❌ ${message}`);
        }

        return data || { success: true };
    }
};
