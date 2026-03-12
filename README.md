# 📊 Sistema de Contabilidade Multi-Usuário com Controle de Acesso

Sistema web completo para gerenciamento de **Distribuição de Lucros aos Sócios** e **Rendimentos de Aplicação Financeira** com **controle de acesso baseado em roles** (Gerência e Sócio).

## ✨ Funcionalidades Principais

### 🔐 Sistema de Autenticação e Controle de Acesso

### ⭐ Recursos da GERÊNCIA

### 👔 Recursos do SÓCIO

### 💰 Distribuição de Lucros aos Sócios

### 📈 Rendimentos de Aplicação Financeira

### 👥 Gerenciamento de Sócios

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

#### Excluir Registros

#### Exportar para Excel

#### Limpar Todos os Dados

### Navegação
  - `Ctrl + 1` = Aba de Distribuição de Lucros
  - `Ctrl + 2` = Aba de Rendimentos Financeiros
  - `Ctrl + N` = Adicionar novo registro

## 💾 Armazenamento de Dados

### Estrutura de Dados

### Backup e Recuperação

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

### Limitações de Segurança
⚠️ **Este é um sistema cliente-side (frontend only):**

💡 **Para ambientes corporativos/produção:**

## 📱 Responsividade

O sistema funciona perfeitamente em:

## 🎨 Recursos Visuais


## 🛠️ Tecnologias Utilizadas


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

### Não consigo adicionar registros

### Perdi todos os dados

### Campos não salvam automaticamente

## 📞 Suporte

**Sistema de Contabilidade Multi-Usuário com Controle de Acesso v3.0**

### Documentação Completa:

### Tecnologias:

### Desenvolvido para:


**Última atualização:** 2025 - Sistema com controle de acesso implementado


**Versão:** 2.0.0 - Multi-Usuário  
**Data:** Fevereiro 2026  
**Desenvolvido com ❤️ para facilitar sua contabilidade**
=======
# Contabilidade
>>>>>>> 70875c888f30116a50ff42189d74d818e9ddb66e
