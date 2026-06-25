document.addEventListener('DOMContentLoaded', () => {
    const text1Input = document.getElementById('text1');
    const text2Input = document.getElementById('text2');
    const diffOutput = document.getElementById('diff-output');
    const swapBtn = document.getElementById('swap-btn');
    const clearBtn = document.getElementById('clear-btn');

    if (!text1Input || !text2Input || !diffOutput) return;

    const CTX = 3; // context lines around changes

    // LCS diff
    function lcsDiff(oldLines, newLines) {
        const m = oldLines.length, n = newLines.length;
        const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
        for (let i = 1; i <= m; i++)
            for (let j = 1; j <= n; j++)
                dp[i][j] = oldLines[i-1] === newLines[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j], dp[i][j-1]);

        const ops = [];
        let i = m, j = n;
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && oldLines[i-1] === newLines[j-1]) {
                ops.unshift({ type: ' ', value: oldLines[i-1], oi: i-1, ni: j-1 });
                i--; j--;
            } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
                ops.unshift({ type: '+', value: newLines[j-1], ni: j-1 });
                j--;
            } else {
                ops.unshift({ type: '-', value: oldLines[i-1], oi: i-1 });
                i--;
            }
        }
        return ops;
    }

    function buildHunks(ops) {
        // Find change positions
        const changeIdx = [];
        ops.forEach((op, idx) => { if (op.type !== ' ') changeIdx.push(idx); });

        if (changeIdx.length === 0) return [];

        // Expand each change with CTX lines, merge overlapping regions
        const regions = [];
        changeIdx.forEach(ci => {
            const start = Math.max(0, ci - CTX);
            const end = Math.min(ops.length - 1, ci + CTX);
            if (regions.length > 0 && start <= regions[regions.length-1].end + 1) {
                regions[regions.length-1].end = end;
            } else {
                regions.push({ start, end });
            }
        });

        // Build hunks
        return regions.map(r => {
            const lines = ops.slice(r.start, r.end + 1);
            let oldStart = 0, oldCount = 0, newStart = 0, newCount = 0;

            lines.forEach(op => {
                if (op.type === ' ') { oldStart = (op.oi||0)+1; newStart = (op.ni||0)+1; }
            });

            // Find actual start line numbers
            for (const op of lines) {
                if (op.type === ' ') { oldStart = op.oi + 1; newStart = op.ni + 1; break; }
                if (op.type === '-') { oldStart = op.oi + 1; newStart = (lines.find(x=>x.type==='+'||x.type===' ')||{ni:0}).ni + 1; break; }
            }

            lines.forEach(op => {
                if (op.type === ' ' || op.type === '-') oldCount++;
                if (op.type === ' ' || op.type === '+') newCount++;
            });

            return { header: `@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`, lines };
        });
    }

    function escapeHtml(s) {
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function performCompare() {
        const oldText = text1Input.value;
        const newText = text2Input.value;

        if (oldText === '' && newText === '') { diffOutput.innerHTML = ''; return; }
        if (oldText === newText) { diffOutput.innerHTML = '<div class="diff-identical">texts are identical</div>'; return; }

        const oldLines = oldText.split('\n').filter(l => l.trim() !== '');
        const newLines = newText.split('\n').filter(l => l.trim() !== '');
        const ops = lcsDiff(oldLines, newLines);
        const hunks = buildHunks(ops);

        let removed = 0, added = 0;
        ops.forEach(op => { if (op.type === '-') removed++; if (op.type === '+') added++; });

        let html = '<div class="diff-file-header">';
        html += '<span class="file-old">--- baseline</span>';
        html += '<span class="file-new">+++ compare</span>';
        html += '</div>';

        hunks.forEach(hunk => {
            html += '<div class="diff-hunk-header">' + escapeHtml(hunk.header) + '</div>';
            hunk.lines.forEach(op => {
                const cls = op.type === '-' ? 'removed' : op.type === '+' ? 'added' : 'context';
                const prefix = op.type === ' ' ? ' ' : op.type;
                html += '<div class="diff-line ' + cls + '">';
                html += '<span class="line-prefix">' + prefix + '</span>';
                html += '<span class="line-content">' + escapeHtml(op.value) + '</span>';
                html += '</div>';
            });
        });

        diffOutput.innerHTML = html;
    }

    let timer = null;
    function debouncedCompare() { clearTimeout(timer); timer = setTimeout(performCompare, 150); }

    text1Input.addEventListener('input', debouncedCompare);
    text2Input.addEventListener('input', debouncedCompare);

    swapBtn.addEventListener('click', () => {
        const tmp = text1Input.value;
        text1Input.value = text2Input.value;
        text2Input.value = tmp;
        performCompare();
    });

    clearBtn.addEventListener('click', () => {
        text1Input.value = '';
        text2Input.value = '';
        diffOutput.innerHTML = '';
    });
});

