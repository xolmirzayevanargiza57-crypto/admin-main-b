// ============================================
// THEME - LIGHT / DARK
// ============================================

const Theme = {
    current: localStorage.getItem('theme') || 'system',

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },

    init() {
        const initialTheme = this.current === 'system' ? 'system' : this.current;
        this.applyTheme(initialTheme);
        this.setupListeners();
    },

    applyTheme(theme) {
        const actualTheme = theme === 'system' ? this.getSystemTheme() : theme;
        document.documentElement.setAttribute('data-theme', actualTheme);
        document.body.setAttribute('data-theme', actualTheme);
        localStorage.setItem('theme', theme);
        this.current = theme;
        this.updateIcons(actualTheme);
        this.setActiveThemeOption(theme);
        this.updateThemeStatus(theme, actualTheme);
    },

    toggle() {
        const newTheme = this.current === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    },

    updateIcons(actualTheme) {
        const isDark = actualTheme === 'dark';

        const floatingBtn = document.getElementById('themeToggle');
        if (floatingBtn) {
            const icon = floatingBtn.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
        }

        const headerBtn = document.getElementById('themeToggleSmall');
        if (headerBtn) {
            const icon = headerBtn.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    },

    setActiveThemeOption(theme) {
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    },

    updateThemeStatus(theme, actualTheme) {
        const themeStatus = document.getElementById('themeStatus');
        if (!themeStatus) return;

        if (theme === 'system') {
            themeStatus.textContent = `Hozirgi holat: Avtomatik (${actualTheme === 'dark' ? 'Qorong\'' : 'Yorug\''})`;
        } else {
            themeStatus.textContent = `Hozirgi holat: ${actualTheme === 'dark' ? 'Qorong\'' : 'Yorug\''}`;
        }
    },

    setupListeners() {
        const floatingBtn = document.getElementById('themeToggle');
        if (floatingBtn) {
            floatingBtn.addEventListener('click', () => {
                this.toggle();
            });
        }
        
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.applyTheme(theme);
                document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeMedia.addEventListener('change', () => {
            if (this.current === 'system') {
                this.applyTheme('system');
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Theme.init());
} else {
    Theme.init();
}