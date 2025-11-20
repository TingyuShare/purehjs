document.addEventListener('DOMContentLoaded', () => {
    // --- URL Encoder/Decoder ---
    const encodeInput = document.getElementById('url-encode-input');
    const encodeOutput = document.getElementById('url-encode-output');
    const encodeBtn = document.getElementById('encode-btn');
    const decodeBtn = document.getElementById('decode-btn');

    encodeBtn.addEventListener('click', () => {
        try {
            encodeOutput.value = encodeURIComponent(encodeInput.value);
            encodeOutput.style.color = '#24292e';
        } catch (e) {
            encodeOutput.value = `Error: ${e.message}`;
            encodeOutput.style.color = '#d73a49';
        }
    });

    decodeBtn.addEventListener('click', () => {
        try {
            encodeOutput.value = decodeURIComponent(encodeInput.value);
            encodeOutput.style.color = '#24292e';
        } catch (e) {
            encodeOutput.value = `Error: ${e.message}`;
            encodeOutput.style.color = '#d73a49';
        }
    });

    // --- URL Parser ---
    const parseInput = document.getElementById('url-parse-input');
    const parseOutput = document.getElementById('url-parse-output');

    function parseUrl() {
        const urlString = parseInput.value.trim();
        if (!urlString) {
            parseOutput.innerHTML = '';
            return;
        }

        try {
            const url = new URL(urlString);
            let queryParamsHtml = '';
            url.searchParams.forEach((value, key) => {
                queryParamsHtml += `
                    <tr>
                        <td>${key}</td>
                        <td>${value}</td>
                    </tr>
                `;
            });

            parseOutput.innerHTML = `
                <h3>Parsed URL Components</h3>
                <table>
                    <tr><th>Protocol</th><td>${url.protocol}</td></tr>
                    <tr><th>Hostname</th><td>${url.hostname}</td></tr>
                    <tr><th>Port</th><td>${url.port}</td></tr>
                    <tr><th>Pathname</th><td>${url.pathname}</td></tr>
                    <tr><th>Search</th><td>${url.search}</td></tr>
                    <tr><th>Hash</th><td>${url.hash}</td></tr>
                </table>
                ${queryParamsHtml ? `
                <h3>Query Parameters</h3>
                <table>
                    <thead><tr><th>Key</th><th>Value</th></tr></thead>
                    <tbody>${queryParamsHtml}</tbody>
                </table>
                ` : ''}
            `;
        } catch (e) {
            parseOutput.innerHTML = `<p style="color: #d73a49;">Invalid URL: ${e.message}</p>`;
        }
    }

    parseInput.addEventListener('input', parseUrl);
});
