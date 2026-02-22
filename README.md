# 📊 Sistema de Contabilidade Multi-Usuário com Controle de Acesso

Sistema web completo para gerenciamento de **Distribuição de Lucros aos Sócios** e **Rendimentos de Aplicação Financeira** com **controle de acesso baseado em roles** (Gerência e Sócio).

## ✨ Funcionalidades Principais

### 🔐 Sistema de Autenticação e Controle de Acesso
- **Login individual** para cada usuário com CPF e senha
- **Dois níveis de acesso:** Gerência e Sócio
- **Cadastro controlado:** Apenas Gerência pode criar novos usuários
- **Administrador padrão** criado automaticamente (CPF: 00000000000)
- Cada sócio acessa apenas seus próprios dados
- Gerência visualiza e gerencia dados de todos os sócios
- Dados isolados e seguros por usuário
- Logout seguro

### ⭐ Recursos da GERÊNCIA
- ✅ **Painel de Administração** para criar e gerenciar usuários
- ✅ **Filtros avançados** para visualizar dados de sócios específicos
- ✅ **Visualização consolidada** de todos os sócios
- ✅ **Exportação completa** de dados de todos os usuários
- ✅ **Atribuição de roles** (Gerência ou Sócio)
- ✅ **Exclusão de usuários** e seus dados
- ✅ Acesso total ao sistema

### 👔 Recursos do SÓCIO
- ✅ Registro de distribuição de lucros
- ✅ Registro de rendimentos financeiros
- ✅ Visualização dos próprios dados
- ✅ Edição dos próprios registros
- ✅ Exportação dos próprios dados
- ✅ Visualização da lista de sócios

### 💰 Distribuição de Lucros aos Sócios
- Registro de data do crédito
- **Seleção do sócio beneficiário** a partir da lista cadastrada
- Descrição da operação (opcional)
- Valor em R$
- Observações personalizadas
- Cálculo automático do total distribuído
- Visualização de todos os sócios da empresa

### 📈 Rendimentos de Aplicação Financeira
- Registro por mês/ano
- Nome do banco
- Valor do rendimento
- IR retido pelo banco
- Observações
- Cálculo automático dos totais

### 👥 Gerenciamento de Sócios
- Lista completa de todos os sócios cadastrados
- Visualização de nome, CPF e role
- Indicação de qual é o usuário logado
- Filtros para gerência visualizar dados específicos

## 🚀 Como Usar

### Primeiro Acesso (Administrador)

1. Abra o arquivo `index.html` no navegador
2. Faça login com as credenciais do **Administrador Padrão:**
   ```
   CPF: 00000000000
   Senha: admin123
   ```
3. Clique no botão **"⚙️ Admin"** no canto superior direito
4. No **Painel de Administração**, crie os primeiros usuários:
   - Preencha: Nome completo, CPF (11 dígitos), Senha
   - Escolha a Role: **"Sócio"** ou **"Gerência"**
   - Clique em **"Criar Usuário"**
5. Informe as credenciais aos respectivos usuários

### Login de Usuários
1. Digite seu CPF (apenas números)
2. Digite sua senha
3. Clique em **"Entrar"**
4. Você verá seu **badge de role** no canto superior direito:
   - **⭐ GERÊNCIA** - Acesso total
   - **👔 SÓCIO** - Acesso limitado

### Operações da GERÊNCIA

#### Criar Novos Usuários
1. Clique em **"⚙️ Admin"** no canto superior direito
2. No painel, preencha:
   - Nome completo do usuário
   - CPF (11 dígitos, apenas números)
   - Senha (mínimo 4 caracteres)
   - Role: Selecione "Gerência" ou "Sócio"
3. Clique em **"Criar Usuário"**
4. O novo usuário poderá fazer login imediatamente

#### Visualizar Dados de Sócios Específicos
1. Use o **dropdown "Filtrar Sócio:"** no topo da tela
2. Selecione um sócio específico para ver/editar seus dados
3. Ou selecione **"Todos os Sócios"** para visão consolidada (somente leitura)

#### Excluir Usuários
1. Acesse **"⚙️ Admin"**
2. Na tabela de usuários, clique em **"🗑️ Excluir"** ao lado do usuário
3. Confirme a exclusão (dados serão perdidos)

#### Exportar Todos os Dados
1. Clique em **"📥 Exportar Todos os Dados"** (abaixo do filtro)
2. Serão gerados arquivos CSV com dados de todos os sócios:
   - `distribuicao_lucros.csv`
   - `rendimentos_financeiros.csv`

### Operações do SÓCIO

#### Ver Todos os Sócios
- Clique no botão **"👥 Gerenciar Sócios"** no canto superior direito
- Você verá a lista completa de sócios cadastrados com suas roles
- Identifica qual é você na lista

#### Adicionar Registros de Lucros
1. Na aba **"💰 Distribuição de Lucros"**
2. Clique no botão **"➕ Adicionar Registro"**
3. Preencha os campos:
   - Data do crédito
   - Selecione o sócio beneficiário (dropdown)
   - Descrição (opcional)
   - Valor
   - Observações (opcional)
4. Os dados são salvos automaticamente

#### Adicionar Rendimentos
1. Na aba **"📈 Rendimentos Financeiros"**
2. Clique no botão **"➕ Adicionar Registro"**  
3. Preencha os campos necessários
4. Os dados são salvos automaticamente

### Operações Comuns a Todos

#### Editar Dados
- Clique em qualquer campo da tabela
- Digite ou selecione o novo valor
- A alteração é salva automaticamente
- **Sócios:** Editam apenas os próprios dados
- **Gerência:** Pode editar dados ao filtrar um sócio específico

#### Excluir Registros
- Clique no botão **"🗑️ Excluir"** na linha desejada
- Confirme a exclusão
- **Gerência:** Pode excluir ao visualizar sócio específico (não em "Todos")

#### Exportar para Excel
- Clique no botão **"📥 Exportar Excel"** em cada aba
- O arquivo CSV será baixado (abre automaticamente no Excel)
- **Sócios:** Exportam apenas os próprios dados
- **Gerência:** Exporta dados do sócio filtrado ou de todos

#### Limpar Todos os Dados
- Clique no botão **"🗑️ Limpar Tudo"**
- Confirme a ação (ATENÇÃO: não pode ser desfeita!)
- **Sócios:** Limpam apenas os próprios dados
- **Gerência:** Limpa dados do sócio filtrado (deve selecionar um específico)

### Navegação
- Use as abas no topo para alternar entre as planilhas
- **Atalhos de Teclado:**
  - `Ctrl + 1` = Aba de Distribuição de Lucros
  - `Ctrl + 2` = Aba de Rendimentos Financeiros
  - `Ctrl + N` = Adicionar novo registro

## 💾 Armazenamento de Dados

### Estrutura de Dados
- **Dados separados por usuário** - Cada sócio vê apenas seus próprios registros
- **Lista de sócios compartilhada** - Todos podem ver quem são os sócios e suas roles
- **Armazenamento local** - Dados salvos no navegador (LocalStorage)
- **Chaves por CPF** - Cada usuário tem uma chave única: `dados_{cpf}`
- Não precisa de conexão com internet para usar
- Os dados ficam salvos mesmo se você fechar e abrir o navegador novamente
- **IMPORTANTE:** Se você limpar os dados do navegador (cache/cookies), os dados do sistema serão perdidos

### Backup e Recuperação
- **Para Sócios:** Exporte seus dados regularmente clicando em "📥 Exportar Excel"
- **Para Gerência:** Use "📥 Exportar Todos os Dados" para backup completo
- Os arquivos CSV gerados podem ser salvos como backup
- Recomenda-se fazer backups semanais ou mensais

## 🔒 Segurança e Privacidade

### Sistema de Controle de Acesso

#### 1. **Criação de Usuários**
   - Sistema inicia com Administrador padrão (CPF: 00000000000)
   - Apenas Gerência pode criar novos usuários
   - Não há registro público ou autoatendimento
   - Cada usuário recebe credenciais da gerência

#### 2. **Roles (Funções)**
   - **⭐ GERÊNCIA:** Acesso total, pode criar/excluir usuários, visualizar tudo
   - **👔 SÓCIO:** Acesso limitado aos próprios dados

#### 3. **Isolamento de Dados**
   - Cada sócio tem armazenamento separado
   - Sócios não acessam dados de outros sócios
   - Gerência pode filtrar e visualizar dados específicos ou consolidados

#### 4. **Auditoria (para Gerência)**
   - Ao exportar "Todos os Sócios", inclui coluna "Registrado por"
   - Permite rastreabilidade de quem criou cada registro
   - Logs ficam nos próprios dados exportados

### Importante sobre Segurança
- Todos os dados ficam **apenas no seu computador/navegador**
- Nenhuma informação é enviada para servidores externos
- As senhas ficam armazenadas localmente **em texto puro** (sistema cliente-side)
- **Não use senha bancária ou importante** (use senha simples e exclusiva)
- Para segurança real, seria necessário backend com criptografia
- Ideal para manter privacidade dos dados contábeis em ambiente local controlado

### Limitações de Segurança
⚠️ **Este é um sistema cliente-side (frontend only):**
- Segurança é UX-based, não criptográfica
- Qualquer pessoa com acesso ao navegador pode inspecionar o LocalStorage
- Senhas não são criptografadas (hash)
- Não há autenticação de dois fatores (2FA)
- Não há logs de auditoria permanentes

💡 **Para ambientes corporativos/produção:**
- Considere implementar backend com Node.js/Express
- Use banco de dados (PostgreSQL, MongoDB)
- Implemente JWT para autenticação
- Use bcrypt para hash de senhas
- Configure HTTPS
- Adicione logs de auditoria

## 📱 Responsividade

O sistema funciona perfeitamente em:
- 💻 Computadores/Notebooks (recomendado)
- 📱 Tablets
- 📲 Smartphones

## 🎨 Recursos Visuais

- Interface moderna e intuitiva
- **Tela de login** profissional com aviso de acesso controlado
- **Badges de role** visíveis (⭐ GERÊNCIA / 👔 SÓCIO)
- **Painel de Administração** modal para gerência
- **Filtros visuais** para seleção de sócios (apenas gerência)
- **Identificação do usuário logado** no cabeçalho com nome e role
- Tema de cores profissional com gradiente roxo
- Animações suaves e transições
- **Mensagens de sucesso** com notificações temporárias
- **Dropdown de seleção de sócios** (em vez de digitar manualmente)
- Totais calculados automaticamente com atualização em tempo real
- Formatação automática de CPF (000.000.000-00)
- Formatação de valores em moeda brasileira (R$)
- **Modal de gerenciamento de sócios** com visualização de roles
- **Tabela de administração de usuários** com ações (criar/excluir)
- **Botões contextuais** (Admin, Exportar Todos) aparecem conforme a role
- Design responsivo para desktop, tablet e mobile

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Estrutura
- **CSS3** - Estilos e animações
- **JavaScript** - Lógica e funcionalidades
- **LocalStorage** - Armazenamento de dados

## 📝 Notas Importantes

### Para Todos os Usuários:
1. **Primeiro Acesso:** Use as credenciais do admin padrão (CPF: 00000000000, Senha: admin123)
2. **CPF:** Use apenas números no login (11 dígitos, sem pontos ou traços)
3. **Valores:** Use ponto ou vírgula para decimais nos campos de valor
4. **Datas:** Use os seletores de data/mês para evitar erros de formato
5. **Seleção de Sócios:** Ao criar registros, selecione o sócio do dropdown
6. **Backup Regular:** Exporte seus dados periodicamente (semanal ou mensal)

### Para Gerência:
1. **Criar Usuários:** Acesse o painel Admin para criar sócios e outros gerentes
2. **Senhas Seguras:** Oriente os sócios a não usar senhas importantes
3. **Auditoria:** Use "Exportar Todos os Dados" para gerar relatórios consolidados
4. **Filtros:** Use o dropdown "Filtrar Sócio" para visualização específica ou geral
5. **Exclusão:** Tenha cuidado ao excluir usuários (dados são perdidos permanentemente)
6. **Gerente Adicional:** Você pode criar outros usuários com role "Gerência"

### Para Sócios:
1. **Acesso Limitado:** Você vê e edita apenas seus próprios registros
2. **Registros Corporativos:** Pode registrar distribuições para qualquer sócio da lista
3. **Privacidade:** Outros sócios não veem seus dados
4. **Lista Compartilhada:** Todos podem ver a lista de sócios cadastrados
5. **Exportação:** Seus arquivos CSV contêm apenas seus registros

## 🔧 Exemplo de Uso

**Cenário:** Empresa com 1 gerente (Admin) e 3 sócios (João, Maria e Pedro)

### Configuração Inicial:
1. **Admin** acessa o sistema com CPF: 00000000000 e senha: admin123
2. **Admin** abre o Painel Admin (⚙️)
3. **Admin** cria 3 usuários:
   - João Silva - CPF: 11111111111 - Senha: joao123 - Role: Sócio
   - Maria Santos - CPF: 22222222222 - Senha: maria123 - Role: Sócio
   - Pedro Costa - CPF: 33333333333 - Senha: pedro123 - Role: Sócio
4. **Admin** comunica as credenciais para cada sócio

### Operações Diárias:
5. **João** faz login e registra uma distribuição de lucros para Maria (R$ 5.000)
6. **Maria** faz login e registra rendimentos financeiros do Banco ABC (R$ 1.200)
7. **Pedro** faz login e registra uma distribuição de lucros para João (R$ 3.500)
8. Cada sócio vê apenas os registros que ELE criou
9. Mas todos podem selecionar qualquer sócio ao criar distribuições

### Auditoria (Gerência):
10. **Admin** faz login e filtra por "Todos os Sócios"
11. **Admin** vê todos os registros consolidados
12. **Admin** clica em "📥 Exportar Todos os Dados"
13. Recebe 2 arquivos CSV com dados de todos (incluindo coluna "Registrado por")
14. **Admin** pode filtrar por sócio específico para visualizar/editar dados individuais

### Manutenção:
15. **Admin** pode criar novos usuários conforme a empresa cresce
16. **Admin** pode excluir usuários que saíram da sociedade
17. **Sócios** fazem backup mensal exportando seus próprios dados

## 🆘 Solução de Problemas

### Esqueci minha senha
- **Sócios:** Entre em contato com a Gerência para redefinir sua senha
- **Gerência:** Use a página [RESETAR-SISTEMA.html](RESETAR-SISTEMA.html) para limpar tudo e recriar o admin
  - ⚠️ Isso apaga TODOS os dados do sistema
  - Sistema recriará o admin padrão automaticamente

### Não consigo fazer login com CPF 00000000000
Se você não consegue fazer login com as credenciais do admin, pode ser devido a dados antigos:

**Solução 1 - Limpar Cache do Navegador:**
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Cookies e outros dados do site"
3. Clique em "Limpar dados"
4. Recarregue a página (F5)

**Solução 2 - Usar Console do Navegador:**
1. Pressione F12 para abrir o Console
2. Execute: `localStorage.clear()`
3. Recarregue a página (F5)

**Solução 3 - Usar Página de Reset:**
1. Abra o arquivo [RESETAR-SISTEMA.html](RESETAR-SISTEMA.html)
2. Clique em "RESETAR TODO O SISTEMA"
3. Sistema será limpo e admin será recriado
4. Volte para a página principal e faça login

### Não vejo o botão "⚙️ Admin"
- Verifique se sua role é "Gerência"
- Badge no canto deve mostrar "⭐ GERÊNCIA"
- Se você é Sócio, não terá acesso ao painel Admin

### Não consigo adicionar registros
- Se você é Gerência: Selecione um sócio específico no filtro (não "Todos")
- Se você é Sócio: Verifique se está logado corretamente

### Perdi todos os dados
- LocalStorage foi limpo (cache do navegador)
- Não há recuperação automática
- **Solução:** Restaure do último backup (arquivos CSV exportados)
- **Prevenção:** Faça backups regulares

### Campos não salvam automaticamente
- Verifique se está com internet (não necessária, mas pode afetar o navegador)
- Recarregue a página (F5)
- Verifique o console do navegador (F12) por erros

## 📞 Suporte

**Sistema de Contabilidade Multi-Usuário com Controle de Acesso v3.0**

### Documentação Completa:
- [README.md](README.md) - Este arquivo (documentação geral)
- [SISTEMA-ROLES.md](SISTEMA-ROLES.md) - Detalhes sobre roles e permissões
- [GUIA-RAPIDO.md](GUIA-RAPIDO.md) - Guia rápido de uso
- [CHECKLIST-TESTES.md](CHECKLIST-TESTES.md) - Checklist de testes

### Tecnologias:
- HTML5 + CSS3 + JavaScript (Vanilla)
- LocalStorage API
- Arquitetura cliente-side (sem backend)

### Desenvolvido para:
- Controle de Distribuição de Lucros aos Sócios
- Controle de Rendimentos de Aplicações Financeiras
- Gestão multi-usuário com isolamento de dados
- Sistema de permissões baseado em roles

---

**Última atualização:** 2025 - Sistema com controle de acesso implementado

---

**Versão:** 2.0.0 - Multi-Usuário  
**Data:** Fevereiro 2026  
**Desenvolvido com ❤️ para facilitar sua contabilidade**
