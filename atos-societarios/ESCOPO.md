# 📋 Escopo — Sistema de Gestão de Atos Societários

## Visão Geral

Sistema web para escritório de contabilidade gerenciar **Abertura**, **Alteração** e **Encerramento** de empresas. Clientes preenchem formulários online; a contabilidade acompanha e gerencia todo o processo.

**Stack:** HTML + CSS + JS vanilla + Firebase Firestore (mesmo template visual do sistema anterior)

---

## 👥 Atores do Sistema

| Ator | Acesso | O que faz |
|------|--------|-----------|
| **Cliente** | Formulário online (link único ou login) | Preenche dados, envia documentos, acompanha status |
| **Contabilidade** | Login no sistema | Gerencia processos, altera status, acompanha etapas |

---

## 🏗️ Funcionalidades por Módulo

### 🔐 1. Acesso (sem login)

- **Contabilidade:** acessa o painel direto pela URL principal
- **Cliente:** acessa via **links únicos** gerados pelo sistema
  - `/?form={codigo}` → preenche os dados do processo (edição)
  - `/?status={codigo}` → acompanha o status (visualização)
- Cada processo gera **2 códigos aleatórios** diferentes
- O cliente **não precisa de login** — só acessar o link
- A contabilidade copia/envia os links via WhatsApp para o cliente

---

### 📝 2. ATO 1 — ABERTURA DE EMPRESA

#### 2.1 Formulário do Cliente (12 Campos)

| # | Campo | Tipo | Observação |
|---|-------|------|------------|
| 1 | Razão Social (opção 1) | Texto | Nome da empresa |
| 2 | Razão Social (opção 2) | Texto | Nome alternativo para consulta |
| 3 | Endereço da Sede | Texto (textarea) | Endereço completo |
| 4 | IPTU | Upload (imagem/PDF) | Comprovante de endereço |
| 5 | Documentos dos Sócios | Upload (imagem/PDF) | RG, CPF — por sócio |
| 6 | Qualificação Civil dos Sócios | Campos dinâmicos | Nacionalidade, profissão, estado civil, regime de casamento, endereço |
| 7 | Capital Social | Numérico (R$) | Valor total |
| 8 | Participação dos Sócios | Dinâmico (%) | % por sócio + cálculo automático em R$ |
| 9 | Atividade Principal | Texto | CNAE ou descrição |
| 10 | Atividade Secundária | Texto | CNAE ou descrição |
| 11 | Sócios e Administradores | Dinâmico | Lista de sócios com checkbox de admin |
| 12 | Responsável na Receita Federal | Select | 1 sócio selecionado |

#### 2.2 Dados para Cartão CNPJ

| Campo | Tipo | Observação |
|-------|------|------------|
| Telefone | Texto | ⚠️ Dados públicos (aviso no formulário) |
| Número | Texto | |
| E-mail | E-mail | Sugestão: criar e-mail específico |

#### 2.3 Dados Complementares

| Campo | Tipo |
|-------|------|
| E-mail dos Sócios | E-mail (lista) |
| Porte da Empresa | Select (ME / EPP) |
| Regime Tributário | Select (Simples Nacional / Lucro Presumido / Lucro Real) |
| Valor da Abertura | Fixo R$ 1.000,00 (exibição) |

#### 2.4 Fluxo Interno (etapas de acompanhamento)

```
📋 Solicitação Criada
  → Rede Sim (viabilidade)     [status: pendente/em andamento/concluído]
  → DBE                        [status: pendente/em andamento/concluído]
  → ClickSign (assinatura)     [status: pendente/em andamento/concluído]
  → JUCESP (registro)          [status: pendente/em andamento/concluído]
  → Exigência (se houver)      [status: N/A/pendente/resolvida]
  → Inscrição Estadual/Municipal [status: pendente/em andamento/concluído]
✅ Empresa Aberta
```

#### 2.5 Pós-Abertura (mensagem automática para o cliente)

- Acessar Portal da JUCESP com senha Gov.br
- Assinatura dos documentos online
- Adquirir Certificado Digital A1

---

### ✏️ 3. ATO 2 — ALTERAÇÃO DO CONTRATO SOCIAL

#### 3.1 Tipos de Alteração (7)

| # | Tipo | Campos Específicos |
|---|------|-------------------|
| 1 | Razão Social | Nova razão social (2 opções) |
| 2 | Endereço | Novo endereço + upload IPTU |
| 3 | Quadro Societário | Entrada/saída de sócios + docs |
| 4 | Objeto Social | Nova descrição do objeto |
| 5 | Cláusulas Vigentes | Campo livre (texto) |
| 6 | Transformação de Tipo | Tipo atual → tipo novo (MEI→ME, etc.) |
| 7 | Capital Social | Valor novo + integralização (imóveis ou dinheiro) |

#### 3.2 Fluxo Interno

```
📋 Solicitação Criada (com tipo selecionado)
  → Formulário específico preenchido
  → ClickSign (assinatura)
  → JUCESP (registro)
  → Exigência (se houver)
✅ Alteração Registrada
```

---

### ❌ 4. ATO 3 — ENCERRAMENTO (DISTRATO SOCIAL)

#### 4.1 Campos

| Campo | Tipo |
|-------|------|
| Distrato Social | Upload ou geração |
| Documentos Pessoais dos Sócios | Upload |
| Encerramento na Prefeitura | Status |

#### 4.2 Fluxo Interno

```
📋 Solicitação Criada
  → Distrato elaborado
  → Docs pessoais coletados
  → Encerramento Prefeitura
  → Encerramento JUCESP/RFB
✅ Empresa Encerrada
```

---

### 📊 5. DASHBOARD (Contabilidade)

- **Visão geral:** total de processos por tipo (abertura/alteração/encerramento)
- **Filtro por status:** pendentes, em andamento, concluídos
- **Alertas de prazo:** processos parados há X dias
- **Lista de processos:** com nome do cliente, tipo, etapa atual, responsável

---

### 👤 6. PAINEL DO CLIENTE

- **Meus processos:** lista com status atual de cada solicitação
- **Detalhe do processo:** etapas concluídas, pendências, próximos passos
- **Upload de documentos:** enviar arquivos solicitados pela contabilidade
- **Notificações:** quando algo muda de status ou precisa de ação

---

## 🔔 Notificações

| Evento | Para quem | Método |
|--------|-----------|--------|
| Cliente preenche formulário | Contabilidade | In-app + (futuro: WhatsApp/email) |
| Status muda de etapa | Cliente | In-app |
| Documento pendente | Cliente | In-app |
| Exigência aparece | Cliente + Contabilidade | In-app |
| Processo concluído | Cliente | In-app |

---

## 💰 Valores

| Ato | Valor |
|-----|-------|
| Abertura | R$ 1.000,00 |
| Alteração | _(a definir)_ |
| Encerramento | _(a definir)_ |

---

## 🛠️ Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML + CSS + JS vanilla |
| Backend/DB | Firebase Firestore |
| Auth | Firebase Auth (CPF+senha custom) |
| Storage | Firebase Storage (uploads) |
| Hospedagem | Firebase Hosting ou GitHub Pages |

---

## 📂 Estrutura de Pastas

```
atos-societarios/
├── index.html          ← Página principal
├── styles.css          ← Estilos (reaproveitado do sistema anterior)
├── app.js              ← Lógica principal
├── firebase-config.js  ← Config Firebase
├── ESCOPO.md           ← Este documento
└── README.md           ← Documentação do usuário
```

---

## ⚡ Prioridades de Desenvolvimento

### Fase 1 — MVP
1. ✅ Template visual (CSS + estrutura HTML)
2. Autenticação (login/logout, perfis cliente/contabilidade)
3. Formulário de Abertura (12 campos + upload)
4. Fluxo de etapas com status
5. Dashboard básico para contabilidade
6. Painel do cliente (ver processos)

### Fase 2
7. Alteração do Contrato Social (7 tipos)
8. Encerramento
9. Notificações in-app
10. Controle de prazos/alertas

### Fase 3
11. Integração ClickSign (API)
12. Integração WhatsApp (notificações)
13. Pagamento online
14. Relatórios/exportação

---

## ❓ Pendências de Definição

- [x] Como o cliente acessa? → **Links únicos (sem login)**
- [ ] Pagamento online (R$ 1.000) ou manual?
- [ ] Quantas pessoas na contabilidade vão usar?
- [ ] ClickSign tem API disponível?
- [ ] Rede Sim tem API ou é manual?
- [ ] DBE preenchido no sistema ou portal externo?
- [ ] Valor para alteração e encerramento?
- [ ] Geração automática do contrato social?

---

**Versão:** 1.0 — 24/03/2026
