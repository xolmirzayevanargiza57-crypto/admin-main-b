// ============================================================
// LOGIN - Admin Main Frontend (TO'LIQ)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const btn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const passwordToggle = document.getElementById('passwordToggle');

    // Agar allaqachon login qilgan bo'lsa
    if (Auth.isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Password toggle
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            const icon = this.querySelector('i');
            if (icon) icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    }

    // Email validation
    emailInput.addEventListener('blur', function() {
        const value = this.value.trim();
        const isValid = value.includes('@') && value.includes('.');
        this.classList.remove('success', 'error');
        if (value.length > 0) {
            this.classList.add(isValid ? 'success' : 'error');
        }
    });

    // Password validation
    passwordInput.addEventListener('blur', function() {
        const value = this.value;
        const isValid = value.length >= 6;
        this.classList.remove('success', 'error');
        if (value.length > 0) {
            this.classList.add(isValid ? 'success' : 'error');
        }
    });

    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        let isValid = true;
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

        if (!isValid) {
            errorText.textContent = 'Email va parolni to\'g\'ri kiriting!';
            errorDiv.classList.add('show');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kutilmoqda...';
        errorDiv.classList.remove('show');

        try {
            const result = await Auth.login(email, password);
            
            if (result.success) {
                localStorage.removeItem('authMessage');
                btn.innerHTML = '<i class="fas fa-check"></i> Muvaffaqiyatli!';
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 500);
            } else {
                // ⭐ BLOKLANGAN YOKI OBUNA TUGAGAN USER
                if (result.action === 'contact_support') {
                    errorText.textContent = result.error || 'Iltimos, yordam uchun raqamga qo\'ng\'iroq qiling.';
                    errorDiv.classList.add('show');
                    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Kirish';
                    btn.disabled = false;
                } else {
                    errorText.textContent = result.error || 'Email yoki parol noto\'g\'ri';
                    errorDiv.classList.add('show');
                    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Kirish';
                    btn.disabled = false;
                }
            }
        } catch (error) {
            errorText.textContent = error.message || 'Tarmoq xatosi! Qayta urinib ko\'ring.';
            errorDiv.classList.add('show');
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Kirish';
            btn.disabled = false;
        }
    });

    // Enter tugmasi
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            form.dispatchEvent(new Event('submit'));
        }
    });

    // Xatolikni tozalash
    [emailInput, passwordInput].forEach(inp => {
        inp.addEventListener('input', () => {
            errorText.textContent = '';
            errorDiv.classList.remove('show');
        });
        inp.addEventListener('focus', () => {
            errorText.textContent = '';
            errorDiv.classList.remove('show');
        });
    });
});
