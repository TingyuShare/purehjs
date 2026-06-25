document.addEventListener('DOMContentLoaded', () => {
    const keyType = document.getElementById('key-type');
    const commentInput = document.getElementById('comment');
    const output = {
        pub: document.getElementById('pub-key'),
        priv: document.getElementById('priv-key'),
        fp: document.getElementById('fingerprint'),
    };
    const status = document.getElementById('status');

    function setStatus(msg, type) {
        status.innerHTML = msg ? '<div class="status ' + type + '">' + msg + '</div>' : '';
    }

    // Base64 encode/decode helpers
    function bufToB64(buf) {
        return btoa(String.fromCharCode(...new Uint8Array(buf)));
    }

    function bufToB64NoPad(buf) {
        return bufToB64(buf).replace(/=+$/, '');
    }

    // SSH wire format: write uint32 length-prefixed string
    function writeString(buf) {
        const len = new Uint8Array(4);
        new DataView(len.buffer).setUint32(0, buf.length, false);
        return new Uint8Array([...len, ...buf]);
    }

    function writeUint32(n) {
        const buf = new Uint8Array(4);
        new DataView(buf.buffer).setUint32(0, n, false);
        return buf;
    }

    // String to bytes
    function strToBytes(s) {
        return new TextEncoder().encode(s);
    }

    // Ed25519 key generation
    async function generateEd25519() {
        const keyPair = await crypto.subtle.generateKey(
            { name: 'Ed25519' },
            true,
            ['sign', 'verify']
        );

        const pubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey));
        const privRaw = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey));

        // OpenSSH public key format
        const sshPub = buildOpenSSHPub('ssh-ed25519', pubRaw, commentInput.value.trim());

        // OpenSSH private key format (unencrypted)
        const sshPriv = buildOpenSSHPrivEd25519(privRaw, pubRaw, commentInput.value.trim());

        // Fingerprint (SHA256)
        const fp = await sha256B64(pubRaw);

        return { pub: sshPub, priv: sshPriv, fingerprint: 'SHA256:' + fp };
    }

    // RSA key generation
    async function generateRSA(modulusLength) {
        const keyPair = await crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: modulusLength,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256'
            },
            true,
            ['encrypt', 'decrypt']
        );

        // For SSH, we need raw RSA key components
        // Web Crypto doesn't directly export RSA private keys in SSH format
        // So we use a workaround: export as JWK and reconstruct
        const pubJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
        const privJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

        const n = base64ToUint8Array(pubJwk.n);
        const e = base64ToUint8Array(pubJwk.e);
        const d = base64ToUint8Array(privJwk.d);
        const p = base64ToUint8Array(privJwk.p);
        const q = base64ToUint8Array(privJwk.q);
        const dp = base64ToUint8Array(privJwk.dp);
        const dq = base64ToUint8Array(privJwk.dq);
        const qi = base64ToUint8Array(privJwk.qi);

        // OpenSSH public key
        const sshPub = buildOpenSSHPubRSA(n, e, commentInput.value.trim());

        // OpenSSH private key
        const sshPriv = buildOpenSSHPrivRSA(modulusLength, n, e, d, p, q, dp, dq, qi, commentInput.value.trim());

        // Fingerprint
        const pubBlob = buildRSAPubBlob(n, e);
        const fp = await sha256B64(pubBlob);

        return { pub: sshPub, priv: sshPriv, fingerprint: 'SHA256:' + fp };
    }

    function base64ToUint8Array(b64) {
        // JWK uses base64url, atob needs standard base64
        let std = b64.replace(/-/g, '+').replace(/_/g, '/');
        while (std.length % 4) std += '=';
        const bin = atob(std);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        return arr;
    }

    // Build OpenSSH public key string
    function buildOpenSSHPub(keyType, pubKeyBytes, comment) {
        const typeBytes = strToBytes(keyType);
        const blob = new Uint8Array([...writeString(typeBytes), ...writeString(pubKeyBytes)]);
        const b64 = bufToB64(blob);
        return keyType + ' ' + b64 + (comment ? ' ' + comment : '');
    }

    // Build RSA public key
    function buildOpenSSHPubRSA(n, e, comment) {
        const typeStr = 'ssh-rsa';
        const typeBytes = strToBytes(typeStr);
        // SSH stores e then n for RSA
        const blob = new Uint8Array([
            ...writeString(typeBytes),
            ...writeString(e),
            ...writeString(n)
        ]);
        const b64 = bufToB64(blob);
        return 'ssh-rsa ' + b64 + (comment ? ' ' + comment : '');
    }

    function buildRSAPubBlob(n, e) {
        const typeBytes = strToBytes('ssh-rsa');
        return new Uint8Array([...writeString(typeBytes), ...writeString(e), ...writeString(n)]);
    }

    // Build Ed25519 private key (OpenSSH format, unencrypted)
    function buildOpenSSHPrivEd25519(privPkcs8, pubRaw, comment) {
        const checkInt = crypto.getRandomValues(new Uint32Array(1))[0];
        const privType = strToBytes('ssh-ed25519');

        // Ed25519 private key is 64 bytes from PKCS8 (32 seed + 32 public)
        // Extract the 64-byte key from PKCS8
        const seed = privPkcs8.slice(16, 48); // 32-byte seed

        const privKeyBlob = new Uint8Array([
            ...writeUint32(checkInt),
            ...writeUint32(checkInt),
            ...writeString(privType),
            ...writeString(seed),
            ...writeString(pubRaw),
            ...(comment ? writeString(strToBytes(comment)) : writeString(new Uint8Array(0))),
        ]);

        // Wrap in openssh-key-v1 format
        const magic = strToBytes('openssh-key-v1\x00');
        const ciphername = strToBytes('none');
        const kdfname = strToBytes('none');
        const kdfoptions = writeString(new Uint8Array(0));
        const nkeys = writeUint32(1);

        // Public key blob for private key file
        const pubBlob = new Uint8Array([...writeString(privType), ...writeString(pubRaw)]);

        const privKeyLen = writeUint32(privKeyBlob.length);

        const full = new Uint8Array([
            ...magic,
            ...writeString(ciphername),
            ...writeString(kdfname),
            ...kdfoptions,
            ...nkeys,
            ...writeString(pubBlob),
            ...privKeyLen,
            ...privKeyBlob,
        ]);

        const lines = [];
        lines.push('-----BEGIN OPENSSH PRIVATE KEY-----');
        const b64 = bufToB64(full);
        for (let i = 0; i < b64.length; i += 70) {
            lines.push(b64.slice(i, i + 70));
        }
        lines.push('-----END OPENSSH PRIVATE KEY-----');
        return lines.join('\n');
    }

    // Build RSA private key (OpenSSH format, unencrypted)
    function buildOpenSSHPrivRSA(bits, n, e, d, p, q, dp, dq, qi, comment) {
        const checkInt = crypto.getRandomValues(new Uint32Array(1))[0];
        const privType = strToBytes('ssh-rsa');

        const privKeyBlob = new Uint8Array([
            ...writeUint32(checkInt),
            ...writeUint32(checkInt),
            ...writeString(privType),
            ...writeString(n),
            ...writeString(e),
            ...writeString(d),
            ...writeString(qi),   // iqmp
            ...writeString(p),
            ...writeString(q),
            ...(comment ? writeString(strToBytes(comment)) : writeString(new Uint8Array(0))),
        ]);

        const magic = strToBytes('openssh-key-v1\x00');
        const ciphername = strToBytes('none');
        const kdfname = strToBytes('none');
        const kdfoptions = writeString(new Uint8Array(0));
        const nkeys = writeUint32(1);

        const pubBlob = new Uint8Array([...writeString(privType), ...writeString(n), ...writeString(e)]);
        const privKeyLen = writeUint32(privKeyBlob.length);

        const full = new Uint8Array([
            ...magic,
            ...writeString(ciphername),
            ...writeString(kdfname),
            ...kdfoptions,
            ...nkeys,
            ...writeString(pubBlob),
            ...privKeyLen,
            ...privKeyBlob,
        ]);

        const lines = [];
        lines.push('-----BEGIN OPENSSH PRIVATE KEY-----');
        const b64 = bufToB64(full);
        for (let i = 0; i < b64.length; i += 70) {
            lines.push(b64.slice(i, i + 70));
        }
        lines.push('-----END OPENSSH PRIVATE KEY-----');
        return lines.join('\n');
    }

    // SHA-256 fingerprint
    async function sha256B64(buf) {
        const hash = await crypto.subtle.digest('SHA-256', buf);
        return bufToB64(hash);
    }

    // Generate button
    document.getElementById('gen-btn').addEventListener('click', async () => {
        const type = keyType.value;
        setStatus('Generating ' + type.toUpperCase() + ' key pair...', 'info');

        try {
            let result;
            if (type === 'ed25519') {
                result = await generateEd25519();
            } else {
                const bits = parseInt(type.split('-')[1]);
                result = await generateRSA(bits);
            }

            output.pub.textContent = result.pub;
            output.priv.textContent = result.priv;
            output.fp.textContent = result.fingerprint;
            setStatus(type.toUpperCase() + ' key pair generated', 'success');
        } catch (e) {
            setStatus('Error: ' + e.message, 'error');
        }
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
        output.pub.innerHTML = '<span class="empty-state">Click Generate</span>';
        output.priv.innerHTML = '<span class="empty-state">Click Generate</span>';
        output.fp.innerHTML = '<span class="empty-state">—</span>';
        status.innerHTML = '';
    });
});

function copyCard(id) {
    const el = document.getElementById(id);
    navigator.clipboard.writeText(el.textContent).then(() => {
        const btn = el.closest('.result-card').querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 1500);
    });
}
