document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const status = document.getElementById('status');

    function setStatus(msg, type) {
        status.innerHTML = msg ? '<div class="status ' + type + '">' + msg + '</div>' : '';
    }

    const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '`': '&#x60;' };
    const unescapeMap = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x2F;': '/', '&#x60;': '`' };

    document.getElementById('escape-btn').addEventListener('click', () => {
        const text = input.value;
        if (!text) { setStatus('Enter text to escape', 'error'); return; }
        output.textContent = text.replace(/[&<>"'\/`]/g, c => escapeMap[c]);
        setStatus('Escaped', 'success');
    });

    document.getElementById('unescape-btn').addEventListener('click', () => {
        const text = input.value;
        if (!text) { setStatus('Enter text to unescape', 'error'); return; }
        let result = text;
        Object.keys(unescapeMap).forEach(k => { result = result.split(k).join(unescapeMap[k]); });
        output.textContent = result;
        setStatus('Unescaped', 'success');
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
        input.value = '';
        output.innerHTML = '<span class="empty-state">Result will appear here</span>';
        status.innerHTML = '';
    });
});

function copyOutput() {
    const el = document.getElementById('output');
    navigator.clipboard.writeText(el.textContent).then(() => {
        const btn = el.closest('.input-half').querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 1500);
    });
}
