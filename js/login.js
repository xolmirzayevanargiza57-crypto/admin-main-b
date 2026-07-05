// ============================================
// LOGIN - ADMIN MAIN
// ============================================

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
            if (icon) {
                icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            }
        });
    }

    // Email validation - BLUR da
    emailInput.addEventListener('blur', function() {
        const value = this.value.trim();
        const isValid = value.includes('@') && value.includes('.');
        this.classList.remove('success', 'error');
        if (value.length > 0) {
            this.classList.add(isValid ? 'success' : 'error');
        }
    });

    // Password validation - BLUR da
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
        
        // Email tekshirish
        if (!email || !email.includes('@') || !email.includes('.')) {
            emailInput.classList.add('error');
            emailInput.classList.remove('success');
            isValid = false;
        } else {
            emailInput.classList.add('success');
            emailInput.classList.remove('error');
        }
        
        // Password tekshirish
        if (!password || password.length < 6) {
            passwordInput.classList.add('error');
            passwordInput.classList.remove('success');
            isValid = false;
        } else {
            passwordInput.classList.add('success');
            passwordInput.classList.remove('error');
        }

        if (!isValid) {
            showError('Email va parolni to\'g\'ri kiriting!');
            return;
        }

        // Loading holati
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kutilmoqda...';
        errorDiv.classList.remove('show');

        try {
            const result = await Auth.login(email, password);
            
            if (result.success) {
                // Muvaffaqiyatli login
                btn.innerHTML = '<i class="fas fa-check"></i> Muvaffaqiyatli!';
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 500);
            } else {
                showError(result.error || 'Email yoki parol noto\'g\'ri');
                document.querySelector('.login-card').style.animation = 'shake 0.5s ease';
                setTimeout(() => {
                    document.querySelector('.login-card').style.animation = '';
                }, 500);
                btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Kirish';
                btn.disabled = false;
            }
        } catch (error) {
            showError('Tarmoq xatosi! Qayta urinib ko\'ring.');
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

    function showError(msg) {
        errorText.textContent = msg;
        errorDiv.classList.add('show');
    }
});

// Shake animatsiyasi
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-10px); }
        40%, 80% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);