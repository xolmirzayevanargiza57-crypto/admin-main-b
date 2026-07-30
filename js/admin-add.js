// ============================================
// ADMIN ADD - TO'LIQ (Admin-Main)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (!Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    // ============================================
    // ELEMENTLAR
    // ============================================
    const form = document.getElementById('addAdminForm');
    const submitBtn = document.getElementById('submitBtn');
    const messageDiv = document.getElementById('formMessage');
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');
    const subscriptionType = document.getElementById('subscriptionType');
    const customGroup = document.getElementById('customDurationGroup');
    const customDays = document.getElementById('customDays');
    const customHours = document.getElementById('customHours');
    const customMinutes = document.getElementById('customMinutes');
    const customSeconds = document.getElementById('customSeconds');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const amountInput = document.getElementById('amount');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    
    // ⭐ YANGI QO'SHILGAN ELEMENTLAR
    const paymentMethodSelect = document.getElementById('paymentMethodSelect');
    const noteInput = document.getElementById('note');
    const previewDiv = document.getElementById('paymentMethodPreview');

    // ============================================================
    // ⭐ TO'LOV USULI MA'LUMOTLARI (Admin-Main)
    // ============================================================
    const PAYMENT_METHODS = {
        cash: {
            id: 'cash',
            name: 'Naqd pul',
            icon: 'https://www.gazeta.uz/sp/32221828/img/tild3365-3235-4161-a437-316637323436__banknoti-uzb.png',
            keywords: ['naqd', 'cash', 'pul', 'qog\'oz'],
            emoji: '💵'
        },
        click: {
            id: 'click',
            name: 'Click',
            icon: 'https://minora.uz/images/logo/click-logo.png',
            keywords: ['click'],
            emoji: '📱'
        },
        paynet: {
            id: 'paynet',
            name: 'Paynet',
            icon: 'https://frankfurt.apollo.olxcdn.com/v1/files/qum4yr71mite1-UZ/image',
            keywords: ['paynet'],
            emoji: '💳'
        },
        payme: {
            id: 'payme',
            name: 'Payme',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Paymeuz_logo.png',
            keywords: ['payme'],
            emoji: '📲'
        },
        uzum: {
            id: 'uzum',
            name: 'Uzum',
            icon: 'https://admin.uzum.com/wp-content/uploads/2024/09/og-image.jpg',
            keywords: ['uzum', 'uzum bank'],
            emoji: '🟣'
        },
        uzcard: {
            id: 'uzcard',
            name: 'Uzcard',
            icon: 'https://bank.uz/upload/yp/static/058/0584015c28a78f817d6385b99ed3680a.jpg',
            keywords: ['uzcard', 'uz card'],
            emoji: '💳'
        },
        humo: {
            id: 'humo',
            name: 'Humo',
            icon: 'https://payform.global/img/humo.png',
            keywords: ['humo'],
            emoji: '🟠'
        },
        visa: {
            id: 'visa',
            name: 'Visa',
            icon: 'https://i.pinimg.com/originals/1f/50/0c/1f500cb49b3c529f6a88b9a0fa6070e4.jpg?nii=t',
            keywords: ['visa'],
            emoji: '💳'
        },
        agrobank: {
            id: 'agrobank',
            name: 'Agrobank',
            icon: 'https://cdn.forbes.ru/forbes-static/new/2023/03/AgroBank-mini-6414643a35289.jpg',
            keywords: ['agrobank', 'agro bank'],
            emoji: '🌾'
        },
        tbc: {
            id: 'tbc',
            name: 'TBC Bank',
            icon: 'https://yt3.googleusercontent.com/ytc/AIdro_k6EoLZ1l7Xp-B7UADAullK6FNC9C0HE_74uOF2a46H3V4=s900-c-k-c0x00ffffff-no-rj',
            keywords: ['tbc', 'tbcbank'],
            emoji: '🔷'
        },
        anorbank: {
            id: 'anorbank',
            name: 'Anorbank',
            icon: 'https://cbu.uz/upload/iblock/53c/3.jpg',
            keywords: ['anorbank', 'anor bank', 'anor'],
            emoji: '🍊'
        },
        xazna: {
            id: 'xazna',
            name: 'Xazna Bank',
            icon: 'https://jet-back.bank.uz/uploads/article_blocks/d88f203848c154c40be0e793c10fb9a5.webp',
            keywords: ['xazna', 'xasna', 'xazna bank', 'g\'azna', 'gazna'],
            emoji: '🏦'
        },
        anjir: {
            id: 'anjir',
            name: 'Anjir Pay',
            icon: 'https://yt3.googleusercontent.com/CY0fy5wKvwqDsmlRnUkV6xFQzGJQbxbhxMCIPMehKgBgawYm4KNlgt6dp8avty7TQpb8Y8h1=s900-c-k-c0x00ffffff-no-rj',
            keywords: ['anjir', 'anjir pay', 'anjir bank'],
            emoji: '🍐'
        },
        hamkorbank: {
            id: 'hamkorbank',
            name: 'Hamkor Bank',
            icon: 'https://img.hhcdn.ru/employer-logo-original-round/6939937.png',
            keywords: ['hamkor', 'hamkorbank', 'hamkor bank'],
            emoji: '🏛️'
        },
        xalqbanki: {
            id: 'xalqbanki',
            name: 'Xalq Banki',
            icon: 'https://api.onmap.uz/storage/01HYXMSPSC7T0458S4YZV2XJRK.svg',
            keywords: ['xalq', 'xalqbanki', 'xalq banki', 'xalq bank'],
            emoji: '🏛️'
        },
        paypal: {
            id: 'paypal',
            name: 'PayPal',
            icon: 'https://smartpress.by/upload/iblock/85f/dn546q6c891cflormfosv72ixoo1l4gv/paypal.jpg',
            keywords: ['paypal', 'pay pal'],
            emoji: '💳'
        },
        mastercard: {
            id: 'mastercard',
            name: 'MasterCard',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/MasterCard_Logo.svg/960px-MasterCard_Logo.svg.png',
            keywords: ['mastercard', 'master card', 'master'],
            emoji: '💳'
        },
        americanexpress: {
            id: 'americanexpress',
            name: 'American Express',
            icon: 'https://live.staticflickr.com/65535/48649342553_8e0daf6313_b.jpg',
            keywords: ['american', 'americanexpress', 'american express', 'amex'],
            emoji: '💳'
        },
        tezpay: {
            id: 'tezpay',
            name: 'TezPay',
            icon: 'https://static.rustore.ru/imgproxy/c9GvEWTzaNNgKCBIj39zh7MM3hJXu-lExCr0HfkejUc/preset:vk_og_img/plain/https://static.rustore.ru/apk/2063541467/content/ICON/39061c50-35b1-484f-a7b2-4329fa0b9c77.png@webp',
            keywords: ['tezpay', 'tez pay'],
            emoji: '⚡'
        },
        applepay: {
            id: 'applepay',
            name: 'Apple Pay',
            icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968230.png',
            keywords: ['apple pay', 'applepay', 'apple'],
            emoji: '🍎'
        },
        other: {
            id: 'other',
            name: 'Boshqa',
            icon: 'https://png.pngtree.com/png-clipart/20211017/original/pngtree-credit-card-vector-illustration-png-image_6857353.png',
            keywords: ['karta', 'card', 'bank', 'to\'lov'],
            emoji: '💳'
        }
    };

    // ============================================================
    // ⭐ TO'LOV USULINI AVTOMATIK ANIQLASH
    // ============================================================
    function detectPaymentMethod(text) {
        if (!text) return PAYMENT_METHODS.other;
        const lowerText = text.toLowerCase().trim();
        
        if (lowerText.includes('uzum')) {
            return PAYMENT_METHODS.uzum;
        }
        if (lowerText.includes('tezpay') || lowerText.includes('tez pay')) {
            return PAYMENT_METHODS.tezpay;
        }
        if (lowerText.includes('apple pay') || lowerText.includes('applepay') || lowerText.includes('apple')) {
            return PAYMENT_METHODS.applepay;
        }
        if (lowerText.includes('hamkor') || lowerText.includes('hamkorbank')) {
            return PAYMENT_METHODS.hamkorbank;
        }
        if (lowerText.includes('xalq')) {
            return PAYMENT_METHODS.xalqbanki;
        }
        if (lowerText.includes('paypal') || lowerText.includes('pay pal')) {
            return PAYMENT_METHODS.paypal;
        }
        if (lowerText.includes('mastercard') || lowerText.includes('master card') || lowerText.includes('master')) {
            return PAYMENT_METHODS.mastercard;
        }
        if (lowerText.includes('american') || lowerText.includes('americanexpress') || lowerText.includes('amex')) {
            return PAYMENT_METHODS.americanexpress;
        }
        if (lowerText.includes('click')) {
            return PAYMENT_METHODS.click;
        }
        if (lowerText.includes('uzcard') || lowerText.includes('uz card')) {
            return PAYMENT_METHODS.uzcard;
        }
        if (lowerText.includes('xazna') || lowerText.includes('g\'azna') || lowerText.includes('gazna')) {
            return PAYMENT_METHODS.xazna;
        }
        if (lowerText.includes('pay') && !lowerText.includes('paypal') && !lowerText.includes('payme') && !lowerText.includes('paynet')) {
            return PAYMENT_METHODS.applepay;
        }
        
        for (const [key, method] of Object.entries(PAYMENT_METHODS)) {
            if (key === 'other') continue;
            if (method.keywords && method.keywords.some(kw => lowerText.includes(kw))) {
                return method;
            }
        }
        return PAYMENT_METHODS.other;
    }

    // ============================================================
    // ⭐ PAYMENT METHOD PREVIEW
    // ============================================================
    function initPaymentMethodSelect() {
        if (!paymentMethodSelect || !previewDiv) return;
        
        paymentMethodSelect.addEventListener('change', function() {
            const methodId = this.value;
            const method = PAYMENT_METHODS[methodId];
            if (method && methodId !== '') {
                previewDiv.innerHTML = `
                    <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-hover);border-radius:8px;border:1px solid var(--border-color);margin-top:8px;">
                        <img src="${method.icon}" style="width:40px;height:40px;object-fit:contain;border-radius:6px;background:white;padding:4px;" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div style="font-size:0.9rem;font-weight:600;display:none;" class="fallback-text">${method.name}</div>
                        <div>
                            <div style="font-weight:600;font-size:0.9rem;">${method.name}</div>
                            <div style="font-size:0.75rem;color:var(--text-muted);">To'lov usuli tanlandi</div>
                        </div>
                        <span style="margin-left:auto;color:var(--color-success);"><i class="fas fa-check-circle"></i></span>
                    </div>
                `;
                previewDiv.style.display = 'block';
            } else {
                previewDiv.innerHTML = '';
                previewDiv.style.display = 'none';
            }
        });
        
        // ⭐ Izoh orqali avtomatik aniqlash
        if (noteInput) {
            noteInput.addEventListener('input', function() {
                const text = this.value;
                const detected = detectPaymentMethod(text);
                if (detected && detected.id !== 'other') {
                    paymentMethodSelect.value = detected.id;
                    paymentMethodSelect.dispatchEvent(new Event('change'));
                }
            });
        }
    }
    
    // ⭐ INIT PAYMENT METHOD SELECT
    initPaymentMethodSelect();

    // ============================================
    // OBUNA TURI O'ZGARGANDA
    // ============================================
    subscriptionType.addEventListener('change', function() {
        if (this.value === 'custom') {
            customGroup.style.display = 'block';
            amountInput.value = '';
        } else {
            customGroup.style.display = 'none';
            const amounts = {
                'none': 0,
                'monthly': 299999,
                '6months': 1899999,
                'yearly': 3599999
            };
            amountInput.value = amounts[this.value] || '';
        }
        calculateEndDate();
    });

    // ============================================
    // TUGASH SANASINI HISOBLASH (TO'G'RI)
    // ============================================
    function calculateEndDate() {
        const type = subscriptionType.value;
        const start = startDate.value;
        
        if (!start || type === 'none') {
            endDate.value = '';
            return;
        }
        
        const startDateObj = new Date(start);
        const endDateObj = new Date(startDateObj);
        
        if (type === 'custom') {
            const days = parseInt(customDays.value) || 0;
            const hours = parseInt(customHours.value) || 0;
            const minutes = parseInt(customMinutes.value) || 0;
            const seconds = parseInt(customSeconds.value) || 0;
            
            endDateObj.setDate(endDateObj.getDate() + days);
            endDateObj.setHours(endDateObj.getHours() + hours);
            endDateObj.setMinutes(endDateObj.getMinutes() + minutes);
            endDateObj.setSeconds(endDateObj.getSeconds() + seconds);
        } else {
            const durationMap = {
                'monthly': 30,
                '6months': 180,
                'yearly': 365
            };
            const days = durationMap[type] || 0;
            endDateObj.setDate(endDateObj.getDate() + days);
        }
        
        const year = endDateObj.getFullYear();
        const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(endDateObj.getDate()).padStart(2, '0');
        const hours = String(endDateObj.getHours()).padStart(2, '0');
        const minutes = String(endDateObj.getMinutes()).padStart(2, '0');
        
        endDate.value = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
    }

    startDate.addEventListener('change', calculateEndDate);
    customDays.addEventListener('input', calculateEndDate);
    customHours.addEventListener('input', calculateEndDate);
    customMinutes.addEventListener('input', calculateEndDate);
    customSeconds.addEventListener('input', calculateEndDate);

    function setDefaultDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        startDate.value = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
        calculateEndDate();
    }
    setDefaultDate();

    // ============================================
    // PASSWORD TOGGLE
    // ============================================
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            const icon = this.querySelector('i');
            if (icon) {
                icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        });
    }

    // ============================================
    // REAL-TIME VALIDATION
    // ============================================
    function validateField(input, condition) {
        input.addEventListener('blur', function() {
            const value = this.value.trim();
            const isValid = condition(value);
            this.classList.remove('success', 'error');
            if (value.length > 0) {
                this.classList.add(isValid ? 'success' : 'error');
            }
        });
    }

    validateField(fullNameInput, function(v) { return v.length > 0; });
    validateField(emailInput, function(v) { return v.includes('@') && v.includes('.'); });
    validateField(passwordInput, function(v) { return v.length >= 6; });

    // ============================================
    // FORM SUBMIT
    // ============================================
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const password = passwordInput.value;
        const type = subscriptionType.value;
        const start = startDate.value;
        const end = endDate.value;
        const amount = amountInput.value.trim();
        
        // ⭐ TO'LOV USULI
        let paymentMethod = paymentMethodSelect ? paymentMethodSelect.value : '';
        const note = noteInput ? noteInput.value.trim() : '';
        
        // Agar select dan kelmasa, matn orqali aniqlash
        if (!paymentMethod || paymentMethod === 'other' || paymentMethod === '') {
            const detected = detectPaymentMethod(note);
            paymentMethod = detected.id;
        }
        
        let isValid = true;

        if (!fullName || fullName.length === 0) {
            fullNameInput.classList.add('error');
            fullNameInput.classList.remove('success');
            isValid = false;
        } else {
            fullNameInput.classList.add('success');
            fullNameInput.classList.remove('error');
        }

        if (!email || !email.includes('@') || !email.includes('.')) {
            emailInput.classList.add('error');
            emailInput.classList.remove('success');
            isValid = false;
        } else {
            emailInput.classList.add('success');
            emailInput.classList.remove('error');
        }

        if (!password || password.length < 6) {
            passwordInput.classList.add('error');
            passwordInput.classList.remove('success');
            isValid = false;
        } else {
            passwordInput.classList.add('success');
            passwordInput.classList.remove('error');
        }

        if (type !== 'none' && !start) {
            showMessage('Boshlanish sanasini tanlang!', 'error');
            return;
        }

        if (type === 'custom') {
            const days = parseInt(customDays.value) || 0;
            const hours = parseInt(customHours.value) || 0;
            const minutes = parseInt(customMinutes.value) || 0;
            const seconds = parseInt(customSeconds.value) || 0;
            if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
                showMessage('Custom vaqt uchun vaqt belgilang!', 'error');
                return;
            }
        }

        if (!isValid) {
            showMessage('Iltimos, barcha maydonlarni to\'g\'ri to\'ldiring!', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...';
        messageDiv.className = 'form-message';
        messageDiv.style.display = 'none';

        try {
            let customDuration = null;
            if (type === 'custom') {
                customDuration = {
                    days: parseInt(customDays.value) || 0,
                    hours: parseInt(customHours.value) || 0,
                    minutes: parseInt(customMinutes.value) || 0,
                    seconds: parseInt(customSeconds.value) || 0
                };
            }

            const data = {
                fullName: fullName,
                email: email,
                phone: phone,
                password: password,
                subscriptionType: type,
                startDate: start || null,
                endDate: end || null,
                customDuration: customDuration,
                amount: amount ? parseInt(amount) : 0,
                paymentMethod: paymentMethod || 'cash',
                note: note || 'Admin tomonidan yaratilgan'
            };

            console.log('📤 Yuborilayotgan ma\'lumotlar:', data);

            const response = await API.post('/admins', data);

            if (response.success) {
                const methodName = PAYMENT_METHODS[paymentMethod]?.name || 'Naqd pul';
                showMessage(`✅ Admin Customer muvaffaqiyatli yaratildi!\n💳 To'lov usuli: ${methodName}`, 'success');
                form.reset();
                passwordInput.value = '';
                subscriptionType.value = 'none';
                amountInput.value = '';
                customGroup.style.display = 'none';
                setDefaultDate();
                fullNameInput.classList.remove('success', 'error');
                emailInput.classList.remove('success', 'error');
                passwordInput.classList.remove('success', 'error');
                if (previewDiv) {
                    previewDiv.innerHTML = '';
                    previewDiv.style.display = 'none';
                }
                setTimeout(function() {
                    window.location.href = 'admins.html';
                }, 2000);
            } else {
                showMessage(response.message || 'Xatolik yuz berdi!', 'error');
            }
        } catch (error) {
            console.error('❌ Xatolik:', error);
            showMessage(error.message || 'Server xatosi! Qayta urinib ko\'ring.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Saqlash';
        }
    });

    function showMessage(msg, type) {
        messageDiv.textContent = msg;
        messageDiv.className = 'form-message ' + type;
        messageDiv.style.display = 'block';
        setTimeout(function() {
            messageDiv.style.display = 'none';
        }, 5000);
    }
});
