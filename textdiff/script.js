// A more robust diff function based on Longest Common Subsequence (LCS)
function diffLines(oldStr, newStr) {
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');
    const result = [];

    const lcs = [];
    for (let i = 0; i <= oldLines.length; i++) {
        lcs[i] = new Array(newLines.length + 1).fill(0);
    }

    for (let i = 1; i <= oldLines.length; i++) {
        for (let j = 1; j <= newLines.length; j++) {
            if (oldLines[i - 1] === newLines[j - 1]) {
                lcs[i][j] = lcs[i - 1][j - 1] + 1;
            } else {
                lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
            }
        }
    }

    let i = oldLines.length;
    let j = newLines.length;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            result.unshift({ value: oldLines[i - 1] });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
            result.unshift({ value: newLines[j - 1], added: true });
            j--;
        } else if (i > 0 && (j === 0 || lcs[i][j - 1] < lcs[i - 1][j])) {
            result.unshift({ value: oldLines[i - 1], removed: true });
            i--;
        } else {
            break;
        }
    }

    return result;
}

const text1Input = document.getElementById('text1');
const text2Input = document.getElementById('text2');
const diffLeft = document.getElementById('diff-left');
const diffRight = document.getElementById('diff-right');

function createLine(number, content, type) {
    const line = document.createElement('div');
    const lineNumber = document.createElement('span');
    lineNumber.className = 'line-number';
    lineNumber.textContent = number || '';

    const lineContent = document.createElement('span');
    lineContent.className = 'line-content';
    lineContent.textContent = content || '';
    
    line.appendChild(lineNumber);
    line.appendChild(lineContent);

    if (type) {
        line.className = type;
    }
    return line;
}

function addFoldedLine(count) {
    const line = createLine('', `... ${count} unchanged lines ...`);
    line.className = 'folded-line';
    line.style.width = '200%';
    diffLeft.appendChild(line);
}

function performCompare() {
    const text1 = text1Input.value;
    const text2 = text2Input.value;
    
    const diff = diffLines(text1, text2);
    
    diffLeft.innerHTML = '';
    diffRight.innerHTML = '';

    if (text1 === '' && text2 === '') return;

    if (diff.length === 0 && text1 === text2) {
        const line = document.createElement('div');
        line.textContent = 'The texts are identical.';
        line.style.textAlign = 'center';
        line.style.width = '200%';
        diffLeft.appendChild(line);
        return;
    }

    let leftLineNum = 1;
    let rightLineNum = 1;
    let consecutiveCommon = 0;

    diff.forEach(part => {
        if (part.added || part.removed) {
            if (consecutiveCommon > 0) {
                addFoldedLine(consecutiveCommon);
                consecutiveCommon = 0;
            }
            if (part.added) {
                diffLeft.appendChild(createLine('', '', 'diff-added'));
                diffRight.appendChild(createLine(rightLineNum, '+ ' + part.value, 'diff-added'));
                rightLineNum++;
            } else { // removed
                diffLeft.appendChild(createLine(leftLineNum, '- ' + part.value, 'diff-removed'));
                diffRight.appendChild(createLine('', '', 'diff-removed'));
                leftLineNum++;
            }
        } else { // common
            consecutiveCommon++;
            leftLineNum++;
            rightLineNum++;
        }
    });

    if (consecutiveCommon > 0) {
        addFoldedLine(consecutiveCommon);
    }
}

text1Input.addEventListener('input', performCompare);
text2Input.addEventListener('input', performCompare);

// Initial comparison on page load
performCompare();

