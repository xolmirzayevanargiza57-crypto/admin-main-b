// ============================================
// API - Admin Main (TO'LIQ TUZATILGAN)
// ============================================

const API = {
    baseURL: 'https://admin-main-backend.onrender.com/api',

    // ⭐ 30 soniya timeout
    TIMEOUT_MS: 30000,

    getToken() {
        return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    },

    getHeaders() {
        const token = this.getToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    },

    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        try {
            const res = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            return res;
        } finally {
            clearTimeout(timeoutId);
        }
    },

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            console.log('📡 API so\'rov:', url);

            const res = await this.fetchWithTimeout(url, {
                ...options,
                headers: this.getHeaders()
            });

            console.log('📥 Javob status:', res.status);
            return this.handleResponse(res);

        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('⏱️ API timeout (30s)');
                return {
                    success: false,
                    status: 0,
                    message: 'Server javob bermadi. Sahifani yangilang.',
                    isTimeout: true
                };
            }

            console.error('❌ API tarmoq xatosi:', error.message);
            return {
                success: false,
                status: 0,
                message: 'Tarmoq xatosi! Internet ulanishini tekshiring.'
            };
        }
    },

    async get(endpoint)         { return this.request(endpoint, { method: 'GET' }); },
    async post(endpoint, data)  { return this.request(endpoint, { method: 'POST',   body: JSON.stringify(data) }); },
    async put(endpoint, data)   { return this.request(endpoint, { method: 'PUT',    body: JSON.stringify(data) }); },
    async delete(endpoint)      { return this.request(endpoint, { method: 'DELETE' }); },

    async handleResponse(res) {
        let data = null;
        let rawText = '';

        try {
            rawText = await res.text();
            data = rawText ? JSON.parse(rawText) : null;
        } catch (e) {
            console.warn('⚠️ JSON parse xatosi:', e);
            data = null;
        }

        // ⭐ 401/403 - LOGOUT QILMAYMIZ, FAQAT STATUS QAYTARAMIZ
        if (res.status === 401 || res.status === 403) {
            return {
                success: false,
                status: res.status,
                message: data?.message || 'Ruxsat yo\'q! Qayta kiring.'
            };
        }

        if (res.status === 404) {
            return { success: false, status: 404, message: 'API topilmadi!' };
        }

        if (res.status === 500) {
            return { success: false, status: 500, message: 'Server xatosi! Keyinroq urinib ko\'ring.' };
        }

        if (!res.ok) {
            return {
                success: false,
                status: res.status,
                message: data?.message || rawText || `Xatolik: ${res.status}`
            };
        }

        return data || { success: true };
    }
};
