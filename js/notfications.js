// ============================================
// NOTIFICATIONS - BELL PANEL
// ============================================

const Notifications = {
    panel: null,
    toggleBtn: null,
    badge: null,
    items: [],

    init() {
        this.toggleBtn = document.getElementById('notificationToggle');
        this.badge = document.getElementById('notificationBadge');
        this.panel = document.getElementById('notificationPanel');

        if (!this.toggleBtn) return;

        this.toggleBtn.addEventListener('click', () => this.togglePanel());
        document.addEventListener('click', (event) => {
            if (!this.panel || !this.toggleBtn) return;
            if (!this.panel.contains(event.target) && !this.toggleBtn.contains(event.target)) {
                this.panel.classList.remove('show');
            }
        });

        this.load();
        setInterval(() => this.load(), 30000);
    },

    async load() {
        try {
            const data = await API.get('/notifications');
            if (!data.success) return;
            this.items = data.data || [];
            this.render();
        } catch (error) {
            console.error('Notifications error:', error);
        }
    },

    async markRead(id) {
        try {
            await API.post(`/notifications/${id}/read`, {});
            this.items = this.items.map((item) => item._id === id ? { ...item, isRead: true } : item);
            this.render();
        } catch (error) {
            console.error('Mark read error:', error);
        }
    },

    render() {
        if (!this.badge) return;
        const unread = this.items.filter((item) => !item.isRead).length;
        this.badge.textContent = unread > 0 ? unread : '0';
        this.badge.style.display = unread > 0 ? 'flex' : 'none';

        if (!this.panel) return;
        if (!this.items.length) {
            this.panel.innerHTML = `<div class="notification-empty">${Language.t('noNotifications')}</div>`;
            return;
        }

        this.panel.innerHTML = this.items.map((item) => `
            <div class="notification-item ${item.isRead ? '' : 'unread'}">
                <div class="notification-item-top">
                    <strong>${item.title || 'Xabar'}</strong>
                    ${item.isRead ? '' : `<button class="notification-read" data-id="${item._id}">${Language.t('markRead')}</button>`}
                </div>
                <p>${item.message || ''}</p>
                <span>${new Date(item.createdAt).toLocaleString('uz-UZ')}</span>
            </div>
        `).join('');

        this.panel.querySelectorAll('.notification-read').forEach((btn) => {
            btn.addEventListener('click', () => this.markRead(btn.getAttribute('data-id')));
        });
    },

    togglePanel() {
        if (!this.panel) return;
        this.panel.classList.toggle('show');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Notifications.init());
} else {
    Notifications.init();
}
