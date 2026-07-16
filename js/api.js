// ============================================
// API - TO'LIQ (TUZATILGAN)
// ============================================

const API = {
    // ✅ BASE URL - /api ni qo'shing!
    baseURL: 'https://admin-main-backend.onrender.com/api',  // ← /api qo'shildi!
    
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
            
            const res = await fetch(url, {
                ...options,
                headers: this.getHeaders()
            });
            
            console.log('📥 Javob status:', res.status);
            return this.handleResponse(res);
        } catch (error) {
            console.error('❌ API xatosi:', error);
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('🌐 Tarmoq xatosi! Serverga ulanib bo\'lmadi.\n' +
                               '💡 Tekshiring:\n' +
                               '1. Internet aloqangiz borligini\n' +
                               '2. Backend server ishlayotganligini\n' +
                               `3. Manzil: ${this.baseURL}`);
            }
            
            throw error;
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
            throw new Error(`🔍 API topilmadi!\n💡 Manzil: ${this.baseURL}${res.url.split('/api')[1] || ''}`);
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

// ✅ Health check
API.checkHealth = async function() {
    try {
        const response = await fetch(`${this.baseURL}/health`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Server sog\'lom:', data);
            return { success: true, data };
        }
        return { success: false, error: `Status: ${response.status}` };
    } catch (error) {
        console.error('❌ Health check xatosi:', error);
        return { success: false, error: error.message };
    }
};
