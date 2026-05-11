/**
 * Informatix Theme Manager
 * Consolidates light/dark mode logic for the entire platform.
 */

(function() {
    const themeCheckboxId = 'theme-checkbox';
    const storageKey = 'theme';
    const root = document.documentElement;

    function applyTheme(theme) {
        if (theme === 'light') {
            root.setAttribute('data-theme', 'light');
            document.body.classList.add('light-mode');
        } else {
            root.setAttribute('data-theme', 'dark');
            document.body.classList.remove('light-mode');
        }
        
        // Sync any checkboxes on the page
        const checkboxes = document.querySelectorAll(`#${themeCheckboxId}`);
        checkboxes.forEach(cb => {
            cb.checked = (theme === 'light');
        });

        // Custom event for other scripts to react (like re-rendering canvas)
        window.dispatchEvent(new CustomEvent('informatix-theme-changed', { detail: { theme } }));
    }

    // Safe immediate init — only touches document.documentElement (available in <head>)
    const savedTheme = localStorage.getItem(storageKey);
    if (savedTheme === 'light') {
        root.setAttribute('data-theme', 'light');
    } else if (savedTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
    }

    // Delegate change event to handle dynamically added checkboxes
    document.addEventListener('change', (e) => {
        if (e.target && e.target.id === themeCheckboxId) {
            const newTheme = e.target.checked ? 'light' : 'dark';
            localStorage.setItem(storageKey, newTheme);
            applyTheme(newTheme);
        }
    });

    // Full init when DOM is ready (body exists)
    function initTheme() {
        const theme = localStorage.getItem(storageKey) || 'dark';
        applyTheme(theme);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }
})();
