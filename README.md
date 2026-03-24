# 📊 Sistema de Contabilidade Multi-Usuário com Controle de Acesso

Sistema web completo para gerenciamento de **Distribuição de Lucros aos Sócios** e **Rendimentos de Aplicação Financeira** com **controle de acesso baseado em roles** (Gerência e Sócio), sincronização em nuvem via **Firebase Firestore** e fallback para armazenamento local.

## ✨ Funcionalidades Principais

### 🔐 Sistema de Autenticação e Controle de Acesso
- Login por **CPF + Senha** (sem e-mail)
- Dois níveis de acesso: **⭐ Gerência** e **👔 Sócio**
- Criação de usuários exclusivamente pela Gerência (sem autoatendimento)
- Badge de role visível após o login
- Sessão persistente via `localStorage`

### ⭐ Recursos da GERÊNCIA
- Criar, visualizar e excluir usuários
- Filtrar dados por sócio específico ou visualização consolidada ("Todos os Sócios")
- Editar registros de qualquer sócio
- Selecionar o sócio beneficiário ao criar registros (dropdown completo)
- Exportar dados de **todos** os sócios em CSV (com coluna "Registrado por")
- Acesso ao **Painel de Administração** (⚙️ Admin)

### 👔 Recursos do SÓCIO
- Visualiza e edita apenas seus próprios registros
- Beneficiário fixo (seu próprio nome) ao criar registros
- Não acessa dados de outros sócios
- Exporta apenas seus próprios dados em CSV

### 💰 Distribuição de Lucros aos Sócios
- Registro de distribuições com: data, sócio beneficiário, descrição, valor e observações
- Filtro por intervalo de datas (de / até)
- Edição e exclusão de registros
- Totalizador automático por período filtrado

### 📈 Rendimentos de Aplicação Financeira
- Registro de rendimentos com: mês/ano, descrição, valor e observações
- Filtro por mês e ano
- Edição e exclusão de registros
- Totalizador automático por período filtrado

### 👥 Gerenciamento de Sócios
- Lista de sócios da empresa (separada dos usuários do sistema)
- Cada usuário mantém sua própria lista de sócios
- Modal "Sócios da Empresa" acessível a todos os usuários

## 🚀 Como Usar

### Primeiro Acesso (Administrador)

1. Abra o arquivo `index.html` no navegador
2. Faça login com as credenciais do **Administrador Padrão:**
   ```
   CPF: 00000000000
   Senha: admin123
   ```
3. Clique no botão **"⚙️ Administração"** no canto superior direito
4. No **Painel de Administração**, crie os primeiros usuários:
   - Preencha: Nome completo, CPF (11 dígitos), Senha
   - Escolha a Role: **"Sócio"** ou **"Gerência"**
   - Clique em **"Criar Usuário"**
5. Informe as credenciais aos respectivos usuários

### Login de Usuários
1. Digite seu CPF (apenas números, 11 dígitos)
2. Digite sua senha
3. Clique em **"Entrar"**
4. Você verá seu **badge de role** no canto superior direito:
   - **⭐ GERÊNCIA** — Acesso total
   - **👔 SÓCIO** — Acesso limitado aos próprios dados

### Operações da GERÊNCIA

#### Criar Novos Usuários
1. Clique em **"⚙️ Administração"** no canto superior direito
2. Preencha o formulário:
   - Nome completo do usuário
   - CPF (11 dígitos, apenas números)
   - Senha (mínimo 4 caracteres)
   - Role: **"Gerência"** ou **"Sócio"**
3. Clique em **"Criar Usuário"**
4. O novo usuário poderá fazer login imediatamente

#### Visualizar Dados de Sócios Específicos
1. Use o **dropdown "Visualizar dados de:"** no topo da tela
2. Selecione um sócio específico para ver e editar seus dados
3. Ou selecione **"Todos os Sócios"** para visão consolidada (somente leitura)

#### Excluir Usuários
1. Acesse **"⚙️ Administração"**
2. Na tabela de usuários, clique em **"🗑️ Excluir"** ao lado do usuário
3. Confirme a exclusão — **os dados serão apagados permanentemente**

#### Exportar Todos os Dados
1. Clique em **"📥 Exportar Tudo"** (ao lado do filtro de sócios)
2. Serão gerados e baixados automaticamente dois arquivos CSV:
   - `distribuicao_lucros.csv`
   - `rendimentos_financeiros.csv`

### Operações do SÓCIO

#### Adicionar Registros de Lucros
1. Acesse a aba **"💰 Distribuição de Lucros"**
2. Clique em **"➕ Adicionar Registro"**
3. Preencha os campos:
   - Data do crédito
   - Descrição (opcional)
   - Valor
   - Observações (opcional)
4. Clique em **"Salvar"** — o registro é persistido imediatamente

#### Adicionar Rendimentos
1. Acesse a aba **"📈 Rendimentos Financeiros"**
2. Clique em **"➕ Adicionar Registro"**
3. Preencha os campos necessários
4. Clique em **"Salvar"**

### Operações Comuns a Todos

#### Editar Dados
- Clique no ícone de edição (✏️) na linha do registro desejado
- Altere os campos e confirme

#### Excluir Registros
- Clique no ícone de exclusão (🗑️) na linha do registro
- Confirme a exclusão na caixa de diálogo

#### Exportar para Excel (CSV)
- Clique em **"📥 Exportar para Excel"** na aba correspondente
- O arquivo CSV pode ser aberto diretamente no Excel ou Google Sheets

## 💾 Armazenamento de Dados

### Estrutura de Dados

Os dados são armazenados no **Firebase Firestore** (quando configurado) com fallback automático para **`localStorage`** do navegador. As coleções utilizadas são:

| Coleção Firestore | Conteúdo |
|---|---|
| `sistema/usuarios` | Lista de todos os usuários (nome, CPF, hash de senha, role) |
| `dados_usuario/{cpf}` | Registros de lucros e rendimentos de cada usuário |
| `socios_empresa/{cpf}` | Lista de sócios da empresa de cada usuário |

### Backup e Recuperação

- **Exportação manual:** use os botões "📥 Exportar para Excel" ou "📥 Exportar Tudo" para gerar CSVs a qualquer momento
- **Firebase:** os dados ficam sincronizados na nuvem automaticamente
- **localStorage:** funciona como cache/fallback offline; os dados persistem enquanto o cache do navegador não for limpo
- **Recomendação:** realize exportações CSV periodicamente (semanal ou mensal)

## 🔒 Segurança e Privacidade

### Sistema de Controle de Acesso

#### 1. Criação de Usuários
- Sistema inicia com Administrador padrão (CPF: `00000000000`, Senha: `admin123`)
- Apenas Gerência pode criar novos usuários
- Não há registro público ou autoatendimento
- Cada usuário recebe credenciais diretamente da gerência

#### 2. Roles (Funções)
- **⭐ GERÊNCIA:** Acesso total — cria/exclui usuários, visualiza e edita dados de qualquer sócio
- **👔 SÓCIO:** Acesso restrito aos próprios registros

#### 3. Isolamento de Dados
- Cada sócio possui armazenamento separado (chaveado pelo CPF)
- Sócios não acessam dados de outros sócios
- Gerência pode filtrar e visualizar dados de forma seletiva ou consolidada

#### 4. Auditoria (para Gerência)
- A exportação consolidada ("Exportar Tudo") inclui a coluna **"Registrado por"**
- Permite rastrear qual usuário criou cada registro
- Trilha de auditoria embutida nos próprios arquivos CSV exportados

### Limitações de Segurança

> ⚠️ **Este é um sistema cliente-side (frontend only).**
> As senhas são armazenadas em texto simples no Firestore/localStorage.
> Não utilize senhas de uso pessoal (banco, e-mail etc.) neste sistema.
> Para ambientes corporativos com requisitos de segurança elevados, considere
> migrar para uma solução com backend autenticado (ex: Firebase Authentication).

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Função |
|---|---|
| HTML5 | Estrutura e interface do usuário |
| CSS3 | Estilização e layout responsivo |
| JavaScript (ES6+) | Lógica de negócio e manipulação do DOM |
| Firebase Firestore | Banco de dados em nuvem e sincronização |
| localStorage | Armazenamento local e cache offline |

## 📱 Responsividade

O sistema funciona em:
- Desktops e notebooks
- Tablets (layout adaptado)
- Smartphones (interface otimizada para toque)

## 📝 Notas Importantes

### Para Todos os Usuários
1. **Primeiro Acesso:** Use as credenciais do admin padrão (CPF: `00000000000`, Senha: `admin123`)
2. **CPF:** Use apenas números no login (11 dígitos, sem pontos ou traços)
3. **Valores:** Use ponto ou vírgula para casas decimais
4. **Datas:** Utilize os seletores de data/mês para evitar erros de formato
5. **Backup Regular:** Exporte seus dados periodicamente

### Para Gerência
1. **Criar Usuários:** Acesse o Painel de Administração para criar sócios e outros gerentes
2. **Senhas Seguras:** Oriente os usuários a não reutilizarem senhas pessoais
3. **Auditoria:** Use "Exportar Tudo" para gerar relatórios consolidados
4. **Filtros:** Use o dropdown "Visualizar dados de:" para alternar entre sócios
5. **Exclusão:** A exclusão de usuários apaga todos os dados vinculados permanentemente
6. **Múltiplos Gerentes:** É possível criar outros usuários com role "Gerência"

### Para Sócios
1. **Acesso Limitado:** Você vê e edita apenas seus próprios registros
2. **Privacidade:** Outros sócios não veem seus dados
3. **Exportação:** Seus arquivos CSV contêm apenas seus registros

## 🔧 Exemplo de Uso

**Cenário:** Empresa com 1 gerente (Admin) e 3 sócios (João, Maria e Pedro)

### Configuração Inicial
1. **Admin** faz login com CPF: `00000000000` e senha: `admin123`
2. Abre o Painel de Administração (⚙️)
3. Cria os 3 usuários:
   - João Silva — CPF: `11111111111` — Senha: `joao123` — Role: Sócio
   - Maria Santos — CPF: `22222222222` — Senha: `maria123` — Role: Sócio
   - Pedro Costa — CPF: `33333333333` — Senha: `pedro123` — Role: Sócio
4. Comunica as credenciais para cada sócio

### Operações Diárias
5. **João** faz login e registra distribuição de lucros (R$ 5.000)
6. **Maria** faz login e registra rendimentos financeiros — Banco ABC (R$ 1.200)
7. **Pedro** faz login e registra distribuição de lucros (R$ 3.500)
8. Cada sócio vê apenas os registros que ele mesmo criou

### Auditoria (Gerência)
9. **Admin** seleciona "Todos os Sócios" no filtro e visualiza todos os registros consolidados
10. Clica em "📥 Exportar Tudo" e obtém 2 arquivos CSV com a coluna "Registrado por"
11. Pode filtrar por sócio específico para visualizar ou editar dados individuais

## 🆘 Solução de Problemas

### Esqueci minha senha
Entre em contato com a Gerência para que sua conta seja excluída e recriada com nova senha.

### Não consigo fazer login com CPF 00000000000
Dados antigos podem estar em conflito. Experimente as soluções abaixo em ordem:

**Solução 1 — Limpar Cache do Navegador:**
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Cookies e outros dados do site"
3. Clique em "Limpar dados"
4. Recarregue a página (`F5`)

**Solução 2 — Console do Navegador:**
1. Pressione `F12` para abrir o DevTools
2. Na aba **Console**, execute: `localStorage.clear()`
3. Recarregue a página (`F5`)

**Solução 3 — Página de Reset:**
1. Abra o arquivo [RESETAR-SISTEMA.html](RESETAR-SISTEMA.html)
2. Clique em **"RESETAR TODO O SISTEMA"**
3. Retorne ao `index.html` e faça login normalmente

> ⚠️ As soluções 2 e 3 apagam **todos os dados locais**. Se o Firebase estiver configurado, os dados em nuvem são preservados e serão sincronizados no próximo acesso.

### Não vejo o botão "⚙️ Administração"
Esse botão é exclusivo para usuários com role **Gerência**. Verifique se sua conta possui essa permissão.

### Não consigo adicionar registros
Verifique se está visualizando dados do seu próprio usuário (e não a visão consolidada "Todos os Sócios", que é somente leitura).

### Dados não sincronizam com o Firebase
Verifique no console do navegador (`F12 → Console`) se há erros de conexão. O sistema funciona normalmente com `localStorage` quando o Firebase estiver indisponível.

## 📂 Estrutura de Arquivos

```
Contabilidade/
├── index.html              # Interface principal do sistema
├── app.js                  # Lógica de negócio e manipulação de dados
├── styles.css              # Estilos e layout responsivo
├── firebase-config.js      # Configuração da conexão com o Firebase
├── RESETAR-SISTEMA.html    # Utilitário de reset de emergência
└── Doc/
    ├── SISTEMA-ROLES.md           # Documentação do sistema de roles
    ├── DIFERENÇAS-SOCIO-GERENCIA.md  # Comportamentos por tipo de usuário
    ├── GUIA-RAPIDO.md             # Referência rápida de uso
    └── CHECKLIST-TESTES.md        # Checklist de validação do sistema
```

## 🔧 Configuração do Firebase (Opcional)

Para habilitar a sincronização em nuvem, edite o arquivo `firebase-config.js` com as credenciais do seu projeto Firebase:

```js
window.firebaseConfig = {
    apiKey: "SEU_API_KEY",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_ID",
    appId: "SEU_APP_ID"
};
```

Passos:
1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um projeto e ative o **Firestore Database** (modo de teste)
3. Em **Configurações do projeto → Geral → Seus aplicativos**, registre um app Web
4. Copie o objeto `firebaseConfig` gerado e cole no arquivo acima

Sem Firebase configurado, o sistema opera 100% via `localStorage`.

---

**Sistema de Contabilidade Multi-Usuário com Controle de Acesso**  
**Versão:** 3.0.0  
**Última atualização:** Março 2026  
**Desenvolvido com ❤️ para facilitar sua contabilidade**
