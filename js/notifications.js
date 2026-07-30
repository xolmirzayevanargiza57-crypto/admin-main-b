// ============================================
// NOTIFICATIONS - BELL PANEL (Admin-Main)
// ============================================

const Notifications = {
    panel: null,
    toggleBtn: null,
    badge: null,
    items: [],

    init: function() {
        this.toggleBtn = document.getElementById('notificationToggle');
        this.badge = document.getElementById('notificationBadge');
        this.panel = document.getElementById('notificationPanel');

        if (!this.toggleBtn) return;

        this.toggleBtn.addEventListener('click', function() {
            Notifications.togglePanel();
        });
        
        document.addEventListener('click', function(event) {
            if (!Notifications.panel || !Notifications.toggleBtn) return;
            if (!Notifications.panel.contains(event.target) && !Notifications.toggleBtn.contains(event.target)) {
                Notifications.panel.classList.remove('show');
            }
        });

        this.load();
        setInterval(function() {
            Notifications.load();
        }, 30000);
    },

    load: async function() {
        try {
            var data = await API.get('/notifications');
            if (!data.success) return;
            this.items = data.data || [];
            this.render();
        } catch (error) {
            console.error('Notifications error:', error);
        }
    },

    markRead: async function(id) {
        try {
            await API.post('/notifications/' + id + '/read', {});
            this.items = this.items.map(function(item) {
                if (item._id === id) {
                    return { ...item, isRead: true };
                }
                return item;
            });
            this.render();
        } catch (error) {
            console.error('Mark read error:', error);
        }
    },

    render: function() {
        if (!this.badge) return;
        var unread = this.items.filter(function(item) { return !item.isRead; }).length;
        this.badge.textContent = unread > 0 ? unread : '0';
        this.badge.style.display = unread > 0 ? 'flex' : 'none';

        if (!this.panel) return;
        if (!this.items.length) {
            this.panel.innerHTML = '<div class="notification-empty">Hozircha bildirishnoma yo\'q</div>';
            return;
        }

        var html = '';
        var self = this;
        this.items.forEach(function(item) {
            var unreadClass = item.isRead ? '' : 'unread';
            var readBtn = item.isRead ? '' : '<button class="notification-read" data-id="' + item._id + '">O\'qildi</button>';
            html += '<div class="notification-item ' + unreadClass + '">';
            html += '  <div class="notification-item-top">';
            html += '    <strong>' + (item.title || 'Xabar') + '</strong>';
            html += '    ' + readBtn;
            html += '  </div>';
            html += '  <p>' + (item.message || '') + '</p>';
            html += '  <span>' + new Date(item.createdAt).toLocaleString('uz-UZ') + '</span>';
            html += '</div>';
        });

        this.panel.innerHTML = html;

        this.panel.querySelectorAll('.notification-read').forEach(function(btn) {
            btn.addEventListener('click', function() {
                self.markRead(this.getAttribute('data-id'));
            });
        });
    },

    togglePanel: function() {
        if (!this.panel) return;
        this.panel.classList.toggle('show');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        Notifications.init();
    });
} else {
    Notifications.init();
}

console.log('✅ notifications.js yuklandi (Admin-Main)');
