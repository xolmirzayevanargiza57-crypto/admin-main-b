// ============================================
// API - TO'LIQ
// ============================================

const API = {
    baseURL: 'https://admin-main-backend.onrender.com/api',
    // baseURL: 'http://localhost:5000/api',
    
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
    
    async get(endpoint) {
        const res = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        return this.handleResponse(res);
    },
    
    async post(endpoint, data) {
        const res = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(res);
    },
    
    async put(endpoint, data) {
        const res = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(res);
    },
    
    async delete(endpoint) {
        const res = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(res);
    },
    
    async handleResponse(res) {
        const data = await res.json();
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                window.location.replace('index.html');
            }
            throw new Error(data.message || 'Xatolik yuz berdi');
        }
        return data;
    }
};