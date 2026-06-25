document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const status = document.getElementById('status');

    function setStatus(msg, type) {
        status.innerHTML = msg ? '<div class="status ' + type + '">' + msg + '</div>' : '';
    }

    document.getElementById('encode-btn').addEventListener('click', () => {
        try {
            output.textContent = btoa(unescape(encodeURIComponent(input.value)));
            setStatus('Encoded', 'success');
        } catch (e) { setStatus('Encode error: ' + e.message, 'error'); }
    });

    document.getElementById('decode-btn').addEventListener('click', () => {
        try {
            output.textContent = decodeURIComponent(escape(atob(input.value.trim())));
            setStatus('Decoded', 'success');
        } catch (e) { setStatus('Decode error: invalid Base64 input', 'error'); }
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
