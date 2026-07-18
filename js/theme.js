// ============================================
// THEME - LIGHT / DARK / SYSTEM (TO'LIQ)
// ============================================

const Theme = {
    current: localStorage.getItem('theme') || 'system',

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },

    init() {
        const initialTheme = this.current;
        this.applyTheme(initialTheme);
        this.setupListeners();
        
        // ✅ System theme o'zgarganda avtomatik yangilash
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.current === 'system') {
                this.applyTheme('system');
            }
        });
    },

    applyTheme(theme) {
        const actualTheme = theme === 'system' ? this.getSystemTheme() : theme;
        
        // ✅ HTML va body ga qo'llash
        document.documentElement.setAttribute('data-theme', actualTheme);
        document.body.setAttribute('data-theme', actualTheme);
        
        localStorage.setItem('theme', theme);
        this.current = theme;
        
        this.updateIcons(actualTheme);
        this.setActiveThemeOption(theme);
        this.updateThemeStatus(theme, actualTheme);
        
        // ✅ Chart.js ni yangilash (agar mavjud bo'lsa)
        this.updateCharts();
    },

    toggle() {
        const newTheme = this.current === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    },

    updateIcons(actualTheme) {
        const isDark = actualTheme === 'dark';

        // Floating button
        const floatingBtn = document.getElementById('themeToggle');
        if (floatingBtn) {
            const icon = floatingBtn.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
        }

        // Header button
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

        const themeNames = {
            light: 'Yorug\'',
            dark: 'Qorong\'u'
        };

        if (theme === 'system') {
            themeStatus.textContent = `Hozirgi holat: Avtomatik (${themeNames[actualTheme]})`;
        } else {
            themeStatus.textContent = `Hozirgi holat: ${themeNames[actualTheme]}`;
        }
    },

    updateCharts() {
        if (typeof Chart !== 'undefined') {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            Chart.defaults.color = isDark ? '#ffffff' : '#1c1c1e';
        }
    },

    setupListeners() {
        // Floating button
        const floatingBtn = document.getElementById('themeToggle');
        if (floatingBtn) {
            floatingBtn.addEventListener('click', () => {
                this.toggle();
            });
        }
        
        // ✅ Theme options (Settings sahifasi)
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.applyTheme(theme);
            });
        });
        
        // System theme o'zgarishini kuzatish
        const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeMedia.addEventListener('change', () => {
            if (this.current === 'system') {
                this.applyTheme('system');
            }
        });
    }
};

// ✅ Sahifa yuklanganda ishga tushirish
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Theme.init());
} else {
    Theme.init();
}
