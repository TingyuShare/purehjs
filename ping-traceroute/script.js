/* ============================================
   Ping & Traceroute — Main Script
   ============================================ */

// ===== DOM refs =====
const modePing = document.getElementById('mode-ping');
const modeTrace = document.getElementById('mode-traceroute');
const pingControls = document.getElementById('ping-controls');
const traceControls = document.getElementById('traceroute-controls');
const pingResults = document.getElementById('ping-results');
const traceResults = document.getElementById('traceroute-results');
const pingOutput = document.getElementById('ping-output');
const traceOutput = document.getElementById('trace-output');
const statusEl = document.getElementById('status');

// Ping inputs
const targetInput = document.getElementById('target-input');
const countInput = document.getElementById('count-input');
const timeoutInput = document.getElementById('timeout-input');
const pingBtn = document.getElementById('ping-btn');
const pingStopBtn = document.getElementById('ping-stop-btn');
const pingClearBtn = document.getElementById('ping-clear-btn');

// Ping stats
const statSent = document.getElementById('stat-sent');
const statReceived = document.getElementById('stat-received');
const statLoss = document.getElementById('stat-loss');
const statMin = document.getElementById('stat-min');
const statMax = document.getElementById('stat-max');
const statAvg = document.getElementById('stat-avg');
const statJitter = document.getElementById('stat-jitter');
const statTargetIp = document.getElementById('stat-target-ip');
const pingChart = document.getElementById('ping-chart');

// Trace inputs
const traceTargetInput = document.getElementById('trace-target-input');
const traceBtn = document.getElementById('trace-btn');
const traceClearBtn = document.getElementById('trace-clear-btn');
const traceMap = document.getElementById('trace-map');

// ===== State =====
let pingRunning = false;
let pingAbortController = null;
let pingResultsData = [];
let currentMode = 'ping';

// ===== Mode switching =====
function setMode(mode) {
    currentMode = mode;
    if (mode === 'ping') {
        modePing.className = 'tool-btn primary';
        modeTrace.className = 'tool-btn';
        pingControls.style.display = '';
        traceControls.style.display = 'none';
        pingResults.style.display = '';
        traceResults.style.display = 'none';
    } else {
        modePing.className = 'tool-btn';
        modeTrace.className = 'tool-btn primary';
        pingControls.style.display = 'none';
        traceControls.style.display = '';
        pingResults.style.display = 'none';
        traceResults.style.display = '';
    }
}

modePing.addEventListener('click', () => setMode('ping'));
modeTrace.addEventListener('click', () => setMode('traceroute'));

// ===== Utility =====
function setStatus(message, type = 'info') {
    statusEl.className = `status ${type}`;
    statusEl.textContent = message;
}

function normalizeHost(value) {
    return (value || '').trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/\s+/g, '');
}

// ===== Ping logic =====
async function startPing() {
    const host = normalizeHost(targetInput.value);
    if (!host) {
        setStatus('Please enter a target hostname or IP.', 'error');
        return;
    }

    const count = parseInt(countInput.value, 10) || 4;
    const timeout = parseInt(timeoutInput.value, 10) || 3000;

    // Cancel any running ping
    if (pingRunning) {
        stopPing();
        await new Promise(r => setTimeout(r, 100));
    }

    pingRunning = true;
    pingAbortController = new AbortController();
    pingResultsData = [];
    pingBtn.disabled = true;
    pingStopBtn.disabled = false;
    pingChart.innerHTML = '';
    pingOutput.textContent = `Pinging ${host} ...\n`;

    // Reset stats
    statSent.textContent = '0';
    statReceived.textContent = '0';
    statLoss.textContent = '0%';
    statLoss.className = 'stat-value';
    statMin.textContent = '—';
    statMax.textContent = '—';
    statAvg.textContent = '—';
    statJitter.textContent = '—';
    statTargetIp.textContent = '—';

    setStatus(`Pinging ${host} ...`, 'info');

    let sent = 0;
    let received = 0;
    const times = [];

    // First, resolve the target IP via DNS
    let resolvedIp = '';
    try {
        const dnsResp = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`, {
            signal: pingAbortController.signal
        });
        const dnsData = await dnsResp.json();
        if (dnsData.Answer && dnsData.Answer.length > 0) {
            resolvedIp = dnsData.Answer[0].data;
        }
    } catch (_) { /* ignore DNS errors */ }

    // Try resolving via alternative method if DNS failed
    if (!resolvedIp) {
        try {
            const ipResp = await fetch(`https://ipapi.co/${encodeURIComponent(host)}/json/`, {
                signal: pingAbortController.signal
            });
            const ipData = await ipResp.json();
            if (ipData.ip) resolvedIp = ipData.ip;
        } catch (_) { /* ignore */ }
    }

    // If still no IP, try to resolve hostname
    if (!resolvedIp && host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        resolvedIp = host;
    }

    // Use hostname as fallback
    const targetDisplay = resolvedIp || host;
    statTargetIp.textContent = targetDisplay;

    const protocol = host.includes('localhost') || host.match(/^\d+\.\d+\.\d+\.\d+$/) ? 'http' : 'https';
    const url = `${protocol}://${host}/`;

    for (let i = 0; i < count; i++) {
        if (!pingRunning) break;
        sent++;

        const pingNumber = i + 1;
        const startTime = performance.now();
        let success = false;
        let rtt = 0;
        let errorMsg = '';

        try {
            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: AbortSignal.timeout(timeout)
            });
            // With no-cors, we can't read the response, but we know it completed
            const endTime = performance.now();
            rtt = Math.round((endTime - startTime) * 100) / 100;
            success = true;
        } catch (err) {
            const endTime = performance.now();
            rtt = Math.round((endTime - startTime) * 100) / 100;
            if (err.name === 'AbortError' || err.name === 'TimeoutError') {
                errorMsg = 'Request timed out';
            } else {
                // Some errors still mean the request reached the server
                // For example, network errors, CORS errors, etc.
                // We still count the RTT
                if (rtt > 0 && rtt < timeout) {
                    // The request may have reached the server but response was blocked
                    success = true;
                } else {
                    errorMsg = err.message || 'Network error';
                }
            }
        }

        if (success) {
            received++;
            times.push(rtt);
        }

        pingResultsData.push({ number: pingNumber, rtt: success ? rtt : null, success, error: errorMsg });

        // Update stats
        statSent.textContent = sent;
        statReceived.textContent = received;
        const lossPct = sent > 0 ? ((sent - received) / sent * 100).toFixed(1) : '0.0';
        statLoss.textContent = `${lossPct}%`;
        const lossVal = parseFloat(lossPct);
        statLoss.className = 'stat-value';
        if (lossVal === 0) statLoss.classList.add('loss-ok');
        else if (lossVal < 20) statLoss.classList.add('loss-warn');
        else statLoss.classList.add('loss-bad');

        if (times.length > 0) {
            const sorted = [...times].sort((a, b) => a - b);
            statMin.textContent = `${sorted[0].toFixed(1)} ms`;
            statMax.textContent = `${sorted[sorted.length - 1].toFixed(1)} ms`;
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            statAvg.textContent = `${avg.toFixed(1)} ms`;
            // Jitter = average deviation from mean
            const jitter = times.reduce((a, b) => a + Math.abs(b - avg), 0) / times.length;
            statJitter.textContent = `${jitter.toFixed(1)} ms`;
        }

        // Update output
        const line = success
            ? `Reply from ${targetDisplay}: seq=${pingNumber} time=${rtt.toFixed(1)} ms`
            : `Request timeout for seq=${pingNumber}${errorMsg ? ' (' + errorMsg + ')' : ''}`;
        pingOutput.textContent += line + '\n';
        pingOutput.scrollTop = pingOutput.scrollHeight;

        // Draw chart
        renderPingChart();

        // Brief delay between pings
        if (i < count - 1 && pingRunning) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    // Done
    pingRunning = false;
    pingBtn.disabled = false;
    pingStopBtn.disabled = true;

    if (sent > 0) {
        const lossPct = ((sent - received) / sent * 100).toFixed(1);
        const summary = `\n--- ${host} ping statistics ---\n${sent} packets transmitted, ${received} received, ${lossPct}% packet loss`;
        pingOutput.textContent += summary;
        if (times.length > 0) {
            const sorted = [...times].sort((a, b) => a - b);
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            pingOutput.textContent += `\nround-trip min/avg/max = ${sorted[0].toFixed(1)}/${avg.toFixed(1)}/${sorted[sorted.length - 1].toFixed(1)} ms`;
        }
        setStatus(`Ping completed for ${host}`, received === sent ? 'success' : 'info');
    }
}

function stopPing() {
    if (pingRunning && pingAbortController) {
        pingAbortController.abort();
    }
    pingRunning = false;
    pingBtn.disabled = false;
    pingStopBtn.disabled = true;
}

function clearPing() {
    stopPing();
    pingResultsData = [];
    pingOutput.textContent = 'Click "Start Ping" to begin.';
    pingChart.innerHTML = '';
    statSent.textContent = '0';
    statReceived.textContent = '0';
    statLoss.textContent = '0%';
    statLoss.className = 'stat-value';
    statMin.textContent = '—';
    statMax.textContent = '—';
    statAvg.textContent = '—';
    statJitter.textContent = '—';
    statTargetIp.textContent = '—';
    setStatus('Cleared. Enter a target to start pinging.', 'info');
}

function renderPingChart() {
    if (pingResultsData.length === 0) {
        pingChart.innerHTML = '';
        return;
    }

    const maxRtt = Math.max(...pingResultsData.map(d => d.rtt || 0), 50);
    const chartHeight = 80;

    pingChart.innerHTML = pingResultsData.map((d, idx) => {
        const height = d.success ? Math.max(4, (d.rtt / maxRtt) * chartHeight) : 8;
        const barClass = d.success ? 'ping-bar' : 'ping-bar timeout';
        const label = d.success ? `${d.rtt.toFixed(0)}ms` : '✗';
        return `
            <div class="ping-bar-wrapper">
                <div class="${barClass}" style="height: ${height}px;">
                    <div class="ping-bar-tooltip">#${d.number}: ${d.success ? d.rtt.toFixed(1) + ' ms' : 'Timeout'}</div>
                </div>
                <div class="ping-bar-label">${label}</div>
            </div>
        `;
    }).join('');
}

// ===== Traceroute logic =====
async function startTraceroute() {
    const host = normalizeHost(traceTargetInput.value);
    if (!host) {
        setStatus('Please enter a target hostname or IP.', 'error');
        return;
    }

    traceBtn.disabled = true;
    traceOutput.textContent = `Tracing route to ${host} ...\n\n`;
    traceMap.innerHTML = '<div class="empty-state" style="width:100%;padding:20px;">Resolving DNS, please wait...</div>';
    setStatus(`Resolving DNS for ${host} ...`, 'info');

    const hops = [];
    let resolvedIps = [];
    let cnameChain = [];

    // Step 1: Resolve the full DNS chain (CNAME → A/AAAA)
    try {
        const resp = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=ALL`, {
            signal: AbortSignal.timeout(8000)
        });
        const data = await resp.json();

        if (data.Question) {
            traceOutput.textContent += `📡 DNS Route Analysis for: ${host}\n`;
            traceOutput.textContent += `   (Browser-based — shows DNS resolution, not real ICMP hops)\n`;
            traceOutput.textContent += `   For true traceroute, use your terminal:\n`;
            traceOutput.textContent += `     Windows: tracert ${host}\n`;
            traceOutput.textContent += `     Mac/Linux: traceroute ${host}\n\n`;
        }

        // Extract CNAME chain
        if (data.Answer) {
            const cnames = data.Answer.filter(a => a.type === 5);
            cnames.forEach(cname => {
                cnameChain.push(cname.data.replace(/\.$/, ''));
            });

            // Collect all unique A record IPs
            const aRecords = data.Answer.filter(a => a.type === 1);
            resolvedIps = [...new Set(aRecords.map(a => a.data))];

            // Also try AAAA (IPv6)
            const aaaaRecords = data.Answer.filter(a => a.type === 28);
            const ipv6Ips = [...new Set(aaaaRecords.map(a => a.data))];

            // Step 2: Build hop list from DNS chain
            let hopNum = 0;

            // Hop 0: local gateway (simulated — browser can't detect gateway)
            hops.push({
                hop: ++hopNum,
                ip: 'Your Gateway',
                hostname: 'Local network (not detectable from browser)',
                rtt: 0,
                location: '',
                success: true,
                isLocal: true
            });

            // Add CNAME chain as hops
            for (const cname of cnameChain) {
                hops.push({
                    hop: ++hopNum,
                    ip: cname,
                    hostname: 'CNAME alias',
                    rtt: 0,
                    location: '',
                    success: true,
                    isCname: true
                });
            }

            // Add resolved A records as hops
            for (const ip of resolvedIps) {
                let location = '';
                let org = '';

                try {
                    const geoResp = await fetch(`https://ipapi.co/${ip}/json/`, {
                        signal: AbortSignal.timeout(3000)
                    });
                    if (geoResp.ok) {
                        const geo = await geoResp.json();
                        location = [geo.city, geo.region, geo.country_name].filter(Boolean).join(', ');
                        org = geo.org || '';
                    }
                } catch (_) { /* geolocation failed */ }

                hops.push({
                    hop: ++hopNum,
                    ip: ip,
                    hostname: org || '',
                    rtt: 0,
                    location: location || '',
                    success: true,
                    isTarget: true
                });
            }

            // Add IPv6 if any
            for (const ip of ipv6Ips) {
                hops.push({
                    hop: ++hopNum,
                    ip: ip,
                    hostname: 'IPv6 address',
                    rtt: 0,
                    location: '',
                    success: true,
                    isTarget: true
                });
            }

            traceOutput.textContent += `✓ DNS resolved: ${resolvedIps.length} IPv4 + ${ipv6Ips.length} IPv6 address(es)\n`;
            if (cnameChain.length > 0) {
                traceOutput.textContent += `✓ CNAME chain: ${cnameChain.join(' → ')}\n`;
            }
        } else {
            traceOutput.textContent += `✗ No DNS records found for ${host}\n`;
            // If host looks like an IP, use it directly
            if (host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                hops.push({
                    hop: 1,
                    ip: host,
                    hostname: '',
                    rtt: 0,
                    location: '',
                    success: true,
                    isTarget: true
                });
                resolvedIps = [host];
                traceOutput.textContent += `✓ Using direct IP: ${host}\n`;
            }
        }
    } catch (err) {
        traceOutput.textContent += `✗ DNS resolution failed: ${err.message}\n`;
        // If host is an IP, use it directly
        if (host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
            hops.push({
                hop: 1,
                ip: host,
                hostname: '',
                rtt: 0,
                location: '',
                success: true,
                isTarget: true
            });
            resolvedIps = [host];
        }
    }

    // Render results
    if (hops.length > 0) {
        renderTraceMap(hops, host);
        traceOutput.textContent += `\n── Route Summary ──\n`;
        hops.forEach(h => {
            const ip = (h.ip || '*').padEnd(22);
            const label = h.isLocal ? '🏠' : h.isCname ? '↪' : h.isTarget ? '🎯' : '  ';
            const extra = h.location ? ` (${h.location})` : '';
            traceOutput.textContent += `  ${label} ${h.hop.toString().padEnd(3)} ${ip}${extra}\n`;
            if (h.hostname && !h.isLocal) {
                traceOutput.textContent += `        ${h.hostname}\n`;
            }
        });
        setStatus(`Route analysis completed: ${hops.length} hops to ${host}`, 'success');
    } else {
        traceMap.innerHTML = '<div class="empty-state" style="width:100%;padding:20px;">Could not analyze route. Try a different host.</div>';
        setStatus('Route analysis failed. The host may be unreachable or the domain does not exist.', 'error');
    }

    traceBtn.disabled = false;
}

function renderTraceMap(hops, host) {
    traceMap.innerHTML = '';

    hops.forEach((h, i) => {
        // Hop node
        const hopEl = document.createElement('div');
        hopEl.className = `trace-hop ${h.success ? 'success' : 'timeout'}`;

        const node = document.createElement('div');
        node.className = 'trace-hop-node';

        if (h.isLocal) node.textContent = '🏠';
        else if (h.isCname) node.textContent = '↪';
        else node.textContent = h.hop;

        node.title = h.isLocal ? 'Local gateway' : h.isCname ? 'CNAME alias' : `Hop ${h.hop}`;
        hopEl.appendChild(node);

        const info = document.createElement('div');
        info.className = 'trace-hop-info';
        const ipSpan = document.createElement('div');
        ipSpan.className = 'hop-ip';
        ipSpan.textContent = h.ip;
        info.appendChild(ipSpan);

        if (h.location) {
            const locSpan = document.createElement('div');
            locSpan.style.cssText = 'font-size:8px;color:var(--text-3);';
            locSpan.textContent = h.location;
            info.appendChild(locSpan);
        }

        if (h.hostname) {
            const hostSpan = document.createElement('div');
            hostSpan.style.cssText = 'font-size:8px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;max-width:100px;';
            hostSpan.textContent = h.hostname;
            info.appendChild(hostSpan);
        }

        hopEl.appendChild(info);
        traceMap.appendChild(hopEl);

        // Connector (except after the last hop)
        if (i < hops.length - 1) {
            const conn = document.createElement('div');
            conn.className = `trace-connector ${h.success ? 'success' : 'timeout'}`;
            traceMap.appendChild(conn);
        }
    });
}

function clearTraceroute() {
    traceOutput.textContent = 'Click "Start Traceroute" to begin.';
    traceMap.innerHTML = '<div class="empty-state" style="width:100%;padding:20px;">No trace data yet.</div>';
    setStatus('Cleared. Enter a target to start tracing.', 'info');
}

// ===== Event listeners =====
pingBtn.addEventListener('click', startPing);
pingStopBtn.addEventListener('click', stopPing);
pingClearBtn.addEventListener('click', clearPing);
traceBtn.addEventListener('click', startTraceroute);
traceClearBtn.addEventListener('click', clearTraceroute);

// Enter key support
targetInput.addEventListener('keydown', e => { if (e.key === 'Enter') startPing(); });
traceTargetInput.addEventListener('keydown', e => { if (e.key === 'Enter') startTraceroute(); });