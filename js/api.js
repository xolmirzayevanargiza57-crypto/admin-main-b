// ============================================
// API - TO'LIQ (FAQAT RENDER)
// ============================================

const API = {
    // ✅ RENDER URL (TO'G'RI)
    baseURL: 'https://admin-main-backend.onrender.com/api',
    
    getToken() {
        return localStorage.getItem('adminToken');
    },
    
    getHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    },

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            console.log('📡 API so\'rov:', url); // ✅ Debug uchun
            
            const res = await fetch(url, {
                ...options,
                headers: this.getHeaders()
            });
            return this.handleResponse(res);
        } catch (error) {
            console.error('❌ API xatosi:', error);
            const message = error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')
                ? 'Tarmoq xatosi! Serverga ulanib bo\'lmadi. Qayta urinib ko\'ring.'
                : (error?.message || 'Tarmoq xatosi! Qayta urinib ko\'ring.');
            throw new Error(message);
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
            data = rawText ? JSON.parse(rawText) : null;
        } catch (error) {
            data = null;
        }

        if (!res.ok) {
            const message = data?.message || rawText || 'Xatolik yuz berdi';
            
            if (res.status === 404) {
                throw new Error('Server topilmadi! API manzilini tekshiring.');
            }
            
            if (res.status === 500) {
                throw new Error('Server xatosi! Iltimos, keyinroq urinib ko\'ring.');
            }
            
            if ((res.status === 401 || res.status === 403) && !res.url.includes('/auth/login')) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                localStorage.setItem('authMessage', message || 'Sizning hisobingizga kirish taqiqlangan.');
                window.location.replace('index.html');
            }
            throw new Error(message);
        }

        return data || { success: true };
    }
};