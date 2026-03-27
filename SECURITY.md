# 🔒 Segurança — Sistema de Contabilidade T7

## Camadas de Proteção (ativas)

### 1. 🚫 Firestore Rules — `request.auth != null`
- REST API direta sem token → **403 bloqueado**
- Só o app (com Anonymous Auth) acessa os dados
- Protege contra scraping por `projectId` exposto

### 2. 🔐 Criptografia Client-Side (AES-256-GCM)
- Dados criptografados ANTES de enviar ao Firebase
- Web Crypto API (nativo, sem dependências)
- Chave derivada da senha via PBKDF2 (100.000 iterações)
- IV aleatório por operação

### 3. 🔑 Senhas Hash (SHA-256)
- Nunca em plaintext
- Migração automática de senhas legadas

### 4. 🕵️ Firebase Anonymous Auth
- App conecta automaticamente (transparente pro cliente)
- Gera token válido → permite acesso ao Firestore
- Sem token = sem acesso

## Como funciona (pro cliente)

```
1. Abre o site
2. Digita CPF + senha
3. Usa normalmente
```
Nada diferente. Auth roda em background.

## Firebase Console — Configurações

- ✅ Anonymous Auth habilitado (Authentication → Métodos de login)
- ✅ Firestore Rules publicadas (regras em `firestore.rules`)
