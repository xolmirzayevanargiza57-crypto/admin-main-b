// ============================================================
// ADMIN PROFILE - ADMIN-MAIN (TO'LIQ TUZATILGAN)
// Loyiha: Admin-Main Frontend
// Fayl: js/admin-profile.js
// ============================================================

let adminId = null;
let currentAdmin = null;
let countdownInterval = null;
let notificationRefreshInterval = null;
let lastUnreadCount = 0;
let audioContext = null;

// ============================================================
// ⭐ OVOZ YARATISH
// ============================================================
function createNotificationSound() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        if (audioContext.state === 'closed') {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        var now = audioContext.currentTime;
        var osc1 = audioContext.createOscillator();
        var gain1 = audioContext.createGain();
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.frequency.value = 880;
        osc1.type = 'sine';
        gain1.gain.setValueAtTime(0.25, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc1.start(now);
        osc1.stop(now + 0.2);
        var osc2 = audioContext.createOscillator();
        var gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1100;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.2, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.35);
        return true;
    } catch (error) {
        return false;
    }
}

function playNotificationSound() {
    try {
        createNotificationSound();
        setTimeout(function() { createNotificationSound(); }, 200);
    } catch (e) {}
}

function initAudio() {
    if (audioContext) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    } catch (e) {}
}

// ============================================================
// ⭐ TO'LOV USULI MA'LUMOTLARI
// ============================================================
const PAYMENT_METHODS = {
    cash: { id: 'cash', name: 'Naqd pul', icon: 'https://www.gazeta.uz/sp/32221828/img/tild3365-3235-4161-a437-316637323436__banknoti-uzb.png', emoji: '💵' },
    click: { id: 'click', name: 'Click', icon: 'https://minora.uz/images/logo/click-logo.png', emoji: '📱' },
    paynet: { id: 'paynet', name: 'Paynet', icon: 'https://frankfurt.apollo.olxcdn.com/v1/files/qum4yr71mite1-UZ/image', emoji: '💳' },
    payme: { id: 'payme', name: 'Payme', icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Paymeuz_logo.png', emoji: '📲' },
    uzum: { id: 'uzum', name: 'Uzum', icon: 'https://admin.uzum.com/wp-content/uploads/2024/09/og-image.jpg', emoji: '🟣' },
    uzcard: { id: 'uzcard', name: 'Uzcard', icon: 'https://bank.uz/upload/yp/static/058/0584015c28a78f817d6385b99ed3680a.jpg', emoji: '💳' },
    humo: { id: 'humo', name: 'Humo', icon: 'https://payform.global/img/humo.png', emoji: '🟠' },
    visa: { id: 'visa', name: 'Visa', icon: 'https://i.pinimg.com/originals/1f/50/0c/1f500cb49b3c529f6a88b9a0fa6070e4.jpg?nii=t', emoji: '💳' },
    agrobank: { id: 'agrobank', name: 'Agrobank', icon: 'https://cdn.forbes.ru/forbes-static/new/2023/03/AgroBank-mini-6414643a35289.jpg', emoji: '🌾' },
    tbc: { id: 'tbc', name: 'TBC Bank', icon: 'https://yt3.googleusercontent.com/ytc/AIdro_k6EoLZ1l7Xp-B7UADAullK6FNC9C0HE_74uOF2a46H3V4=s900-c-k-c0x00ffffff-no-rj', emoji: '🔷' },
    anorbank: { id: 'anorbank', name: 'Anorbank', icon: 'https://cbu.uz/upload/iblock/53c/3.jpg', emoji: '🍊' },
    xazna: { id: 'xazna', name: 'Xazna Bank', icon: 'https://jet-back.bank.uz/uploads/article_blocks/d88f203848c154c40be0e793c10fb9a5.webp', emoji: '🏦' },
    anjir: { id: 'anjir', name: 'Anjir Pay', icon: 'https://yt3.googleusercontent.com/CY0fy5wKvwqDsmlRnUkV6xFQzGJQbxbhxMCIPMehKgBgawYm4KNlgt6dp8avty7TQpb8Y8h1=s900-c-k-c0x00ffffff-no-rj', emoji: '🍐' },
    hamkorbank: { id: 'hamkorbank', name: 'Hamkor Bank', icon: 'https://img.hhcdn.ru/employer-logo-original-round/6939937.png', emoji: '🏛️' },
    xalqbanki: { id: 'xalqbanki', name: 'Xalq Banki', icon: 'https://api.onmap.uz/storage/01HYXMSPSC7T0458S4YZV2XJRK.svg', emoji: '🏛️' },
    paypal: { id: 'paypal', name: 'PayPal', icon: 'https://smartpress.by/upload/iblock/85f/dn546q6c891cflormfosv72ixoo1l4gv/paypal.jpg', emoji: '💳' },
    mastercard: { id: 'mastercard', name: 'MasterCard', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/MasterCard_Logo.svg/960px-MasterCard_Logo.svg.png', emoji: '💳' },
    americanexpress: { id: 'americanexpress', name: 'American Express', icon: 'https://live.staticflickr.com/65535/48649342553_8e0daf6313_b.jpg', emoji: '💳' },
    tezpay: { id: 'tezpay', name: 'TezPay', icon: 'https://static.rustore.ru/imgproxy/c9GvEWTzaNNgKCBIj39zh7MM3hJXu-lExCr0HfkejUc/preset:vk_og_img/plain/https://static.rustore.ru/apk/2063541467/content/ICON/39061c50-35b1-484f-a7b2-4329fa0b9c77.png@webp', emoji: '⚡' },
    applepay: { id: 'applepay', name: 'Apple Pay', icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968230.png', emoji: '🍎' },
    other: { id: 'other', name: 'Boshqa', icon: 'https://png.pngtree.com/png-clipart/20211017/original/pngtree-credit-card-vector-illustration-png-image_6857353.png', emoji: '💳' }
};

function detectPaymentMethod(text) {
    if (!text) return PAYMENT_METHODS.other;
    var lowerText = text.toLowerCase().trim();
    var keywords = {
        'uzum': 'uzum', 'tezpay': 'tezpay', 'apple pay': 'applepay', 'applepay': 'applepay',
        'hamkor': 'hamkorbank', 'xalq': 'xalqbanki', 'paypal': 'paypal', 'mastercard': 'mastercard',
        'american': 'americanexpress', 'click': 'click', 'uzcard': 'uzcard', 'xazna': 'xazna',
        'payme': 'payme', 'paynet': 'paynet'
    };
    for (var key in keywords) {
        if (lowerText.includes(key)) {
            return PAYMENT_METHODS[keywords[key]] || PAYMENT_METHODS.other;
        }
    }
    return PAYMENT_METHODS.other;
}

function formatMoney(amount) {
    if (!amount && amount !== 0) return '0 so\'m';
    var num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0 so\'m';
    return num.toLocaleString('uz-UZ') + ' so\'m';
}

function formatDateTimeFull(date) {
    if (!date) return 'Noma\'lum vaqt';
    try {
        var d = new Date(date);
        if (isNaN(d.getTime())) return 'Noma\'lum vaqt';
        return d.toLocaleString('uz-UZ', {
            timeZone: 'Asia/Tashkent',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch (error) {
        return 'Noma\'lum vaqt';
    }
}

function initPasswordToggles() {
    var toggles = document.querySelectorAll('.password-toggle');
    toggles.forEach(function(btn) {
        var newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var targetId = this.getAttribute('data-target');
            var input = document.getElementById(targetId);
            if (!input) return;
            if (input.type === 'password') {
                input.type = 'text';
                var icon = this.querySelector('i');
                if (icon) icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                var icon = this.querySelector('i');
                if (icon) icon.className = 'fas fa-eye';
            }
        });
    });
}

// ============================================================
// SAHIFA YUKLANGANDA
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    var params = new URLSearchParams(window.location.search);
    adminId = params.get('id');
    if (!adminId) {
        alert('Admin ID topilmadi!');
        window.location.href = 'admins.html';
        return;
    }
    console.log('🔍 Admin ID:', adminId);
    
    // ⭐ AUDIO INIT
    var initAudioOnce = function() {
        initAudio();
        document.removeEventListener('click', initAudioOnce);
        document.removeEventListener('touchstart', initAudioOnce);
        document.removeEventListener('keydown', initAudioOnce);
    };
    document.addEventListener('click', initAudioOnce);
    document.addEventListener('touchstart', initAudioOnce);
    document.addEventListener('keydown', initAudioOnce);
    setTimeout(initAudio, 3000);
    
    loadProfile();
    loadNotifications();
    initEditModal();
    initPaymentModal();
    initSubscriptionModal();
    initNotificationModal();
    initUnbanModal();
    initButtons();
    initSidebar();
    initPasswordToggles();
    
    // ⭐ HAR 2 SONIYADA XABARLARNI YANGILASH (REAL TIME)
    if (notificationRefreshInterval) {
        clearInterval(notificationRefreshInterval);
        notificationRefreshInterval = null;
    }
    notificationRefreshInterval = setInterval(function() {
        loadNotifications();
    }, 2000);
});

// ============================================================
// SIDEBAR TOGGLE
// ============================================================
function initSidebar() {
    var menuToggle = document.getElementById('menuToggle');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (!menuToggle || !sidebar) return;
    var newToggle = menuToggle.cloneNode(true);
    menuToggle.parentNode.replaceChild(newToggle, menuToggle);
    newToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('show');
    });
    if (overlay) {
        var newOverlay = overlay.cloneNode(true);
        overlay.parentNode.replaceChild(newOverlay, overlay);
        newOverlay.addEventListener('click', function() {
            sidebar.classList.remove('open');
            this.classList.remove('show');
        });
    }
}

// ============================================================
// PROFILNI YUKLASH
// ============================================================
async function loadProfile() {
    try {
        console.log('🔄 Profil yuklanmoqda... ID:', adminId);
        var data = await API.get('/admins/' + adminId);
        console.log('📦 API javobi:', data);
        if (data.success && data.data) {
            currentAdmin = data.data;
            renderProfile(currentAdmin);
            startCountdown();
        } else {
            showError('Ma\'lumotlar topilmadi');
        }
    } catch (error) {
        console.error('❌ Profil yuklash xatosi:', error);
        showError('Profil ma\'lumotlarini yuklashda xatolik: ' + error.message);
    }
}

// ============================================================
// PROFILNI RENDER QILISH
// ============================================================
function renderProfile(admin) {
    document.getElementById('profileName').textContent = admin.fullName || '-';
    document.getElementById('profileEmail').textContent = admin.email || '-';
    document.getElementById('profilePhone').textContent = admin.phone || '-';
    document.getElementById('profileInitial').textContent = (admin.fullName || 'A').charAt(0).toUpperCase();
    var statusEl = document.getElementById('profileStatus');
    if (statusEl) {
        if (admin.status === 'active') {
            statusEl.textContent = '✅ Faol';
            statusEl.className = 'status-badge active';
        } else if (admin.status === 'blocked') {
            statusEl.textContent = '⛔ Bloklangan';
            statusEl.className = 'status-badge blocked';
        } else {
            statusEl.textContent = '❌ Faol emas';
            statusEl.className = 'status-badge inactive';
        }
    }
    var sub = admin.subscription || {};
    var subLabelEl = document.getElementById('profileSubscription');
    if (subLabelEl) {
        var now = new Date();
        var endDate = sub.endDate ? new Date(sub.endDate) : null;
        var isExpired = endDate && endDate < now;
        var isActive = sub.status === 'active' && !isExpired;
        var typeMap = { monthly: 'Oylik', '6months': '6 oylik', yearly: 'Yillik', custom: 'Custom', none: 'Obunasi yo\'q' };
        if (isActive && sub.type !== 'none') {
            subLabelEl.textContent = '✅ ' + (typeMap[sub.type] || 'Faol');
            subLabelEl.className = 'subscription-badge monthly';
        } else if (isExpired && sub.type !== 'none') {
            subLabelEl.textContent = '⏰ Muddati tugagan';
            subLabelEl.className = 'subscription-badge expired';
        } else {
            subLabelEl.textContent = '❌ Obunasi yo\'q';
            subLabelEl.className = 'subscription-badge inactive';
        }
    }
    document.getElementById('profileSubType').textContent = sub.type || 'Yo\'q';
    document.getElementById('profileSubAmount').textContent = formatMoney(sub.amount || 0);
    var history = admin.paymentHistory || admin.subscriptionHistory || [];
    renderSubscriptionHistory(history);
}

// ============================================================
// TO'LOV TARIXINI RENDER QILISH
// ============================================================
function renderSubscriptionHistory(history) {
    var historyList = document.getElementById('historyList');
    if (!historyList) return;
    if (!history || history.length === 0) {
        historyList.innerHTML = '<p class="text-muted">To\'lov tarixi yo\'q</p>';
        return;
    }
    var sortedHistory = history.slice().sort(function(a, b) {
        return new Date(b.purchaseDate) - new Date(a.purchaseDate);
    });
    var html = '';
    sortedHistory.forEach(function(item, index) {
        var startDate = item.startDate ? formatDateTimeFull(item.startDate) : '-';
        var endDate = item.endDate ? formatDateTimeFull(item.endDate) : '-';
        var now = new Date();
        var endDateTime = item.endDate ? new Date(item.endDate) : null;
        var isExpired = endDateTime && endDateTime < now;
        var isActive = item.status === 'active' && !isExpired;
        var statusLabel = '❌ Faol emas';
        var statusClass = 'inactive';
        var statusColor = '#ff3b30';
        if (isActive) { statusLabel = '✅ Faol'; statusClass = 'active'; statusColor = '#34c759'; }
        else if (isExpired) { statusLabel = '⏰ Muddati tugagan'; statusClass = 'expired'; statusColor = '#ff9500'; }
        var typeLabel = { monthly: '📅 Oylik', '6months': '📅 6 oylik', yearly: '📅 Yillik', custom: '⚙️ Custom' }[item.type] || item.type;
        var amount = item.amount || 0;
        var note = item.note ? '<p class="history-dates"><i class="fas fa-sticky-note"></i> ' + item.note + '</p>' : '';
        var purchaseDate = item.purchaseDate ? formatDateTimeFull(item.purchaseDate) : '-';
        var paymentMethod = item.paymentMethod || 'cash';
        var methodInfo = PAYMENT_METHODS[paymentMethod] || PAYMENT_METHODS.cash;
        var methodDisplay = methodInfo ? 
            '<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.7rem; color: var(--text-muted);">' +
                '<img src="' + methodInfo.icon + '" style="width: 20px; height: 20px; object-fit: contain; border-radius: 4px; background: white; padding: 2px;" onerror="this.style.display=\'none\'">' +
                methodInfo.name +
            '</span>' : '';
        html += 
            '<div class="history-item" style="border-left: 4px solid ' + statusColor + ';">' +
                '<div class="history-left">' +
                    '<span class="history-number">#' + (index + 1) + '</span>' +
                    '<div class="history-details">' +
                        '<p class="history-type">' +
                            typeLabel + ' - ' + formatMoney(amount) +
                            '<span style="font-size: 0.7rem; margin-left: 8px;">' +
                                '<span class="status-badge ' + statusClass + '" style="font-size: 0.7rem; padding: 2px 10px;">' + statusLabel + '</span>' +
                            '</span>' +
                            methodDisplay +
                        '</p>' +
                        '<p class="history-dates"><i class="fas fa-calendar"></i> ' + startDate + ' → ' + endDate + '</p>' +
                        '<p class="history-dates"><i class="fas fa-shopping-cart"></i> Sotib olingan: ' + purchaseDate + '</p>' +
                        note +
                    '</div>' +
                '</div>' +
            '</div>';
    });
    historyList.innerHTML = html;
}

// ============================================================
// COUNTDOWN
// ============================================================
function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    countdownInterval = setInterval(function() {
        updateCountdown();
    }, 1000);
}

function updateCountdown() {
    var subEndEl = document.getElementById('profileSubEnd');
    if (!subEndEl || !currentAdmin) return;
    var sub = currentAdmin.subscription || {};
    if (!sub.endDate || sub.status !== 'active') {
        subEndEl.textContent = '-';
        return;
    }
    var endDate = new Date(sub.endDate);
    var now = new Date();
    var diff = endDate - now;
    if (diff <= 0) {
        subEndEl.textContent = '⚠️ Vaqt tugagan!';
        return;
    }
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((diff % (1000 * 60)) / 1000);
    subEndEl.textContent = formatDateTimeFull(endDate) + ' (' + days + ' kun ' + hours + 's ' + minutes + 'm ' + seconds + 's qoldi)';
}

// ============================================================
// ⭐ XABARLARNI YUKLASH (REAL TIME) - TO'LIQ TUZATILGAN
// ============================================================
async function loadNotifications() {
    try {
        var token = Auth.getToken();
        if (!token) return;
        
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 5000);
        
        try {
            // ⭐ TO'G'RI URL
            var response = await fetch(API.baseURL + '/notifications', {
                headers: API.getHeaders(),
                signal: controller.signal,
                cache: 'no-cache'
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                console.warn('⚠️ Notifications response not OK:', response.status);
                return;
            }
            
            var data = await response.json();
            if (data.success && data.data) {
                // ⭐ O'ZGARISHLARNI TEKSHIRISH
                var oldNotifications = JSON.stringify(allNotifications);
                allNotifications = data.data;
                
                // ⭐ FAQAT O'ZIGA KELGAN VA O'QILMAGAN XABARLARNI HISOBLASH
                var unreadCount = getUnreadCount(allNotifications);
                
                console.log('🔔 O\'qilmagan xabarlar:', unreadCount);
                
                // ⭐ YANGI XABAR KELGANDA OVOZ
                var newUnread = unreadCount;
                if (newUnread > lastUnreadCount && lastUnreadCount > 0) {
                    playNotificationSound();
                    var diff = newUnread - lastUnreadCount;
                    showNotificationToast('🔔 ' + diff + ' ta yangi xabar keldi!');
                }
                lastUnreadCount = newUnread;
                
                // ⭐ XABARLARNI RENDER QILISH
                renderNotifications(allNotifications);
            }
        } catch (fetchError) {
            if (fetchError.name === 'AbortError') {
                console.log('⏱️ Notifications timeout (Admin-Profile)');
            } else {
                console.error('❌ Xatolik:', fetchError);
            }
        }
    } catch (error) {
        console.error('❌ Xabarlarni yuklash xatosi:', error);
    }
}

// ============================================================
// ⭐ O'QILMAGAN XABARLARNI HISOBLASH (FAQAT O'ZIGA KELGANLAR)
// ============================================================
function getUnreadCount(notifications) {
    var user = Auth.getUser();
    if (!user) return 0;
    
    // ⭐ FAQAT O'ZIGA KELGAN VA O'Z YUBORMAGAN XABARLAR
    var filtered = notifications.filter(function(n) {
        // 1. recipientId o'ziga tegishli bo'lishi kerak
        var isForMe = String(n.recipientId) === String(adminId);
        // 2. o'zi yuborgan xabarlarni hisobga olmaslik
        var isNotSentByMe = String(n.sentBy) !== String(user._id);
        // 3. o'qilmagan bo'lishi kerak
        var isUnread = !n.isRead;
        
        return isForMe && isNotSentByMe && isUnread;
    });
    
    return filtered.length;
}

// ============================================================
// ⭐ XABARLARNI RENDER QILISH
// ============================================================
function renderNotifications(notifications) {
    var container = document.getElementById('notificationsList');
    if (!container) return;
    
    var user = Auth.getUser();
    
    // ⭐ FAQAT O'ZIGA KELGAN XABARLAR (o'zi yuborganlarni olib tashlash)
    var filtered = notifications.filter(function(n) {
        var isForMe = String(n.recipientId) === String(adminId);
        var isNotSentByMe = String(n.sentBy) !== String(user?._id);
        return isForMe && isNotSentByMe;
    });
    
    // ⭐ SO'NGI 30 KUN
    var thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filtered = filtered.filter(function(n) {
        var notifDate = new Date(n.createdAt);
        return notifDate >= thirtyDaysAgo;
    });
    
    if (!filtered || filtered.length === 0) {
        container.innerHTML = 
            '<div class="notifications-empty">' +
                '<i class="fas fa-bell-slash"></i>' +
                '<p>Xabarlar yo\'q</p>' +
            '</div>';
        return;
    }
    
    var html = '';
    filtered.forEach(function(item) {
        var isRead = item.isRead;
        var senderName = item.sentByName || 'Admin';
        var formattedDate = formatDateTimeFull(item.createdAt);
        
        var statusBadgeClass = isRead ? 'read' : 'unread';
        var statusBadgeText = isRead ? '✅ O\'qilgan' : '🟡 O\'qilmagan';
        var statusLabelClass = isRead ? 'read' : 'unread';
        var statusLabelText = isRead ? '✓ O\'qilgan' : '⏳ O\'qilmagan';
        var cardClass = isRead ? 'read' : 'unread';
        
        html += 
            '<div class="notification-card ' + cardClass + '">' +
                '<div class="card-top">' +
                    '<div class="left">' +
                        '<span class="title">' + (item.title || 'Xabar') + '</span>' +
                        '<span class="badge-status ' + statusBadgeClass + '">' + statusBadgeText + '</span>' +
                        '<span class="sender">✉️ ' + senderName + '</span>' +
                    '</div>' +
                    '<span class="date">' + formattedDate + '</span>' +
                '</div>' +
                '<div class="card-body">' +
                    '<div class="card-message">' + (item.message || '') + '</div>' +
                '</div>' +
                '<div class="card-footer">' +
                    '<button class="btn-delete" data-id="' + item._id + '">' +
                        '<i class="fas fa-trash"></i> O\'chirish' +
                    '</button>' +
                    '<span class="status-label ' + statusLabelClass + '">' + statusLabelText + '</span>' +
                '</div>' +
            '</div>';
    });
    
    container.innerHTML = html;
    
    // ⭐ O'chirish tugmalari
    document.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            var id = this.dataset.id;
            if (!confirm('Haqiqatan ham bu xabarni o\'chirmoqchimisiz?')) return;
            try {
                var response = await API.delete('/notifications/' + id);
                if (response.success) {
                    showSuccess('Xabar o\'chirildi!');
                    loadNotifications();
                }
            } catch (error) {
                showError('Xabarni o\'chirishda xatolik!');
            }
        });
    });
}

// ============================================================
// ⭐ TOAST XABAR
// ============================================================
function showNotificationToast(message) {
    var existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = 
        '<i class="fas fa-bell" style="font-size:1.2rem;"></i>' +
        '<span>' + message + '</span>' +
        '<button onclick="this.parentElement.remove()">×</button>';
    toast.addEventListener('click', function(e) {
        if (e.target.tagName !== 'BUTTON') {
            window.location.href = 'notifications.html';
        }
    });
    document.body.appendChild(toast);
    setTimeout(function() {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(function() {
                if (toast.parentElement) toast.remove();
            }, 500);
        }
    }, 5000);
}

// ============================================================
// ⭐ XABAR YUBORISH
// ============================================================
async function sendNotification() {
    var titleInput = document.getElementById('notificationTitle');
    var messageInput = document.getElementById('notificationMessage');
    var sendBtn = document.getElementById('sendNotificationSubmitBtn');
    var resultDiv = document.getElementById('notificationResult');
    var title = titleInput ? titleInput.value.trim() : '';
    var message = messageInput ? messageInput.value.trim() : '';
    
    if (!title) {
        showNotificationResult('❌ Iltimos, sarlavhani kiriting!', 'error');
        titleInput.focus();
        return;
    }
    if (!message) {
        showNotificationResult('❌ Iltimos, xabar matnini kiriting!', 'error');
        messageInput.focus();
        return;
    }
    if (!adminId) {
        showNotificationResult('❌ Admin ID topilmadi!', 'error');
        return;
    }
    
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yuborilmoqda...';
    showNotificationResult('⏳ Xabar yuborilmoqda...', 'info');
    
    try {
        var token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        
        var response = await fetch(API.baseURL + '/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                title: title,
                message: message,
                type: 'info',
                recipientId: adminId,
                recipientRole: 'admin_customer',
                expiresInDays: 30
            })
        });
        
        var data = await response.json();
        
        if (response.ok && data.success) {
            playNotificationSound();
            showNotificationResult('✅ Xabar muvaffaqiyatli yuborildi!', 'success');
            titleInput.value = '';
            messageInput.value = '';
            loadNotifications();
            setTimeout(function() {
                document.getElementById('notificationModal').classList.remove('active');
                document.body.style.overflow = '';
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish';
            }, 2000);
        } else {
            showNotificationResult('❌ Xabar yuborishda xatolik: ' + (data.message || 'Noma\'lum xatolik'), 'error');
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish';
        }
    } catch (error) {
        showNotificationResult('❌ Xabar yuborishda xatolik: ' + error.message, 'error');
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish';
    }
}

function showNotificationResult(msg, type) {
    var resultDiv = document.getElementById('notificationResult');
    if (!resultDiv) return;
    resultDiv.textContent = msg;
    resultDiv.className = 'form-message ' + type;
    resultDiv.style.display = 'block';
    setTimeout(function() {
        if (type !== 'success') {
            resultDiv.style.display = 'none';
        }
    }, 6000);
}

// ============================================================
// ⭐ PAYMENT MODAL
// ============================================================
function initPaymentModal() {
    var modal = document.getElementById('paymentModal');
    var addBtn = document.getElementById('addPaymentBtn');
    var closeBtn = document.getElementById('closePaymentModal');
    var cancelBtn = document.getElementById('cancelPaymentModal');
    var saveBtn = document.getElementById('savePaymentModal');
    var paymentType = document.getElementById('paymentType');
    var amountGroup = document.getElementById('paymentAmountGroup');
    var customGroup = document.getElementById('paymentCustomDurationGroup');
    if (!modal || !addBtn) return;
    var newAddBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newAddBtn, addBtn);
    newAddBtn.addEventListener('click', function() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('paymentType').value = 'monthly';
        document.getElementById('paymentAmount').value = '';
        document.getElementById('paymentCustomDays').value = '0';
        document.getElementById('paymentCustomHours').value = '0';
        document.getElementById('paymentCustomMinutes').value = '0';
        document.getElementById('paymentCustomSeconds').value = '0';
        document.getElementById('paymentStartDate').value = '';
        document.getElementById('paymentEndDate').value = '';
        document.getElementById('paymentNote').value = '';
        if (amountGroup) amountGroup.style.display = 'none';
        if (customGroup) customGroup.style.display = 'none';
        var select = document.getElementById('paymentMethodSelect');
        if (select) {
            select.value = '';
            var previewDiv = document.getElementById('paymentMethodPreview');
            if (previewDiv) {
                previewDiv.innerHTML = '';
                previewDiv.style.display = 'none';
            }
        }
        var now = new Date();
        document.getElementById('paymentStartDate').value = now.toISOString().slice(0, 16);
        initPaymentMethodSelect();
    });
    if (closeBtn) {
        var newBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newBtn, closeBtn);
        newBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    if (cancelBtn) {
        var newBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newBtn, cancelBtn);
        newBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    if (paymentType) {
        paymentType.addEventListener('change', function() {
            var isCustom = this.value === 'custom';
            if (amountGroup) amountGroup.style.display = isCustom ? 'block' : 'none';
            if (customGroup) customGroup.style.display = isCustom ? 'block' : 'none';
            if (!isCustom) {
                document.getElementById('paymentCustomDays').value = '0';
                document.getElementById('paymentCustomHours').value = '0';
                document.getElementById('paymentCustomMinutes').value = '0';
                document.getElementById('paymentCustomSeconds').value = '0';
                document.getElementById('paymentAmount').value = '';
            }
            calculatePaymentEndDate();
        });
    }
    var startDateInput = document.getElementById('paymentStartDate');
    if (startDateInput) {
        startDateInput.addEventListener('change', calculatePaymentEndDate);
        startDateInput.addEventListener('input', calculatePaymentEndDate);
    }
    ['paymentCustomDays', 'paymentCustomHours', 'paymentCustomMinutes', 'paymentCustomSeconds'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', calculatePaymentEndDate);
            el.addEventListener('input', calculatePaymentEndDate);
        }
    });
    if (saveBtn) {
        var newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);
        newBtn.addEventListener('click', async function() {
            await savePayment();
        });
    }
}

function calculatePaymentEndDate() {
    var paymentType = document.getElementById('paymentType').value;
    var startDate = document.getElementById('paymentStartDate').value;
    var endDateInput = document.getElementById('paymentEndDate');
    if (!startDate) { endDateInput.value = ''; return; }
    var start = new Date(startDate);
    if (isNaN(start.getTime())) { endDateInput.value = ''; return; }
    var end = new Date(start);
    if (paymentType === 'custom') {
        var days = parseInt(document.getElementById('paymentCustomDays').value) || 0;
        var hours = parseInt(document.getElementById('paymentCustomHours').value) || 0;
        var minutes = parseInt(document.getElementById('paymentCustomMinutes').value) || 0;
        var seconds = parseInt(document.getElementById('paymentCustomSeconds').value) || 0;
        if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) { endDateInput.value = ''; return; }
        end.setDate(end.getDate() + days);
        end.setHours(end.getHours() + hours);
        end.setMinutes(end.getMinutes() + minutes);
        end.setSeconds(end.getSeconds() + seconds);
    } else {
        var durationMap = { monthly: 30, '6months': 180, yearly: 365 };
        var days = durationMap[paymentType] || 0;
        if (days === 0) { endDateInput.value = ''; return; }
        end.setDate(end.getDate() + days);
    }
    endDateInput.value = end.toISOString().slice(0, 16);
}

function initPaymentMethodSelect() {
    var select = document.getElementById('paymentMethodSelect');
    var previewDiv = document.getElementById('paymentMethodPreview');
    if (!select || !previewDiv) return;
    var newSelect = select.cloneNode(true);
    select.parentNode.replaceChild(newSelect, select);
    newSelect.addEventListener('change', function() {
        var methodId = this.value;
        var method = PAYMENT_METHODS[methodId];
        if (method && methodId !== '') {
            previewDiv.innerHTML = 
                '<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-hover);border-radius:8px;border:1px solid var(--border-color);margin-top:8px;">' +
                    '<img src="' + method.icon + '" style="width:40px;height:40px;object-fit:contain;border-radius:6px;background:white;padding:4px;" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';">' +
                    '<div style="font-size:0.9rem;font-weight:600;display:none;" class="fallback-text">' + method.name + '</div>' +
                    '<div>' +
                        '<div style="font-weight:600;font-size:0.9rem;">' + method.name + '</div>' +
                        '<div style="font-size:0.75rem;color:var(--text-muted);">To\'lov usuli tanlandi</div>' +
                    '</div>' +
                    '<span style="margin-left:auto;color:var(--color-success);"><i class="fas fa-check-circle"></i></span>' +
                '</div>';
            previewDiv.style.display = 'block';
        } else {
            previewDiv.innerHTML = '';
            previewDiv.style.display = 'none';
        }
    });
    var noteInput = document.getElementById('paymentNote');
    if (noteInput) {
        noteInput.addEventListener('input', function() {
            var text = this.value;
            var detected = detectPaymentMethod(text);
            if (detected && detected.id !== 'other') {
                var selectEl = document.getElementById('paymentMethodSelect');
                if (selectEl) {
                    selectEl.value = detected.id;
                    selectEl.dispatchEvent(new Event('change'));
                }
            }
        });
    }
}

async function savePayment() {
    var paymentType = document.getElementById('paymentType').value;
    var amount = document.getElementById('paymentAmount').value.trim();
    var customDays = parseInt(document.getElementById('paymentCustomDays').value) || 0;
    var customHours = parseInt(document.getElementById('paymentCustomHours').value) || 0;
    var customMinutes = parseInt(document.getElementById('paymentCustomMinutes').value) || 0;
    var customSeconds = parseInt(document.getElementById('paymentCustomSeconds').value) || 0;
    var startDate = document.getElementById('paymentStartDate').value;
    var endDate = document.getElementById('paymentEndDate').value;
    var note = document.getElementById('paymentNote').value.trim();
    var paymentMethodSelect = document.getElementById('paymentMethodSelect');
    var paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : '';
    if (!paymentMethod || paymentMethod === 'other' || paymentMethod === '') {
        var detected = detectPaymentMethod(note);
        paymentMethod = detected.id;
    }
    if (!paymentMethod || paymentMethod === '') {
        alert('❌ Iltimos, to\'lov usulini tanlang yoki izohda yozing!');
        if (paymentMethodSelect) paymentMethodSelect.focus();
        return;
    }
    if (paymentType === 'custom') {
        if (!amount || amount === '') { alert('❌ Iltimos, to\'lov miqdorini kiriting!'); document.getElementById('paymentAmount').focus(); return; }
        var amountNumber = parseInt(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) { alert('❌ To\'lov miqdori 0 dan katta bo\'lishi kerak!'); document.getElementById('paymentAmount').focus(); return; }
        if (customDays === 0 && customHours === 0 && customMinutes === 0 && customSeconds === 0) { alert('❌ Iltimos, custom vaqt uchun vaqt belgilang!'); document.getElementById('paymentCustomMinutes').focus(); return; }
    }
    if (paymentType !== 'none' && !startDate) { alert('❌ Iltimos, boshlanish sanasini tanlang!'); document.getElementById('paymentStartDate').focus(); return; }
    var customDuration = null;
    var amountNumber = 0;
    if (paymentType === 'custom') {
        customDuration = { days: customDays, hours: customHours, minutes: customMinutes, seconds: customSeconds };
        amountNumber = parseInt(amount) || 0;
    }
    var endDateTime = null;
    if (endDate) { endDateTime = new Date(endDate); if (isNaN(endDateTime.getTime())) { alert('❌ Noto\'g\'ri tugash vaqti formati!'); return; } }
    var startDateTime = null;
    if (startDate) { startDateTime = new Date(startDate); if (isNaN(startDateTime.getTime())) { alert('❌ Noto\'g\'ri boshlanish vaqti formati!'); return; } }
    var saveBtn = document.getElementById('savePaymentModal');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...';
    try {
        var response = await API.post('/admins/' + adminId + '/payment', {
            amount: amountNumber,
            subscriptionType: paymentType,
            customDuration: customDuration,
            endDate: endDateTime ? endDateTime.toISOString() : null,
            startDate: startDateTime ? startDateTime.toISOString() : null,
            note: note || 'Admin tomonidan qo\'shildi',
            paymentMethod: paymentMethod
        });
        if (response.success) {
            var methodName = PAYMENT_METHODS[paymentMethod]?.name || paymentMethod;
            playNotificationSound();
            alert('✅ To\'lov muvaffaqiyatli qo\'shildi!\n💳 To\'lov usuli: ' + methodName);
            document.getElementById('paymentModal').classList.remove('active');
            document.body.style.overflow = '';
            loadProfile();
        } else { alert('❌ Xatolik: ' + (response.message || 'Noma\'lum xatolik')); }
    } catch (error) { console.error('❌ Xatolik:', error); alert('❌ Xatolik: ' + error.message); }
    finally { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fas fa-save"></i> To\'lovni qo\'shish'; }
}

// ============================================================
// ⭐ SUBSCRIPTION MODAL
// ============================================================
function initSubscriptionModal() {
    var modal = document.getElementById('subscriptionModal');
    var subscriptionBtn = document.getElementById('subscriptionBtn');
    var closeBtn = document.getElementById('closeSubscriptionModal');
    var cancelBtn = document.getElementById('cancelSubscriptionModal');
    var saveBtn = document.getElementById('saveSubscriptionModal');
    var typeSelect = document.getElementById('subscriptionTypeSelect');
    var customGroup = document.getElementById('subscriptionCustomDurationGroup');
    var amountGroup = document.getElementById('subscriptionAmountGroup');
    if (!modal || !subscriptionBtn) return;
    var newBtn = subscriptionBtn.cloneNode(true);
    subscriptionBtn.parentNode.replaceChild(newBtn, subscriptionBtn);
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('subscriptionTypeSelect').value = 'monthly';
        document.getElementById('subscriptionCustomDays').value = '0';
        document.getElementById('subscriptionCustomHours').value = '0';
        document.getElementById('subscriptionCustomMinutes').value = '0';
        document.getElementById('subscriptionCustomSeconds').value = '0';
        document.getElementById('subscriptionAmount').value = '';
        if (customGroup) customGroup.style.display = 'none';
        if (amountGroup) amountGroup.style.display = 'none';
        var select = document.getElementById('subscriptionPaymentMethodSelect');
        if (select) {
            select.value = '';
            var previewDiv = document.getElementById('subscriptionPaymentMethodPreview');
            if (previewDiv) {
                previewDiv.innerHTML = '';
                previewDiv.style.display = 'none';
            }
        }
        initSubscriptionPaymentMethodSelect();
    });
    if (closeBtn) {
        var newBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newBtn, closeBtn);
        newBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    if (cancelBtn) {
        var newBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newBtn, cancelBtn);
        newBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    if (typeSelect) {
        typeSelect.addEventListener('change', function() {
            var isCustom = this.value === 'custom';
            if (customGroup) customGroup.style.display = isCustom ? 'block' : 'none';
            if (amountGroup) amountGroup.style.display = isCustom ? 'block' : 'none';
        });
    }
    if (saveBtn) {
        var newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);
        newBtn.addEventListener('click', async function() {
            await saveSubscription();
        });
    }
}

function initSubscriptionPaymentMethodSelect() {
    var select = document.getElementById('subscriptionPaymentMethodSelect');
    var previewDiv = document.getElementById('subscriptionPaymentMethodPreview');
    if (!select || !previewDiv) return;
    select.addEventListener('change', function() {
        var methodId = this.value;
        var method = PAYMENT_METHODS[methodId];
        if (method && methodId !== '') {
            previewDiv.innerHTML = 
                '<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-hover);border-radius:8px;border:1px solid var(--border-color);margin-top:8px;">' +
                    '<img src="' + method.icon + '" style="width:40px;height:40px;object-fit:contain;border-radius:6px;background:white;padding:4px;" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';">' +
                    '<div style="font-size:0.9rem;font-weight:600;display:none;" class="fallback-text">' + method.name + '</div>' +
                    '<div>' +
                        '<div style="font-weight:600;font-size:0.9rem;">' + method.name + '</div>' +
                        '<div style="font-size:0.75rem;color:var(--text-muted);">To\'lov usuli tanlandi</div>' +
                    '</div>' +
                    '<span style="margin-left:auto;color:var(--color-success);"><i class="fas fa-check-circle"></i></span>' +
                '</div>';
            previewDiv.style.display = 'block';
        } else {
            previewDiv.innerHTML = '';
            previewDiv.style.display = 'none';
        }
    });
    var noteInput = document.getElementById('subscriptionNote');
    if (noteInput) {
        noteInput.addEventListener('input', function() {
            var text = this.value;
            var detected = detectPaymentMethod(text);
            if (detected && detected.id !== 'other') {
                select.value = detected.id;
                select.dispatchEvent(new Event('change'));
            }
        });
    }
}

async function saveSubscription() {
    var type = document.getElementById('subscriptionTypeSelect').value;
    var customDays = parseInt(document.getElementById('subscriptionCustomDays').value) || 0;
    var customHours = parseInt(document.getElementById('subscriptionCustomHours').value) || 0;
    var customMinutes = parseInt(document.getElementById('subscriptionCustomMinutes').value) || 0;
    var customSeconds = parseInt(document.getElementById('subscriptionCustomSeconds').value) || 0;
    var amount = document.getElementById('subscriptionAmount').value.trim();
    var select = document.getElementById('subscriptionPaymentMethodSelect');
    var paymentMethod = select ? select.value : '';
    var note = document.getElementById('subscriptionNote')?.value.trim() || '';
    if (!paymentMethod || paymentMethod === 'other' || paymentMethod === '') {
        var detected = detectPaymentMethod(note);
        paymentMethod = detected.id;
    }
    if (type === 'custom') {
        if (customDays === 0 && customHours === 0 && customMinutes === 0 && customSeconds === 0) {
            alert('❌ Custom vaqt uchun vaqt belgilang!');
            return;
        }
        if (!amount || amount === '') {
            alert('❌ To\'lov miqdorini kiriting!');
            document.getElementById('subscriptionAmount').focus();
            return;
        }
        var amountNumber = parseInt(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) {
            alert('❌ To\'lov miqdori 0 dan katta bo\'lishi kerak!');
            return;
        }
    }
    var saveBtn = document.getElementById('saveSubscriptionModal');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...';
    try {
        var customDuration = null;
        var amountNumber = 0;
        if (type === 'custom') {
            customDuration = { days: customDays, hours: customHours, minutes: customMinutes, seconds: customSeconds };
            amountNumber = parseInt(amount) || 0;
        }
        var response = await API.put('/admins/' + adminId + '/subscription', {
            subscriptionType: type,
            customDuration: customDuration,
            amount: amountNumber,
            paymentMethod: paymentMethod || 'cash',
            note: note || 'Admin tomonidan qo\'shildi'
        });
        if (response.success) {
            var msg = type === 'monthly' ? 'Oylik' : type === '6months' ? '6 oylik' : type === 'yearly' ? 'Yillik' : type === 'custom' ? 'Custom' : 'Bekor qilindi';
            var methodName = PAYMENT_METHODS[paymentMethod]?.name || 'Naqd pul';
            playNotificationSound();
            alert('✅ Obuna muvaffaqiyatli ' + msg + '!\n💳 To\'lov usuli: ' + methodName);
            document.getElementById('subscriptionModal').classList.remove('active');
            document.body.style.overflow = '';
            loadProfile();
        } else {
            alert('❌ Xatolik: ' + (response.message || 'Noma\'lum xatolik'));
        }
    } catch (error) {
        console.error('❌ Xatolik:', error);
        alert('❌ Xatolik: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Saqlash';
    }
}

// ============================================================
// ⭐ UNBAN MODAL
// ============================================================
function initUnbanModal() {
    var modal = document.getElementById('unbanModal');
    var unbanBtn = document.getElementById('unbanBtn');
    var closeBtn = document.getElementById('closeUnbanModal');
    var cancelBtn = document.getElementById('cancelUnbanModal');
    var saveBtn = document.getElementById('saveUnbanModal');
    var paymentType = document.getElementById('unbanPaymentType');
    var customGroup = document.getElementById('unbanCustomDurationGroup');
    var amountGroup = document.getElementById('unbanAmountGroup');
    var startDateInput = document.getElementById('unbanStartDate');
    var endDateInput = document.getElementById('unbanEndDate');
    if (!modal || !unbanBtn) return;
    var newBtn = unbanBtn.cloneNode(true);
    unbanBtn.parentNode.replaceChild(newBtn, unbanBtn);
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (currentAdmin && currentAdmin.status !== 'blocked') {
            alert('⚠️ Bu Admin Customer bloklanmagan!');
            return;
        }
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.getElementById('unbanPaymentType').value = 'monthly';
        document.getElementById('unbanCustomDays').value = '0';
        document.getElementById('unbanCustomHours').value = '0';
        document.getElementById('unbanCustomMinutes').value = '0';
        document.getElementById('unbanCustomSeconds').value = '0';
        document.getElementById('unbanStartDate').value = '';
        document.getElementById('unbanEndDate').value = '';
        document.getElementById('unbanAmount').value = '';
        document.getElementById('unbanNote').value = '';
        if (customGroup) customGroup.style.display = 'none';
        if (amountGroup) amountGroup.style.display = 'none';
        var select = document.getElementById('unbanPaymentMethodSelect');
        if (select) {
            select.value = '';
            var previewDiv = document.getElementById('unbanPaymentMethodPreview');
            if (previewDiv) {
                previewDiv.innerHTML = '';
                previewDiv.style.display = 'none';
            }
        }
        initUnbanPaymentMethodSelect();
        var now = new Date();
        var formattedDate = now.toISOString().slice(0, 16);
        document.getElementById('unbanStartDate').value = formattedDate;
        calculateUnbanEndDate();
    });
    if (closeBtn) {
        var newBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newBtn, closeBtn);
        newBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    if (cancelBtn) {
        var newBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newBtn, cancelBtn);
        newBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    if (paymentType) {
        var newPaymentType = paymentType.cloneNode(true);
        paymentType.parentNode.replaceChild(newPaymentType, paymentType);
        newPaymentType.addEventListener('change', function() {
            var value = this.value;
            if (customGroup) { customGroup.style.display = value === 'custom' ? 'block' : 'none'; }
            if (amountGroup) { amountGroup.style.display = value === 'custom' ? 'block' : 'none'; }
            var startDate = document.getElementById('unbanStartDate');
            var endDate = document.getElementById('unbanEndDate');
            if (value === 'none') {
                if (startDate) startDate.disabled = true;
                if (endDate) endDate.disabled = true;
                if (endDate) endDate.value = '';
            } else {
                if (startDate) startDate.disabled = false;
                if (endDate) endDate.disabled = false;
                calculateUnbanEndDate();
            }
            var amountInput = document.getElementById('unbanAmount');
            if (amountInput && value !== 'custom' && value !== 'none') {
                var amounts = { monthly: 299999, '6months': 1899999, yearly: 3599999 };
                amountInput.value = amounts[value] || '';
            }
        });
    }
    if (startDateInput) {
        var newStartDate = startDateInput.cloneNode(true);
        startDateInput.parentNode.replaceChild(newStartDate, startDateInput);
        newStartDate.addEventListener('change', calculateUnbanEndDate);
        newStartDate.addEventListener('input', calculateUnbanEndDate);
    }
    ['unbanCustomDays', 'unbanCustomHours', 'unbanCustomMinutes', 'unbanCustomSeconds'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
            var newEl = el.cloneNode(true);
            el.parentNode.replaceChild(newEl, el);
            newEl.addEventListener('change', calculateUnbanEndDate);
            newEl.addEventListener('input', calculateUnbanEndDate);
        }
    });
    if (saveBtn) {
        var newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);
        newBtn.addEventListener('click', async function() {
            await saveUnbanWithPayment();
        });
    }
}

function initUnbanPaymentMethodSelect() {
    var select = document.getElementById('unbanPaymentMethodSelect');
    var previewDiv = document.getElementById('unbanPaymentMethodPreview');
    if (!select || !previewDiv) return;
    select.addEventListener('change', function() {
        var methodId = this.value;
        var method = PAYMENT_METHODS[methodId];
        if (method && methodId !== '') {
            previewDiv.innerHTML = 
                '<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-hover);border-radius:8px;border:1px solid var(--border-color);margin-top:8px;">' +
                    '<img src="' + method.icon + '" style="width:40px;height:40px;object-fit:contain;border-radius:6px;background:white;padding:4px;" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';">' +
                    '<div style="font-size:0.9rem;font-weight:600;display:none;" class="fallback-text">' + method.name + '</div>' +
                    '<div>' +
                        '<div style="font-weight:600;font-size:0.9rem;">' + method.name + '</div>' +
                        '<div style="font-size:0.75rem;color:var(--text-muted);">To\'lov usuli tanlandi</div>' +
                    '</div>' +
                    '<span style="margin-left:auto;color:var(--color-success);"><i class="fas fa-check-circle"></i></span>' +
                '</div>';
            previewDiv.style.display = 'block';
        } else {
            previewDiv.innerHTML = '';
            previewDiv.style.display = 'none';
        }
    });
    var noteInput = document.getElementById('unbanNote');
    if (noteInput) {
        noteInput.addEventListener('input', function() {
            var text = this.value;
            var detected = detectPaymentMethod(text);
            if (detected && detected.id !== 'other') {
                select.value = detected.id;
                select.dispatchEvent(new Event('change'));
            }
        });
    }
}

function calculateUnbanEndDate() {
    var paymentType = document.getElementById('unbanPaymentType');
    var startDate = document.getElementById('unbanStartDate');
    var endDateInput = document.getElementById('unbanEndDate');
    if (!paymentType || !startDate || !endDateInput) return;
    var type = paymentType.value;
    var start = startDate.value;
    if (!start || type === 'none') {
        endDateInput.value = '';
        return;
    }
    var startDateObj = new Date(start);
    if (isNaN(startDateObj.getTime())) {
        endDateInput.value = '';
        return;
    }
    var endDateObj = new Date(startDateObj);
    if (type === 'custom') {
        var days = parseInt(document.getElementById('unbanCustomDays')?.value) || 0;
        var hours = parseInt(document.getElementById('unbanCustomHours')?.value) || 0;
        var minutes = parseInt(document.getElementById('unbanCustomMinutes')?.value) || 0;
        var seconds = parseInt(document.getElementById('unbanCustomSeconds')?.value) || 0;
        if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
            endDateInput.value = '';
            return;
        }
        endDateObj.setDate(endDateObj.getDate() + days);
        endDateObj.setHours(endDateObj.getHours() + hours);
        endDateObj.setMinutes(endDateObj.getMinutes() + minutes);
        endDateObj.setSeconds(endDateObj.getSeconds() + seconds);
    } else {
        var durationMap = { monthly: 30, '6months': 180, yearly: 365 };
        var days = durationMap[type] || 0;
        if (days === 0) {
            endDateInput.value = '';
            return;
        }
        endDateObj.setDate(endDateObj.getDate() + days);
    }
    var year = endDateObj.getFullYear();
    var month = String(endDateObj.getMonth() + 1).padStart(2, '0');
    var day = String(endDateObj.getDate()).padStart(2, '0');
    var hours = String(endDateObj.getHours()).padStart(2, '0');
    var minutes = String(endDateObj.getMinutes()).padStart(2, '0');
    endDateInput.value = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
}

async function saveUnbanWithPayment() {
    var paymentType = document.getElementById('unbanPaymentType').value;
    var customDays = parseInt(document.getElementById('unbanCustomDays').value) || 0;
    var customHours = parseInt(document.getElementById('unbanCustomHours').value) || 0;
    var customMinutes = parseInt(document.getElementById('unbanCustomMinutes').value) || 0;
    var customSeconds = parseInt(document.getElementById('unbanCustomSeconds').value) || 0;
    var startDate = document.getElementById('unbanStartDate').value;
    var endDate = document.getElementById('unbanEndDate').value;
    var amount = document.getElementById('unbanAmount').value.trim();
    var note = document.getElementById('unbanNote')?.value.trim() || '';
    var select = document.getElementById('unbanPaymentMethodSelect');
    var paymentMethod = select ? select.value : '';
    if (!paymentMethod || paymentMethod === 'other' || paymentMethod === '') {
        var detected = detectPaymentMethod(note);
        paymentMethod = detected.id;
    }
    if (paymentType === 'none') {
        if (!confirm('Haqiqatan ham bu Admin Customerni blokdan chiqarmoqchimisiz (obunasiz)?')) return;
        try {
            var result = await API.post('/admins/' + adminId + '/unban');
            if (result.success) {
                playNotificationSound();
                alert('✅ Admin Customer blokdan chiqarildi!');
                document.getElementById('unbanModal').classList.remove('active');
                document.body.style.overflow = '';
                loadProfile();
            }
        } catch (error) {
            alert('❌ Xatolik: ' + error.message);
        }
        return;
    }
    if (paymentType === 'custom') {
        if (customDays === 0 && customHours === 0 && customMinutes === 0 && customSeconds === 0) {
            alert('❌ Custom vaqt uchun vaqt belgilang!');
            return;
        }
        if (!amount || amount === '') {
            alert('❌ To\'lov miqdorini kiriting!');
            document.getElementById('unbanAmount').focus();
            return;
        }
        var amountNumber = parseInt(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) {
            alert('❌ To\'lov miqdori 0 dan katta bo\'lishi kerak!');
            return;
        }
    }
    if (!startDate) {
        alert('❌ Iltimos, boshlanish sanasini tanlang!');
        document.getElementById('unbanStartDate').focus();
        return;
    }
    if (!paymentMethod || paymentMethod === '') {
        alert('❌ Iltimos, to\'lov usulini tanlang yoki izohda yozing!');
        if (select) select.focus();
        return;
    }
    var saveBtn = document.getElementById('saveUnbanModal');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...';
    try {
        var unbanResult = await API.post('/admins/' + adminId + '/unban');
        if (!unbanResult.success) {
            alert('❌ Blokdan chiqarishda xatolik');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-unlock"></i> Blokdan chiqarish va faollashtirish';
            return;
        }
        var customDuration = null;
        var amountNumber = 0;
        if (paymentType === 'custom') {
            customDuration = { days: customDays, hours: customHours, minutes: customMinutes, seconds: customSeconds };
            amountNumber = parseInt(amount) || 0;
        } else {
            var amounts = { monthly: 299999, '6months': 1899999, yearly: 3599999 };
            amountNumber = amounts[paymentType] || 0;
        }
        var paymentData = {
            amount: amountNumber,
            subscriptionType: paymentType,
            customDuration: customDuration,
            startDate: startDate || null,
            endDate: endDate || null,
            note: note || 'Blokdan chiqarishda qo\'shildi',
            paymentMethod: paymentMethod || 'cash'
        };
        var paymentResult = await API.post('/admins/' + adminId + '/payment', paymentData);
        if (paymentResult.success) {
            var msg = paymentType === 'monthly' ? 'Oylik' : paymentType === '6months' ? '6 oylik' : paymentType === 'yearly' ? 'Yillik' : 'Custom';
            var methodName = PAYMENT_METHODS[paymentMethod]?.name || 'Naqd pul';
            playNotificationSound();
            alert('✅ Admin Customer blokdan chiqarildi va ' + msg + ' to\'lov qo\'shildi!\n💳 To\'lov usuli: ' + methodName);
            document.getElementById('unbanModal').classList.remove('active');
            document.body.style.overflow = '';
            loadProfile();
        } else {
            alert('❌ To\'lov qo\'shishda xatolik: ' + (paymentResult.message || 'Noma\'lum xatolik'));
        }
    } catch (error) {
        console.error('❌ Xatolik:', error);
        alert('❌ Xatolik: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-unlock"></i> Blokdan chiqarish va faollashtirish';
    }
}

// ============================================================
// BAN / DELETE TUGMALARI
// ============================================================
function initButtons() {
    var banBtn = document.getElementById('banBtn');
    if (banBtn) {
        var newBtn = banBtn.cloneNode(true);
        banBtn.parentNode.replaceChild(newBtn, banBtn);
        newBtn.addEventListener('click', function() {
            if (!adminId) return;
            banAdmin(adminId);
        });
    }
    var deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        var newBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newBtn, deleteBtn);
        newBtn.addEventListener('click', async function() {
            if (!confirm('Haqiqatan ham bu Admin Customerni o\'chirmoqchimisiz?')) return;
            try {
                var result = await API.delete('/admins/' + adminId);
                if (result.success) {
                    playNotificationSound();
                    alert('✅ Admin Customer o\'chirildi!');
                    window.location.href = 'admins.html';
                }
            } catch (error) {
                alert('❌ Xatolik: ' + error.message);
            }
        });
    }
}

async function banAdmin(id) {
    if (!currentAdmin || currentAdmin.status === 'blocked') {
        alert('⚠️ Bu Admin Customer allaqachon bloklangan!');
        return;
    }
    var reason = prompt('Bloklash sababini yozing:');
    if (reason === null) return;
    try {
        var result = await API.post('/admins/' + id + '/ban', {
            reason: reason?.trim() || 'Admin panelda cheklov'
        });
        if (result.success) {
            playNotificationSound();
            alert('✅ Admin Customer bloklandi!');
            loadProfile();
        }
    } catch (error) {
        alert('❌ Xatolik: ' + error.message);
    }
}

// ============================================================
// XABAR YUBORISH MODAL
// ============================================================
function initNotificationModal() {
    var modal = document.getElementById('notificationModal');
    var sendBtn = document.getElementById('sendNotificationSubmitBtn');
    var profileSendBtn = document.getElementById('sendNotificationBtn');
    var closeBtn = document.getElementById('closeNotificationModal');
    var cancelBtn = document.getElementById('cancelNotificationModal');
    var resultDiv = document.getElementById('notificationResult');
    if (!modal || !sendBtn) return;
    if (profileSendBtn) {
        var newBtn = profileSendBtn.cloneNode(true);
        profileSendBtn.parentNode.replaceChild(newBtn, profileSendBtn);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            document.getElementById('notificationTitle').value = '';
            document.getElementById('notificationMessage').value = '';
            if (resultDiv) {
                resultDiv.style.display = 'none';
                resultDiv.className = 'form-message';
            }
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish';
            document.getElementById('notificationTitle').focus();
        });
    }
    if (closeBtn) {
        var newBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newBtn, closeBtn);
        newBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish';
        });
    }
    if (cancelBtn) {
        var newBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newBtn, cancelBtn);
        newBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish';
        });
    }
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish';
        }
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Yuborish';
        }
    });
    var newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    newSendBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        sendNotification();
    });
}

// ============================================================
// TAHRIRLASH MODAL
// ============================================================
function initEditModal() {
    var modal = document.getElementById('editModal');
    var editBtn = document.getElementById('editBtn');
    var closeBtn = document.getElementById('closeEditModal');
    var cancelBtn = document.getElementById('cancelEditModal');
    var saveBtn = document.getElementById('saveEditModal');
    if (!modal) return;
    if (editBtn) {
        var newBtn = editBtn.cloneNode(true);
        editBtn.parentNode.replaceChild(newBtn, editBtn);
        newBtn.addEventListener('click', function() {
            if (!currentAdmin) return;
            openEditModal();
            setTimeout(function() {
                initPasswordToggles();
            }, 100);
        });
    }
    if (closeBtn) {
        var newBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newBtn, closeBtn);
        newBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    if (cancelBtn) {
        var newBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newBtn, cancelBtn);
        newBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    if (saveBtn) {
        var newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);
        newBtn.addEventListener('click', async function() {
            await saveEdit();
        });
    }
}

function openEditModal() {
    if (!currentAdmin) return;
    document.getElementById('editFullName').value = currentAdmin.fullName || '';
    document.getElementById('editEmail').value = currentAdmin.email || '';
    document.getElementById('editPhone').value = currentAdmin.phone || '';
    document.getElementById('editStatus').value = currentAdmin.status || 'active';
    document.getElementById('editPassword').value = '';
    document.getElementById('editModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(function() {
        initPasswordToggles();
    }, 100);
}

async function saveEdit() {
    var fullName = document.getElementById('editFullName').value.trim();
    var email = document.getElementById('editEmail').value.trim();
    var phone = document.getElementById('editPhone').value.trim();
    var status = document.getElementById('editStatus').value;
    var newPassword = document.getElementById('editPassword').value.trim();
    if (!fullName || !email) {
        alert('F.I.SH va Email majburiy!');
        return;
    }
    if (!email.includes('@')) {
        alert('Email noto\'g\'ri formatda!');
        return;
    }
    try {
        var updateData = { fullName: fullName, email: email, phone: phone, status: status === 'none' ? 'inactive' : status };
        if (newPassword && newPassword.length >= 6) {
            updateData.password = newPassword;
        } else if (newPassword && newPassword.length < 6) {
            alert('Yangi parol kamida 6 ta belgi bo\'lishi kerak!');
            return;
        }
        if (status === 'none') {
            updateData.subscription = { type: 'none', status: 'inactive', startDate: null, endDate: null, amount: 0 };
        }
        var response = await API.put('/admins/' + adminId, updateData);
        if (response.success) {
            playNotificationSound();
            alert('✅ Admin muvaffaqiyatli yangilandi!');
            document.getElementById('editModal').classList.remove('active');
            document.body.style.overflow = '';
            document.getElementById('editPassword').value = '';
            loadProfile();
        } else {
            alert('❌ Xatolik: ' + (response.message || 'Noma\'lum xatolik'));
        }
    } catch (error) {
        alert('❌ Xatolik: ' + error.message);
    }
}

// ============================================================
// YORDAMCHI FUNKSIYALAR
// ============================================================
function showError(message) {
    console.error('⚠️ Xatolik:', message);
    var div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:14px 18px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#dc2626;max-width:400px;box-shadow:0 10px 40px rgba(0,0,0,0.1);display:flex;align-items:center;gap:10px;font-size:0.85rem;';
    div.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>' + message + '</span><button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;color:#dc2626;cursor:pointer;font-size:1.1rem;">×</button>';
    document.body.appendChild(div);
    setTimeout(function() { if (div.parentElement) div.remove(); }, 5000);
}

function showSuccess(message) {
    console.log('✅ Muvaffaqiyat:', message);
    var div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;padding:14px 18px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;color:#065f46;max-width:400px;box-shadow:0 10px 40px rgba(0,0,0,0.1);display:flex;align-items:center;gap:10px;font-size:0.85rem;';
    div.innerHTML = '<i class="fas fa-check-circle"></i><span>' + message + '</span><button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;color:#065f46;cursor:pointer;font-size:1.1rem;">×</button>';
    document.body.appendChild(div);
    setTimeout(function() { if (div.parentElement) div.remove(); }, 3000);
}

// ============================================================
// CLEANUP
// ============================================================
window.addEventListener('beforeunload', function() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    if (notificationRefreshInterval) {
        clearInterval(notificationRefreshInterval);
        notificationRefreshInterval = null;
    }
});

console.log('✅ admin-profile.js yuklandi (Admin-Main)');
