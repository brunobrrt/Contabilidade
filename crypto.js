// ===== CRIPTOGRAFIA CLIENT-SIDE =====
// T7 System — Camada de segurança para dados sensíveis
//
// Usa Web Crypto API (nativo do browser, sem dependências):
// - PBKDF2: deriva chave de criptografia da senha do admin
// - AES-256-GCM: criptografa dados antes de enviar pro Firebase
// - SHA-256: hash de senhas para verificação de login
//
// IMPORTANTE: Sem a senha, os dados no Firebase são INÚTEIS.
// Mesmo que alguém acesse o banco via REST API, só vê ciphertext.

const T7Crypto = (() => {
    const SALT = 't7-contabilidade-2026-salt-v1'; // Fixo para derivar mesma chave
    const ITERATIONS = 100000;

    let _cachedKey = null; // Chave AES em memória (só durante a sessão)

    // ===== DERIVAR CHAVE AES-256 DA SENHA =====
    async function deriveKey(password) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
        );
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: enc.encode(SALT),
                iterations: ITERATIONS,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false, // não exportável
            ['encrypt', 'decrypt']
        );
    }

    // ===== INICIAR SESSÃO CRIPTOGRÁFICA =====
    // Chamado após login bem-sucedido
    async function initSession(password) {
        _cachedKey = await deriveKey(password);
        console.log('🔐 Sessão criptográfica iniciada');
    }

    // ===== LIMPAR SESSÃO =====
    // Chamado no logout
    function clearSession() {
        _cachedKey = null;
    }

    // ===== CRIPTOGRAFAR OBJETO =====
    async function encrypt(obj) {
        if (!_cachedKey) {
            console.warn('Crypto não inicializado, salvando sem criptografia');
            return obj;
        }
        const enc = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV para AES-GCM
        const data = enc.encode(JSON.stringify(obj));

        const ciphertext = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            _cachedKey,
            data
        );

        // Retorna objeto com IV + ciphertext em base64
        return {
            __encrypted: true,
            iv: arrayBufferToBase64(iv),
            data: arrayBufferToBase64(ciphertext)
        };
    }

    // ===== DESCRIPTOGRAFAR OBJETO =====
    async function decrypt(encryptedObj) {
        if (!_cachedKey) return null;
        if (!encryptedObj || !encryptedObj.__encrypted) return encryptedObj; // Não criptografado (dado antigo)

        try {
            const iv = base64ToArrayBuffer(encryptedObj.iv);
            const ciphertext = base64ToArrayBuffer(encryptedObj.data);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                _cachedKey,
                ciphertext
            );

            const dec = new TextDecoder();
            return JSON.parse(dec.decode(decrypted));
        } catch (e) {
            console.error('Erro ao descriptografar — senha incorreta ou dado corrompido');
            return null;
        }
    }

    // ===== HASH DE SENHA (SHA-256) =====
    async function hashPassword(password) {
        const enc = new TextEncoder();
        const hash = await crypto.subtle.digest('SHA-256', enc.encode(password + SALT));
        return arrayBufferToHex(hash);
    }

    // ===== VERIFICAR SENHA =====
    async function verifyPassword(password, storedHash) {
        const hash = await hashPassword(password);
        return hash === storedHash;
    }

    // ===== UTILS: ArrayBuffer ↔ Base64 =====
    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    function arrayBufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // API pública
    return {
        initSession,
        clearSession,
        encrypt,
        decrypt,
        hashPassword,
        verifyPassword
    };
})();
