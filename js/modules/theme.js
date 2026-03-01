// ============================================
// THEME.JS - Dark Mode Only (Night Theme)
// ============================================

class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.htmlElement = document.documentElement;
        this.storageKey = 'jobportal-theme';
        this.currentTheme = 'dark-mode'; // Night theme only
        
        this.init();
    }

    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.applyTheme();
    }

    setupEventListeners() {
        if (this.themeToggle) {
            // Disable theme toggle - night theme only
            this.themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                // Do nothing - night theme is locked
                this.showNightThemeOnlyMessage();
            });
            // Make toggle button appear disabled
            this.themeToggle.style.opacity = '0.7';
            this.themeToggle.style.cursor = 'default';
        }
    }

    showNightThemeOnlyMessage() {
        // Optional: show message that night theme is always on
        console.log('Night theme is always active');
    }

    loadTheme() {
        // Always use dark mode/night theme
        this.currentTheme = 'dark-mode';
        localStorage.setItem(this.storageKey, 'dark-mode');
    }

    toggleTheme() {
        // Disabled - night theme only
        // Do nothing
    }

    applyTheme() {
        // Remove old classes
        this.htmlElement.classList.remove('dark-mode', 'light-mode');
        
        // Always apply night theme
        this.htmlElement.classList.add('dark-mode');
        
        // Update icon
        this.updateThemeIcon();
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: 'dark-mode' }
        }));
    }

    updateThemeIcon() {
        if (!this.themeToggle) return;
        
        const icon = this.themeToggle.querySelector('i');
        if (icon) {
            // Always show night icon
            icon.className = 'fas fa-moon';
            this.themeToggle.title = 'Night Theme (Always Active)';
        }
    }

    getTheme() {
        return this.currentTheme;
    }

    isDarkMode() {
        return true; // Always dark mode
    }

    setTheme(theme) {
        // Ignore theme changes - always dark mode
        this.currentTheme = 'dark-mode';
        localStorage.setItem(this.storageKey, 'dark-mode');
        this.applyTheme();
    }

    // Get theme-specific colors
    getThemeColors() {
        // Always return dark theme colors
        return {
            primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            primarySolid: '#667eea',
            secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            secondarySolid: '#f5576c',
            accent: '#00d4ff',
            accentLight: '#7c3aed',
            background: '#0f0f1e',
            surface: '#1a1a2e',
            surfaceAlt: '#16213e',
            text: '#ffffff',
            textSecondary: '#b0b0b0',
            textMuted: '#707070',
            border: 'rgba(255, 255, 255, 0.1)',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444'
        };
    }

    // Update theme dynamically
    updateThemeVariable(variable, value) {
        this.htmlElement.style.setProperty(`--${variable}`, value);
    }

    // Create a themed gradient
    createGradient(start = 0, end = 100) {
        // Always use dark theme colors
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c'];
        return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[colors.length - 1]} 100%)`;
    }

    // Apply theme to specific element
    applyThemeToElement(element, themeClass = '') {
        if (themeClass) {
            element.classList.add(themeClass);
        }
        
        // Always apply dark theme styles
        element.style.background = 'rgba(255, 255, 255, 0.05)';
        element.style.color = '#ffffff';
    }

    // Get CSS variable value
    getCSSVariable(variable) {
        return getComputedStyle(this.htmlElement).getPropertyValue(`--${variable}`).trim();
    }

    // Create theme snapshot
    getThemeSnapshot() {
        return {
            theme: 'dark-mode',
            colors: this.getThemeColors(),
            isDark: true
        };
    }

    // Restore theme from snapshot
    restoreFromSnapshot(snapshot) {
        // Always set to dark mode
        this.setTheme('dark-mode');
    }

    // Listen to theme changes
    onThemeChange(callback) {
        window.addEventListener('themechange', (e) => {
            callback(e.detail.theme);
        });
    }
}

// Night Theme Only - Presets Disabled
class ThemePresets {
    static THEMES = {
        dark: {
            name: 'Night Theme',
            class: 'dark-mode',
            colors: {
                primary: '#667eea',
                secondary: '#f5576c',
                background: '#0f0f1e'
            }
        }
    };

    static applyPreset(presetName) {
        // Always apply dark mode - ignore other presets
        const preset = this.THEMES['dark'];
        if (!preset) return false;

        const html = document.documentElement;
        html.classList.remove('dark-mode', 'light-mode');
        html.classList.add(preset.class);

        return true;
    }

    static getAvailablePresets() {
        return ['dark']; // Only dark theme available
    }

    static getPreset(name) {
        return this.THEMES['dark']; // Always return dark preset
    }
}

// Initialize theme manager
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
        // Force dark mode on page load
        document.documentElement.classList.remove('light-mode');
        document.documentElement.classList.add('dark-mode');
    });
} else {
    window.themeManager = new ThemeManager();
    // Force dark mode immediately
    document.documentElement.classList.remove('light-mode');
    document.documentElement.classList.add('dark-mode');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThemeManager, ThemePresets };
}
