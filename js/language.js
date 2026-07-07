// ============================================
// LANGUAGE - UZ / EN
// ============================================

const Language = {
    current: localStorage.getItem('language') || 'uz',
    translations: {
        uz: {
            appTitleLogin: 'Admin Main - Tizimga kirish',
            appTitleDashboard: 'Admin Main - Dashboard',
            appTitleAdmins: 'Admin Main - Admin Customerlar',
            appTitleAdd: 'Admin Main - Yangi Admin',
            appTitleSettings: 'Admin Main - Sozlamalar',
            loginHeading: 'Admin Main',
            loginSubtitle: 'Tizimga kiring',
            loginButton: 'Kirish',
            loginFooter: '© 2026 Admin Main',
            navDashboard: 'Dashboard',
            navAdmins: 'Admin Customerlar',
            navAdd: 'Yangi Admin',
            navSettings: 'Sozlamalar',
            logout: 'Chiqish',
            settingsTitle: 'Sozlamalar',
            settingsSubtitle: 'Tizim sozlamalarini boshqaring',
            themeTitle: 'Tashqi ko\'rinish',
            themeStatus: 'Hozirgi holat',
            languageTitle: 'Til',
            languageStatus: 'Hozirgi til',
            save: 'Saqlash',
            cancel: 'Bekor qilish',
            back: 'Orqaga',
            loading: 'Yuklanmoqda...',
            noData: 'Ma\'lumotlar topilmadi',
            errorGeneric: 'Xatolik yuz berdi',
            notifications: 'Bildirishnomalar',
            noNotifications: 'Hozircha bildirishnoma yo\'q',
            markRead: 'O\'qildi'
        },
        en: {
            appTitleLogin: 'Admin Main - Sign in',
            appTitleDashboard: 'Admin Main - Dashboard',
            appTitleAdmins: 'Admin Main - Admin Customers',
            appTitleAdd: 'Admin Main - New Admin',
            appTitleSettings: 'Admin Main - Settings',
            loginHeading: 'Admin Main',
            loginSubtitle: 'Sign in to the system',
            loginButton: 'Sign in',
            loginFooter: '© 2026 Admin Main',
            navDashboard: 'Dashboard',
            navAdmins: 'Admin Customers',
            navAdd: 'New Admin',
            navSettings: 'Settings',
            logout: 'Logout',
            settingsTitle: 'Settings',
            settingsSubtitle: 'Manage system settings',
            themeTitle: 'Appearance',
            themeStatus: 'Current state',
            languageTitle: 'Language',
            languageStatus: 'Current language',
            save: 'Save',
            cancel: 'Cancel',
            back: 'Back',
            loading: 'Loading...',
            noData: 'No data found',
            errorGeneric: 'An error occurred',
            notifications: 'Notifications',
            noNotifications: 'No notifications yet',
            markRead: 'Read'
        }
    },

    init() {
        this.apply();
        this.setupListeners();
    },

    apply() {
        const lang = this.current === 'en' ? 'en' : 'uz';
        document.documentElement.lang = lang;
        document.documentElement.setAttribute('data-lang', lang);
        localStorage.setItem('language', lang);
        this.current = lang;

        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            const value = this.t(key);
            if (value) {
                el.textContent = value;
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
            const key = el.getAttribute('data-i18n-placeholder');
            const value = this.t(key);
            if (value) {
                el.setAttribute('placeholder', value);
            }
        });

        document.querySelectorAll('[data-i18n-title]').forEach((el) => {
            const key = el.getAttribute('data-i18n-title');
            const value = this.t(key);
            if (value) {
                el.setAttribute('title', value);
            }
        });

        const titleMap = {
            login: 'appTitleLogin',
            dashboard: 'appTitleDashboard',
            admins: 'appTitleAdmins',
            'admin-add': 'appTitleAdd',
            settings: 'appTitleSettings'
        };

        const pageName = window.location.pathname.split('/').pop().replace('.html', '') || 'login';
        const titleKey = titleMap[pageName] || 'appTitleDashboard';
        document.title = this.t(titleKey);

        document.querySelectorAll('.nav-link').forEach((link) => {
            const label = link.getAttribute('data-nav-label');
            if (label) {
                link.querySelector('span') && (link.querySelector('span').textContent = this.t(label));
            }
        });

        document.querySelectorAll('[data-language-option]').forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-language-option') === lang);
        });

        const languageCurrent = document.getElementById('languageCurrent');
        if (languageCurrent) {
            languageCurrent.textContent = lang === 'en' ? 'English' : 'O‘zbek';
        }
    },

    set(lang) {
        this.current = lang;
        this.apply();
    },

    t(key) {
        return this.translations[this.current][key] || this.translations.uz[key] || key;
    },

    setupListeners() {
        document.querySelectorAll('[data-language-option]').forEach((btn) => {
            btn.addEventListener('click', () => {
                this.set(btn.getAttribute('data-language-option'));
            });
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Language.init());
} else {
    Language.init();
}
