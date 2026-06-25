document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('output');
    const lengthSlider = document.getElementById('length');
    const lengthVal = document.getElementById('length-val');
    const status = document.getElementById('status');
    const upper = document.getElementById('upper');
    const lower = document.getElementById('lower');
    const digits = document.getElementById('digits');
    const symbols = document.getElementById('symbols');

    lengthSlider.addEventListener('input', () => { lengthVal.textContent = lengthSlider.value; });

    function setStatus(msg, type) {
        status.innerHTML = msg ? '<div class="status ' + type + '">' + msg + '</div>' : '';
    }

    function generate() {
        const len = parseInt(lengthSlider.value);
        let chars = '';
        if (upper.checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (lower.checked) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (digits.checked) chars += '0123456789';
        if (symbols.checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (!chars) { setStatus('Select at least one character type', 'error'); return ''; }

        const arr = new Uint32Array(len);
        crypto.getRandomValues(arr);
        return Array.from(arr, v => chars[v % chars.length]).join('');
    }

    document.getElementById('gen-btn').addEventListener('click', () => {
        const pass = generate();
        if (pass) { output.textContent = pass; setStatus('Generated', 'success'); }
    });

    document.getElementById('gen5-btn').addEventListener('click', () => {
        const passes = [];
        for (let i = 0; i < 5; i++) passes.push(generate());
        output.textContent = passes.join('\n');
        if (passes[0]) setStatus('5 passwords generated', 'success');
    });
});

function copyPass() {
    const el = document.getElementById('output');
    navigator.clipboard.writeText(el.textContent).then(() => {
        const btn = el.closest('.input-full').querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 1500);
    });
}
