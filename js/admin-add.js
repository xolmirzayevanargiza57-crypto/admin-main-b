// ============================================
// ADMIN ADD - TO'LIQ
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
        
        // ✅ Mahalliy vaqt formatida (datetime-local uchun)
        const year = endDateObj.getFullYear();
        const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(endDateObj.getDate()).padStart(2, '0');
        const hours = String(endDateObj.getHours()).padStart(2, '0');
        const minutes = String(endDateObj.getMinutes()).padStart(2, '0');
        
        endDate.value = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
    }

    // ============================================
    // O'ZGARISHLARDA HISOBLASH
    // ============================================
    startDate.addEventListener('change', calculateEndDate);
    customDays.addEventListener('input', calculateEndDate);
    customHours.addEventListener('input', calculateEndDate);
    customMinutes.addEventListener('input', calculateEndDate);
    customSeconds.addEventListener('input', calculateEndDate);

    // ============================================
    // DEFAULT DATE - HOZIRGI VAQT
    // ============================================
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
                amount: amount ? parseInt(amount) : 0
            };

            console.log('📤 Yuborilayotgan ma\'lumotlar:', data);

            const response = await API.post('/admins', data);

            if (response.success) {
                showMessage('✅ Admin Customer muvaffaqiyatli yaratildi!', 'success');
                form.reset();
                passwordInput.value = '';
                subscriptionType.value = 'none';
                amountInput.value = '';
                customGroup.style.display = 'none';
                setDefaultDate();
                fullNameInput.classList.remove('success', 'error');
                emailInput.classList.remove('success', 'error');
                passwordInput.classList.remove('success', 'error');
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
