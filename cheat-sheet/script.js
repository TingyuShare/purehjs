// Cheat Sheet Tool — uses pre-compiled local data
// from https://github.com/cheat/cheatsheets

// Popular topics for Quick Access chips (must exist in CHEATSHEETS)
const POPULAR_TOPICS = [
    "tar", "git", "docker", "curl", "grep", "find", "ssh", "ssh-keygen",
    "npm", "pip", "jq", "sed", "awk", "rsync", "scp",
    "kubectl", "tmux", "systemctl", "docker-compose", "crontab",
    "ffmpeg", "7z", "wget", "zip", "go", "vim", "mysql", "psql"
];

// DOM Elements
const searchInput = document.getElementById("search-input");
const clearBtn = document.getElementById("clear-btn");
const output = document.getElementById("output");
const statusEl = document.getElementById("status");

// ─── Quick Access chips ────────────────────────────────────────
function renderQuickChips() {
    const section = document.createElement("div");
    section.className = "quick-section";
    section.innerHTML = "<h3>Quick Access</h3>";
    const chips = document.createElement("div");
    chips.className = "quick-chips";

    POPULAR_TOPICS.forEach(function (cmd) {
        if (!CHEATSHEETS[cmd]) return;
        var chip = document.createElement("span");
        chip.className = "quick-chip";
        chip.textContent = cmd;
        chip.addEventListener("click", function () {
            searchInput.value = cmd;
            showCheatSheet(cmd);
        });
        chips.appendChild(chip);
    });

    section.appendChild(chips);
    return section;
}

// ─── Build HTML for a single cheat sheet ───────────────────────
function buildCheatHTML(entries, topic) {
    if (!entries || entries.length === 0) {
        return '<span class="empty-state">No examples found for <strong>' + escapeHtml(topic) + "</strong>.</span>";
    }

    var html = '';
    html += '<div class="cmd-header">';
    html += '<h2>' + escapeHtml(topic) + '</h2>';
    html += '<span class="cmd-badge">' + entries.length + ' example' + (entries.length !== 1 ? 's' : '') + '</span>';
    html += '</div>';
    html += '<div class="cheat-result">';

    entries.forEach(function (entry) {
        var codeId = "cb-" + Math.random().toString(36).slice(2, 8);
        html += '<div class="example-block">';
        if (entry.desc) {
            html += '<div class="example-desc">' + escapeHtml(entry.desc) + '</div>';
        }
        html += '<div class="example-code">';
        html += '<pre id="' + codeId + '">' + escapeHtml(entry.code) + '</pre>';
        html += '<button class="copy-btn" data-target="' + codeId + '">Copy</button>';
        html += '</div></div>';
    });

    html += '</div>';

    // Related topics
    var related = getRelated(topic);
    if (related.length > 0) {
        html += '<div class="related-section">';
        html += '<h3>See also</h3>';
        html += '<div class="related-list">';
        related.forEach(function (r) {
            html += '<span class="related-item" data-cmd="' + escapeHtml(r) + '">' + escapeHtml(r) + '</span>';
        });
        html += '</div></div>';
    }

    return html;
}

// ─── Show a cheat sheet for a given topic ──────────────────────
function showCheatSheet(topic) {
    if (!topic || !topic.trim()) return;

    var key = topic.trim().toLowerCase();
    var entries = CHEATSHEETS[key];

    if (!entries) {
        setStatus("", "");
        var matches = searchTopics(key);
        if (matches.length === 0) {
            output.innerHTML = '<span class="empty-state">No cheat sheet found for <strong>' + escapeHtml(key) + "</strong>.<br>Try one of the topics in the search results.</span>";
        } else {
            renderSearchResults(matches, key);
        }
        return;
    }

    output.innerHTML = buildCheatHTML(entries, key);
    setStatus("", "");
    bindResultEvents();
    // Scroll to top of output
    output.scrollTop = 0;
}

// ─── Bind events for cheat results ─────────────────────────────
function bindResultEvents() {
    // Copy buttons
    var copyBtns = output.querySelectorAll(".copy-btn");
    for (var i = 0; i < copyBtns.length; i++) {
        (function (btn) {
            btn.addEventListener("click", function () {
                var target = document.getElementById(btn.getAttribute("data-target"));
                copyText(target.textContent, btn);
            });
        })(copyBtns[i]);
    }

    // Related items
    var relatedItems = output.querySelectorAll(".related-item");
    for (var k = 0; k < relatedItems.length; k++) {
        (function (item) {
            item.addEventListener("click", function () {
                var cmd = item.getAttribute("data-cmd");
                searchInput.value = cmd;
                showCheatSheet(cmd);
            });
        })(relatedItems[k]);
    }
}

// ─── Fuzzy search topics ───────────────────────────────────────
function searchTopics(query) {
    var allTopics = Object.keys(CHEATSHEETS);
    var results = [];
    var exact = [];
    var prefix = [];
    var contains = [];

    allTopics.forEach(function (topic) {
        var idx = topic.indexOf(query);
        if (idx === -1) return;

        if (topic === query) {
            exact.push(topic);
        } else if (idx === 0) {
            prefix.push(topic);
        } else {
            contains.push(topic);
        }
    });

    // Sort prefix and contains for relevance
    prefix.sort(function (a, b) { return a.length - b.length; });
    contains.sort(function (a, b) { return a.length - b.length; });

    return exact.concat(prefix, contains).slice(0, 20);
}

// ─── Render search results (matched topics) ────────────────────
function renderSearchResults(matches, query) {
    var html = "";
    html += '<div class="search-results-header">' + matches.length + " topic" + (matches.length !== 1 ? "s" : "") + ' matching "<strong>' + escapeHtml(query) + '</strong>"</div>';
    html += '<div class="search-results">';
    matches.forEach(function (cmd) {
        var count = CHEATSHEETS[cmd].length;
        html += '<div class="search-results-item" data-cmd="' + escapeHtml(cmd) + '">';
        html += '<span class="cmd-name">' + escapeHtml(cmd) + '</span>';
        html += '<span class="count-badge">' + count + '</span>';
        html += '</div>';
    });
    html += '</div>';
    output.innerHTML = html;

    var items = output.querySelectorAll(".search-results-item");
    for (var i = 0; i < items.length; i++) {
        (function (item) {
            item.addEventListener("click", function () {
                var cmd = item.getAttribute("data-cmd");
                searchInput.value = cmd;
                showCheatSheet(cmd);
            });
        })(items[i]);
    }
}

// ─── Related topics ────────────────────────────────────────────
function getRelated(topic) {
    var all = Object.keys(CHEATSHEETS);
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
        if (all[i] !== topic) filtered.push(all[i]);
    }
    // shuffle
    for (var j = filtered.length - 1; j > 0; j--) {
        var idx = Math.floor(Math.random() * (j + 1));
        var tmp = filtered[j];
        filtered[j] = filtered[idx];
        filtered[idx] = tmp;
    }
    return filtered.slice(0, 6);
}

// ─── Helpers ───────────────────────────────────────────────────
function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(function () {
        btn.textContent = "Copied!";
        setTimeout(function () { btn.textContent = "Copy"; }, 1500);
    }).catch(function () {
        btn.textContent = "Failed";
        setTimeout(function () { btn.textContent = "Copy"; }, 1500);
    });
}

function setStatus(msg, type) {
    statusEl.innerHTML = msg ? '<div class="status ' + type + '">' + msg + "</div>" : "";
}

function renderInitial() {
    output.innerHTML = '<span class="empty-state">Type a command name above to see usage examples.<br>Try one of the quick access chips below!</span>';
}

// ─── Events ────────────────────────────────────────────────────
var searchTimeout = null;

searchInput.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    var val = searchInput.value.trim();
    if (!val) {
        renderInitial();
        setStatus("");
        return;
    }
    // Fast type-ahead for exact prefix match
    var matches = searchTopics(val);
    if (matches.length === 1 && matches[0] === val.toLowerCase()) {
        showCheatSheet(val);
        return;
    }
    searchTimeout = setTimeout(function () {
        var m = searchTopics(val);
        if (m.length === 0) {
            output.innerHTML = '<span class="empty-state">No topics match "<strong>' + escapeHtml(val) + '</strong>".<br>Try a different search term.</span>';
            setStatus("", "");
        } else {
            renderSearchResults(m, val);
            setStatus("", "");
        }
    }, 300);
});

searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        clearTimeout(searchTimeout);
        var val = searchInput.value.trim();
        if (val) showCheatSheet(val);
    }
});

clearBtn.addEventListener("click", function () {
    searchInput.value = "";
    renderInitial();
    setStatus("");
    searchInput.focus();
});

// ─── Init ──────────────────────────────────────────────────────
renderInitial();
var quickChips = renderQuickChips();
// Insert quick chips between search box and status
searchInput.parentNode.parentNode.insertBefore(quickChips, clearBtn.parentNode.nextSibling);
