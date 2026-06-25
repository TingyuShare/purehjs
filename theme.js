// Theme toggle — reads/writes localStorage, syncs across tabs
(function() {
    const KEY = 'devtoolkit-theme';
    const saved = localStorage.getItem(KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);

    function toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(KEY, next);
        updateIcon(next);
    }

    function updateIcon(t) {
        const btn = document.querySelector('.theme-toggle');
        if (btn) btn.textContent = t === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
    }

    // Listen for cross-tab changes
    window.addEventListener('storage', function(e) {
        if (e.key === KEY && e.newValue) {
            document.documentElement.setAttribute('data-theme', e.newValue);
            updateIcon(e.newValue);
        }
    });

    // Create toggle button
    document.addEventListener('DOMContentLoaded', function() {
        const btn = document.createElement('button');
        btn.className = 'theme-toggle';
        btn.title = 'Toggle theme';
        btn.addEventListener('click', toggle);
        document.body.appendChild(btn);
        updateIcon(theme);
    });
})();
