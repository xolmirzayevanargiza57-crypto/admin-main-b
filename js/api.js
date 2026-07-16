// ============================================
// API - TO'LIQ (TUZATILGAN)
// ============================================

const API = {
    // ✅ BASE URL - /api NI QO'SHMANG!
    baseURL: 'https://admin-main-backend.onrender.com',
    
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
            // ✅ endpoint /api/... bilan boshlanishi kerak
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
            
            // ✅ Aniq xatolik xabari
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('🌐 Tarmoq xatosi! Serverga ulanib bo\'lmadi.\n' +
                               '💡 Tekshiring:\n' +
                               '1. Internet aloqangiz borligini\n' +
                               '2. Backend server ishlayotganligini\n' +
                               '3. CORS sozlamalarini');
            }
            
            throw error;
        }
    },
    
    async get(endpoint) {
        return this.request(endpoint, { 
            method: 'GET' 
        });
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
        return this.request(endpoint, { 
            method: 'DELETE' 
        });
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

        // ✅ 404 holatida aniq xabar
        if (res.status === 404) {
            throw new Error('🔍 Server topilmadi!\n' +
                           '💡 API manzilini tekshiring:\n' +
                           `   ${this.baseURL}\n` +
                           '💡 Backend server ishlayotganligini tekshiring:\n' +
                           '   https://admin-main-backend.onrender.com/api/health');
        }

        // ✅ 500 holatida
        if (res.status === 500) {
            throw new Error('🔧 Server xatosi! Iltimos, keyinroq urinib ko\'ring.');
        }

        // ✅ 401/403 holatida
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

// ✅ Health check funksiyasi - server ishlayotganligini tekshirish
API.checkHealth = async function() {
    try {
        const response = await fetch(`${this.baseURL}/api/health`);
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

// ✅ Sahifa yuklanganda health check
document.addEventListener('DOMContentLoaded', async () => {
    // Faqat login sahifasida emas
    const isLoginPage = window.location.pathname.includes('index.html') || 
                         window.location.pathname === '/' ||
                         window.location.pathname.endsWith('/');
    
    if (!isLoginPage) {
        const result = await API.checkHealth();
        if (!result.success) {
            console.warn('⚠️ Serverga ulanish muammosi:', result.error);
            // Xatolikni ko'rsatish (ixtiyoriy)
            const panel = document.getElementById('notificationPanel');
            if (panel) {
                panel.innerHTML = `
                    <div class="notification-item" style="border-left: 3px solid #ff3b30;">
                        <div class="notification-item-top">
                            <strong>⚠️ Server muammosi</strong>
                        </div>
                        <p>Backend serverga ulanib bo'lmadi. Iltimos, keyinroq urinib ko'ring.</p>
                        <span>${new Date().toLocaleString()}</span>
                    </div>
                `;
                panel.classList.add('show');
                setTimeout(() => panel.classList.remove('show'), 8000);
            }
        }
    }
});