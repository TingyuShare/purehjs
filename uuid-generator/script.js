function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const output = document.getElementById('output');
    const status = document.getElementById('status');

    function setStatus(msg, type) {
        status.innerHTML = msg ? '<div class="status ' + type + '">' + msg + '</div>' : '';
    }

    function generate(count) {
        const uuids = [];
        for (let i = 0; i < count; i++) uuids.push(uuidv4());
        output.textContent = uuids.join('\n');
        setStatus(count + ' UUID' + (count > 1 ? 's' : '') + ' generated', 'success');
    }

    document.getElementById('gen1').addEventListener('click', () => generate(1));
    document.getElementById('gen5').addEventListener('click', () => generate(5));
    document.getElementById('gen10').addEventListener('click', () => generate(10));
    document.getElementById('clear-btn').addEventListener('click', () => {
        output.innerHTML = '<span class="empty-state">Click a button to generate UUIDs</span>';
        status.innerHTML = '';
    });
});

function copyAll() {
    const el = document.getElementById('output');
    navigator.clipboard.writeText(el.textContent).then(() => {
        const btn = el.closest('.input-full').querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy All', 1500);
    });
}
