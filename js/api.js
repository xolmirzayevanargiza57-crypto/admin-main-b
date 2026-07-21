// ============================================
// API - Admin Main (TO'LIQ)
// ============================================

const API = {
    baseURL: 'https://admin-main-backend.onrender.com/api',

    TIMEOUT_MS: 30000,
    _isRefreshing: false,

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
            console.log('📡 API:', url);

            const res = await this.fetchWithTimeout(url, {
                ...options,
                headers: this.getHeaders()
            });

            return this.handleResponse(res);

        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('⏱️ API timeout');
                return { success: false, status: 0, message: 'Server javob bermadi.' };
            }

            console.error('❌ API xatosi:', error.message);
            return { success: false, status: 0, message: 'Tarmoq xatosi!' };
        }
    },

    async get(endpoint)         { return this.request(endpoint, { method: 'GET' }); },
    async post(endpoint, data)  { return this.request(endpoint, { method: 'POST',   body: JSON.stringify(data) }); },
    async put(endpoint, data)   { return this.request(endpoint, { method: 'PUT',    body: JSON.stringify(data) }); },
    async delete(endpoint)      { return this.request(endpoint, { method: 'DELETE' }); },

    async handleResponse(res) {
        let data = null;
        try {
            const text = await res.text();
            data = text ? JSON.parse(text) : null;
        } catch (e) {
            console.warn('⚠️ JSON parse xatosi:', e);
        }

        // ⭐ 401/403 - LOGOUT QILMAYMIZ, FAQAT STATUS
        if (res.status === 401 || res.status === 403) {
            return {
                success: false,
                status: res.status,
                message: data?.message || 'Ruxsat yo\'q!'
            };
        }

        if (!res.ok) {
            return {
                success: false,
                status: res.status,
                message: data?.message || `Xatolik: ${res.status}`
            };
        }

        return data || { success: true };
    }
};
