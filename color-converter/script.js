function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return null;
    const n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) { r = g = b = l; } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function parseRgb(str) {
    const m = str.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    return m ? { r: +m[1], g: +m[2], b: +m[3] } : null;
}

function parseHsl(str) {
    const m = str.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
    return m ? { h: +m[1], s: +m[2], l: +m[3] } : null;
}

document.addEventListener('DOMContentLoaded', () => {
    const hexIn = document.getElementById('hex');
    const rgbIn = document.getElementById('rgb');
    const hslIn = document.getElementById('hsl');
    const preview = document.getElementById('preview');
    const status = document.getElementById('status');

    function setStatus(msg, type) {
        status.innerHTML = msg ? '<div class="status ' + type + '">' + msg + '</div>' : '';
    }

    function setAll(r, g, b) {
        hexIn.value = rgbToHex(r, g, b);
        rgbIn.value = 'rgb(' + r + ', ' + g + ', ' + b + ')';
        const hsl = rgbToHsl(r, g, b);
        hslIn.value = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';
        preview.style.backgroundColor = hexIn.value;
    }

    document.getElementById('from-hex').addEventListener('click', () => {
        const rgb = hexToRgb(hexIn.value.trim());
        if (!rgb) { setStatus('Invalid HEX color', 'error'); return; }
        setAll(rgb.r, rgb.g, rgb.b);
        setStatus('Converted', 'success');
    });

    document.getElementById('from-rgb').addEventListener('click', () => {
        const rgb = parseRgb(rgbIn.value);
        if (!rgb) { setStatus('Invalid RGB color', 'error'); return; }
        setAll(rgb.r, rgb.g, rgb.b);
        setStatus('Converted', 'success');
    });

    document.getElementById('from-hsl').addEventListener('click', () => {
        const hsl = parseHsl(hslIn.value);
        if (!hsl) { setStatus('Invalid HSL color', 'error'); return; }
        const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
        setAll(rgb.r, rgb.g, rgb.b);
        setStatus('Converted', 'success');
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
        hexIn.value = ''; rgbIn.value = ''; hslIn.value = '';
        preview.style.backgroundColor = 'transparent';
        status.innerHTML = '';
    });
});
