document.addEventListener('DOMContentLoaded', () => {
    const patternInput = document.getElementById('pattern');
    const flagsInput = document.getElementById('flags');
    const testString = document.getElementById('test-string');
    const output = document.getElementById('output');
    const status = document.getElementById('status');

    function setStatus(msg, type) {
        status.innerHTML = msg ? '<div class="status ' + type + '">' + msg + '</div>' : '';
    }

    function testRegex() {
        const pattern = patternInput.value;
        const text = testString.value;

        if (!pattern) { output.innerHTML = '<span class="empty-state">Enter a pattern</span>'; status.innerHTML = ''; return; }
        if (!text) { output.innerHTML = '<span class="empty-state">Enter test text</span>'; status.innerHTML = ''; return; }

        try {
            const flags = flagsInput.value.trim();
            const regex = new RegExp(pattern, flags);
            let match;
            const matches = [];

            if (flags.includes('g')) {
                while ((match = regex.exec(text)) !== null) {
                    matches.push({ value: match[0], index: match.index, groups: match.slice(1) });
                    if (!flags.includes('g')) break;
                    if (match[0] === '') regex.lastIndex++;
                }
            } else {
                match = regex.exec(text);
                if (match) matches.push({ value: match[0], index: match.index, groups: match.slice(1) });
            }

            if (matches.length === 0) {
                output.innerHTML = '<span class="empty-state">No matches</span>';
                setStatus('No matches found', 'info');
                return;
            }

            let html = '<div style="margin-bottom:8px;color:#3fb950;font-weight:600">' + matches.length + ' match' + (matches.length > 1 ? 'es' : '') + '</div>';
            matches.forEach((m, i) => {
                const groups = m.groups.length > 0 ? '<span style="color:#484f58"> groups: [' + m.groups.map(g => '"' + escapeHtml(g || '') + '"').join(', ') + ']</span>' : '';
                html += '<div style="margin:4px 0;padding:4px 8px;background:rgba(63,185,80,0.08);border-radius:4px">';
                html += '<span style="color:#58a6ff">#' + (i + 1) + '</span> ';
                html += '<span style="color:#3fb950">"' + escapeHtml(m.value) + '"</span> ';
                html += '<span style="color:#484f58">at index ' + m.index + '</span>';
                html += groups;
                html += '</div>';
            });

            output.innerHTML = html;
            setStatus(matches.length + ' match' + (matches.length > 1 ? 'es' : '') + ' found', 'success');
        } catch (e) {
            output.innerHTML = '<span class="empty-state">Invalid regex</span>';
            setStatus('Regex error: ' + e.message, 'error');
        }
    }

    function escapeHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    patternInput.addEventListener('input', testRegex);
    flagsInput.addEventListener('input', testRegex);
    testString.addEventListener('input', testRegex);
});
