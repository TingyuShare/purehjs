document.addEventListener('DOMContentLoaded', () => {
    const tsInput = document.getElementById('timestamp');
    const dtInput = document.getElementById('datetime');
    const output = document.getElementById('output');
    const status = document.getElementById('status');

    function setStatus(msg, type) {
        status.innerHTML = msg ? '<div class="status ' + type + '">' + msg + '</div>' : '';
    }

    function formatDate(d) {
        const pad = n => String(n).padStart(2, '0');
        return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + ' ' +
               pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    document.getElementById('now-btn').addEventListener('click', () => {
        const now = Math.floor(Date.now() / 1000);
        tsInput.value = now;
        dtInput.value = formatDate(new Date());
        showAll(now);
    });

    document.getElementById('to-date-btn').addEventListener('click', () => {
        const ts = parseInt(tsInput.value);
        if (isNaN(ts)) { setStatus('Invalid timestamp', 'error'); return; }
        const d = new Date(ts * 1000);
        dtInput.value = formatDate(d);
        showAll(ts);
    });

    document.getElementById('to-ts-btn').addEventListener('click', () => {
        const d = new Date(dtInput.value.replace(' ', 'T'));
        if (isNaN(d.getTime())) { setStatus('Invalid date format', 'error'); return; }
        const ts = Math.floor(d.getTime() / 1000);
        tsInput.value = ts;
        showAll(ts);
    });

    function showAll(ts) {
        const d = new Date(ts * 1000);
        const now = Math.floor(Date.now() / 1000);
        const diff = now - ts;

        let html = '';
        html += '<div style="margin-bottom:8px"><span style="color:#484f58">Seconds:</span> ' + ts + '</div>';
        html += '<div style="margin-bottom:8px"><span style="color:#484f58">Milliseconds:</span> ' + (ts * 1000) + '</div>';
        html += '<div style="margin-bottom:8px"><span style="color:#484f58">ISO 8601:</span> ' + d.toISOString() + '</div>';
        html += '<div style="margin-bottom:8px"><span style="color:#484f58">UTC:</span> ' + d.toUTCString() + '</div>';
        html += '<div style="margin-bottom:8px"><span style="color:#484f58">Relative:</span> ' +
            (diff > 0 ? diff + ' seconds ago' : Math.abs(diff) + ' seconds in the future') + '</div>';

        output.innerHTML = html;
        setStatus('Converted', 'success');
    }

    document.getElementById('clear-btn').addEventListener('click', () => {
        tsInput.value = '';
        dtInput.value = '';
        output.innerHTML = '<span class="empty-state">Enter a timestamp or date to convert</span>';
        status.innerHTML = '';
    });
});
