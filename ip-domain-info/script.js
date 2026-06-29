const ipInput = document.getElementById('ip-input');
const domainInput = document.getElementById('domain-input');
const ipOutput = document.getElementById('ip-output');
const domainOutput = document.getElementById('domain-output');
const ipStatus = document.getElementById('ip-status');
const domainStatus = document.getElementById('domain-status');

function setStatus(element, message, type = 'info') {
    element.className = `status ${type}`;
    element.textContent = message;
}

function normalizeDomain(value) {
    return (value || '')
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/.*$/, '')
        .replace(/\s+/g, '')
        .toLowerCase();
}

function formatObject(value) {
    if (typeof value === 'string') return value;
    return JSON.stringify(value, null, 2);
}

async function queryIpInfo() {
    const rawValue = (ipInput.value || '').trim();
    const url = rawValue ? `https://ipapi.co/${encodeURIComponent(rawValue)}/json/` : 'https://ipapi.co/json/';

    try {
        setStatus(ipStatus, 'Querying IP information...', 'info');
        const response = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        const payload = {
            ip: data.ip || rawValue || 'unknown',
            city: data.city || '—',
            region: data.region || '—',
            country: data.country_name || data.country || '—',
            country_code: data.country_code || '—',
            postal: data.postal || '—',
            timezone: data.timezone || '—',
            org: data.org || '—',
            latitude: data.latitude || '—',
            longitude: data.longitude || '—',
            asn: data.asn || '—',
            raw: data
        };

        ipOutput.textContent = formatObject(payload);
        setStatus(ipStatus, 'IP information loaded successfully.', 'success');
    } catch (error) {
        ipOutput.textContent = `Unable to fetch IP information.\n${error.message}`;
        setStatus(ipStatus, 'Unable to query IP information. Please try again.', 'error');
    }
}

function buildWhoisUrls(domain) {
    const tld = (domain.split('.').slice(-2).join('.').split('.').pop() || 'com').toLowerCase();
    return [
        { label: 'RDAP', url: `https://rdap.org/domain/${encodeURIComponent(domain)}` },
        { label: `RDAP (${tld})`, url: `https://rdap.verisign.com/${tld}/v1/domain/${encodeURIComponent(domain)}` },
        { label: 'WHOIS proxy', url: `https://r.jina.ai/http://https://www.whois.com/whois/${encodeURIComponent(domain)}` }
    ];
}

function extractRegistrarName(registrar) {
    if (!registrar) return '—';
    const orgEntry = registrar.vcardArray?.[1]?.find?.((item) => Array.isArray(item) && item[0] === 'org');
    return orgEntry?.[3] || registrar.handle || '—';
}

async function queryDomainInfo() {
    const domain = normalizeDomain(domainInput.value);
    if (!domain) {
        domainOutput.textContent = 'Please enter a domain name.';
        setStatus(domainStatus, 'Please enter a domain name.', 'error');
        return;
    }

    const candidates = buildWhoisUrls(domain);
    let lastError = null;

    for (const candidate of candidates) {
        try {
            setStatus(domainStatus, `Querying WHOIS information via ${candidate.label}...`, 'info');
            const response = await fetch(candidate.url, {
                headers: candidate.label === 'WHOIS proxy' ? { Accept: 'text/plain' } : { Accept: 'application/json' }
            });

            if (!response.ok) {
                lastError = new Error(` ${candidate.label} returned ${response.status}`);
                continue;
            }

            if (candidate.label === 'WHOIS proxy') {
                const text = await response.text();
                if (text && text.trim()) {
                    const payload = {
                        domain,
                        source: candidate.label,
                        content: text.trim()
                    };
                    domainOutput.textContent = formatObject(payload);
                    setStatus(domainStatus, 'WHOIS information loaded successfully.', 'success');
                    return;
                }
                lastError = new Error(`${candidate.label} returned empty content`);
                continue;
            }

            const data = await response.json();
            if (data?.errorCode || data?.title || data?.notFound) {
                lastError = new Error(`${candidate.label} reported no matching data`);
                continue;
            }

            const registrar = data.entities?.find((entity) => entity.roles?.includes('registrar'));
            const payload = {
                domain,
                source: candidate.label,
                handle: data.handle || '—',
                status: data.status || [],
                nameservers: data.nameservers?.map((item) => item.ldhName || item.name) || [],
                registrar: registrar ? {
                    handle: registrar.handle || '—',
                    name: extractRegistrarName(registrar)
                } : '—',
                events: data.events?.map((item) => ({
                    action: item.eventAction,
                    date: item.eventDate
                })) || [],
                raw: data
            };

            domainOutput.textContent = formatObject(payload);
            setStatus(domainStatus, 'WHOIS information loaded successfully.', 'success');
            return;
        } catch (error) {
            lastError = error;
        }
    }

    domainOutput.textContent = `Unable to fetch WHOIS information for ${domain}.\n${lastError?.message || 'No public WHOIS/RDAP service returned data.'}`;
    setStatus(domainStatus, 'Unable to query WHOIS information. Please try again.', 'error');
}

document.getElementById('ip-btn').addEventListener('click', queryIpInfo);
document.getElementById('ip-current-btn').addEventListener('click', () => {
    ipInput.value = '';
    queryIpInfo();
});
document.getElementById('domain-btn').addEventListener('click', queryDomainInfo);

[ipInput, domainInput].forEach((input) => {
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (input === ipInput) {
                queryIpInfo();
            } else {
                queryDomainInfo();
            }
        }
    });
});
