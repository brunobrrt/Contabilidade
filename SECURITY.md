# 🔒 Segurança — Sistema de Contabilidade T7

## Camadas de Proteção

### 1. 🔐 Criptografia Client-Side (AES-256-GCM)
- **Todos os dados** são criptografados ANTES de enviar ao Firebase
- Usa Web Crypto API (nativo do browser, sem dependências)
- Chave derivada da senha do admin via **PBKDF2** (100.000 iterações)
- **IV aleatório** por operação (96-bit para AES-GCM)
- Sem a senha → dados no Firebase são **ciphertext inútil**

### 2. 🔑 Senhas Hash (SHA-256)
- Senhas nunca são armazenadas em plaintext
- Hash com salt fixo do sistema
- Migração automática: senhas antigas em plaintext são convertidas no primeiro login

### 3. 🚫 Firestore Rules (REST API Protection)
- Regras bloqueiam acesso direto via REST API
- Protege contra scraping por `projectId` exposto no browser
- Firebase SDK do app funciona normalmente (regras + criptografia)

---

## Como Deploy das Regras Firebase

### Opção 1: Firebase CLI (recomendado)
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy das regras
firebase deploy --only firestore:rules --project contabilidade-b568c
```

### Opção 2: Console Firebase
1. Acesse https://console.firebase.google.com
2. Projeto `contabilidade-b568c`
3. Firestore Database → Regras
4. Cole o conteúdo de `firestore.rules`
5. Clique em **Publicar**

### Regras (resumo)
```
match /{document=**} {
  allow read, write: if false;
}
```
Bloqueia TODAS as leituras/escritas diretas. Dados só acessíveis com a chave de descriptografia.

---

## Fluxo de Segurança

```
Usuário digita senha
       ↓
  PBKDF2(senha + salt) → AES-256 Key (em memória)
       ↓
  SHA-256(senha + salt) → verificar login
       ↓
  Login OK → Key fica em _cachedKey (só durante sessão)
       ↓
  Cada operação Firebase:
    ENCRYPT(dados) → {__encrypted: true, iv, data} → Firebase
    Firebase → DECRYPT(dados) → dados legíveis
       ↓
  Logout → _cachedKey = null (chave destruída)
```

## ⚠️ IMPORTANTE

- **Firestore Rules** devem ser deployadas antes de usar em produção
- **Não compartilhe** a senha de admin — é a chave mestra de criptografia
- **Backup**: dados no Firebase estão criptografados. Para backup legível, exporte via interface do sistema
- **Mudança de senha admin**: requer re-criptografar todos os dados (não implementado ainda)
