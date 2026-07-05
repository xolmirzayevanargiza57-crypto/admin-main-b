// ============================================
// ADMIN ADD - AVTOMATIK SANA + 6 OYLIK
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
    const subscriptionDisplay = document.getElementById('subscriptionDisplay');
    const subscriptionType = document.getElementById('subscriptionType');
    const amountInput = document.getElementById('amount');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    // Modal elementlari
    const modal = document.getElementById('subscriptionModal');
    const openModalBtn = document.getElementById('openSubscriptionModal');
    const closeModalBtn = document.getElementById('closeSubscriptionModal');
    const cancelModalBtn = document.getElementById('cancelSubscriptionModal');
    const confirmModalBtn = document.getElementById('confirmSubscriptionModal');
    const options = document.querySelectorAll('.subscription-option');
    
    let selectedOption = null;
    let selectedValue = 'none';
    let selectedAmount = 0;
    let selectedMonths = 0;

    // ============================================
    // NARXLAR
    // ============================================
    const PRICE_LABELS = {
        monthly: '299,999 so\'m',
        '6months': '1,899,999 so\'m',
        yearly: '3,599,999 so\'m',
        none: '0 so\'m'
    };

    const TYPE_LABELS = {
        monthly: 'Oylik (299,999 so\'m)',
        '6months': '6 oylik (1,899,999 so\'m)',
        yearly: 'Yillik (3,599,999 so\'m)',
        none: 'Obuna yo\'q'
    };

    const MONTHS_MAP = {
        monthly: 1,
        '6months': 6,
        yearly: 12,
        none: 0
    };

    // ============================================
    // AVTOMATIK SANA - BUGUNGI KUN
    // ============================================
    function setDefaultDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        startDate.value = year + '-' + month + '-' + day;
    }
    setDefaultDate();

    // ============================================
    // TUGASH SANASINI HISOBLASH
    // ============================================
    function calculateEndDate(months, start) {
        if (!start || months === 0) {
            endDate.value = '';
            return;
        }
        
        const startDateObj = new Date(start);
        const endDateObj = new Date(startDateObj);
        endDateObj.setMonth(endDateObj.getMonth() + months);
        
        const year = endDateObj.getFullYear();
        const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(endDateObj.getDate()).padStart(2, '0');
        endDate.value = year + '-' + month + '-' + day;
    }

    // Boshlanish sanasi o'zgarganda
    startDate.addEventListener('change', function() {
        const type = subscriptionType.value;
        const months = MONTHS_MAP[type] || 0;
        calculateEndDate(months, this.value);
    });

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
    // MODAL
    // ============================================
    openModalBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // ============================================
    // OBUNA OPTION TANLASH
    // ============================================
    options.forEach(function(option) {
        option.addEventListener('click', function() {
            options.forEach(function(opt) {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            selectedOption = this;
            selectedValue = this.dataset.value;
            selectedAmount = parseInt(this.dataset.amount);
            selectedMonths = parseInt(this.dataset.months);
        });
    });

    // ============================================
    // MODAL CONFIRM
    // ============================================
    confirmModalBtn.addEventListener('click', function() {
        if (!selectedOption) {
            alert('Iltimos, obuna turini tanlang!');
            return;
        }

        const label = TYPE_LABELS[selectedValue] || 'Obuna yo\'q';
        subscriptionDisplay.value = label;
        subscriptionType.value = selectedValue;
        
        if (selectedAmount > 0) {
            amountInput.value = selectedAmount.toLocaleString() + ' so\'m';
            // Kalendarni faollashtirish
            startDate.disabled = false;
            startDate.readOnly = false;
            // Bugungi sanani qo'yish
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            startDate.value = year + '-' + month + '-' + day;
            // Tugash sanasini hisoblash
            calculateEndDate(selectedMonths, startDate.value);
        } else {
            amountInput.value = '0 so\'m';
            startDate.disabled = true;
            startDate.readOnly = true;
            startDate.value = '';
            endDate.value = '';
            // Bugungi sanani qayta qo'yish
            setDefaultDate();
        }

        closeModal();
    });

    // ============================================
    // REAL-TIME VALIDATION
    // ============================================
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');

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
        const phone = document.getElementById('phone').value.trim();
        const password = passwordInput.value;
        const subscriptionTypeValue = subscriptionType.value;
        const startDateValue = startDate.value;

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

        if (subscriptionTypeValue !== 'none' && !startDateValue) {
            showMessage('Boshlanish sanasini tanlang!', 'error');
            return;
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
            const data = await API.post('/admins', {
                fullName: fullName,
                email: email,
                phone: phone,
                password: password,
                subscriptionType: subscriptionTypeValue,
                startDate: startDateValue,
                endDate: endDate.value
            });

            if (data.success) {
                showMessage('✅ Admin Customer muvaffaqiyatli yaratildi!', 'success');
                form.reset();
                passwordInput.value = '';
                subscriptionDisplay.value = '';
                subscriptionType.value = 'none';
                amountInput.value = '0 so\'m';
                startDate.value = '';
                endDate.value = '';
                startDate.disabled = true;
                startDate.readOnly = true;
                setDefaultDate();
                fullNameInput.classList.remove('success', 'error');
                emailInput.classList.remove('success', 'error');
                passwordInput.classList.remove('success', 'error');
                setTimeout(function() {
                    window.location.href = 'admins.html';
                }, 2000);
            } else {
                showMessage(data.message || 'Xatolik yuz berdi!', 'error');
            }
        } catch (error) {
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