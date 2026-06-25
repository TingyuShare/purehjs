document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const status = document.getElementById('status');

    function setStatus(msg, type) {
        status.innerHTML = msg ? '<div class="status ' + type + '">' + msg + '</div>' : '';
    }

    function highlight(json) {
        return json
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"([^"]+)"(?=\s*:)/g, '<span class="json-key">"$1"</span>')
            .replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
            .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
            .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
            .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
    }

    document.getElementById('format-btn').addEventListener('click', () => {
        try {
            const obj = JSON.parse(input.value);
            const formatted = JSON.stringify(obj, null, 2);
            output.innerHTML = highlight(formatted);
            setStatus('Valid JSON — formatted', 'success');
        } catch (e) {
            setStatus('Invalid JSON: ' + e.message, 'error');
        }
    });

    document.getElementById('minify-btn').addEventListener('click', () => {
        try {
            const obj = JSON.parse(input.value);
            output.textContent = JSON.stringify(obj);
            setStatus('Minified', 'info');
        } catch (e) {
            setStatus('Invalid JSON: ' + e.message, 'error');
        }
    });

    document.getElementById('validate-btn').addEventListener('click', () => {
        try {
            JSON.parse(input.value);
            setStatus('Valid JSON ✓', 'success');
            output.innerHTML = '<span class="empty-state">JSON is valid</span>';
        } catch (e) {
            setStatus('Invalid JSON: ' + e.message, 'error');
        }
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
        const btn = el.closest('.input-full').querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 1500);
    });
}
