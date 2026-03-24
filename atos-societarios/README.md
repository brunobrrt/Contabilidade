# 📋 Sistema de Atos Societários

Sistema web para gestão de **Abertura**, **Alteração** e **Encerramento** de empresas.

## Como Usar

1. Abra `index.html` no navegador
2. Faça login (CPF `00000000000` / senha `admin123` para contabilidade)
3. Clique em "Novo Processo" para criar uma solicitação

## Funcionalidades

- 🏢 **Abertura de Empresa** — formulário completo com 12 campos, upload de docs, cálculo automático de participação
- ✏️ **Alteração do Contrato Social** — 7 tipos de alteração
- ❌ **Encerramento** — distrato social
- 📊 **Dashboard** — visão geral dos processos
- 🔐 **Controle de acesso** — contabilidade vs cliente
- 📎 **Upload de documentos** — IPTU, RG, CPF

## Stack

- HTML + CSS + JS vanilla
- Firebase Firestore (quando configurado)
- Armazenamento local (localStorage) como fallback

## Configurar Firebase

Edite `firebase-config.js` com suas credenciais do Firebase Console.

## Estrutura

```
atos-societarios/
├── index.html          ← Página principal
├── styles.css          ← Estilos
├── app.js              ← Lógica principal
├── firebase-config.js  ← Config Firebase
├── ESCOPO.md           ← Documento de escopo completo
└── README.md           ← Este arquivo
```

---

**v1.0** — 24/03/2026
