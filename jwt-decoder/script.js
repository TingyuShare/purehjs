document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('input');
    const status = document.getElementById('status');
    const headerEl = document.getElementById('header');
    const payloadEl = document.getElementById('payload');
    const signatureEl = document.getElementById('signature');

    function setStatus(msg, type) {
        status.innerHTML = msg ? '<div class="status ' + type + '">' + msg + '</div>' : '';
    }

    function decodeB64Url(str) {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        return decodeURIComponent(escape(atob(base64)));
    }

    function formatJson(str) {
        return JSON.stringify(JSON.parse(str), null, 2);
    }

    function highlight(str) {
        return str
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"([^"]+)"(?=\s*:)/g, '<span class="json-key">"$1"</span>')
            .replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
            .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
            .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
            .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
    }

    document.getElementById('decode-btn').addEventListener('click', () => {
        const token = input.value.trim();
        if (!token) { setStatus('Please paste a JWT token', 'error'); return; }

        const parts = token.split('.');
        if (parts.length < 2 || parts.length > 3) {
            setStatus('Invalid JWT format — expected 2 or 3 parts separated by dots', 'error');
            return;
        }

        try {
            const hdr = formatJson(decodeB64Url(parts[0]));
            headerEl.innerHTML = highlight(hdr);

            const pl = formatJson(decodeB64Url(parts[1]));
            payloadEl.innerHTML = highlight(pl);

            // Check expiration
            const payload = JSON.parse(pl);
            if (payload.exp) {
                const expDate = new Date(payload.exp * 1000);
                const now = new Date();
                const expired = expDate < now;
                setStatus('Expires: ' + expDate.toISOString() + (expired ? ' (EXPIRED)' : ' (valid)'), expired ? 'error' : 'success');
            }

            signatureEl.textContent = parts[2] || '(none)';
        } catch (e) {
            setStatus('Decode error: ' + e.message, 'error');
        }
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
        input.value = '';
        headerEl.innerHTML = '<span class="empty-state">—</span>';
        payloadEl.innerHTML = '<span class="empty-state">—</span>';
        signatureEl.innerHTML = '<span class="empty-state">—</span>';
        status.innerHTML = '';
    });
});

function copyCard(id) {
    const el = document.getElementById(id);
    navigator.clipboard.writeText(el.textContent).then(() => {
        const btn = el.closest('.result-card').querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 1500);
    });
}
