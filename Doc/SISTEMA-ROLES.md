# 🔐 Sistema de Contabilidade com Controle de Acesso

## ✅ Implementação Completa

O sistema agora possui **controle de acesso baseado em roles** (funções) com dois níveis de permissão:

---

## 👥 Tipos de Usuário

### ⭐ GERÊNCIA
- **Acesso Total** ao sistema
- **Cria novos usuários** e define suas roles
- **Visualiza dados de todos os sócios** (com filtros)
- **Gerencia usuários** (criar e excluir)
- **Exporta dados consolidados** de todos os sócios

### 👔 SÓCIO
- **Acesso Limitado** aos próprios dados
- **Visualiza e edita** apenas seus registros
- **Não pode criar** outros usuários
- **Não acessa** dados de outros sócios

---

## 🚀 Primeiro Acesso

### Credenciais do Administrador Padrão:
```
CPF: 00000000000 (11 zeros)
Senha: admin123
```

> **⚠️ IMPORTANTE:** Este usuário é criado automaticamente na primeira execução do sistema.

---

## 📋 Como Usar

### Para GERÊNCIA:

1. **Login com as credenciais de admin**
2. **Clique em "⚙️ Admin"** no canto superior direito
3. **Crie novos usuários:**
   - Preencha: Nome completo, CPF (11 dígitos), Senha
   - Escolha a Role: "Sócio" ou "Gerência"
   - Clique em "Criar Usuário"

4. **Visualize dados filtrados:**
   - Use o dropdown "Filtrar Sócio:" no topo
   - Selecione "Todos os Sócios" para visão consolidada
   - Selecione um sócio específico para editar seus dados

5. **Exportar tudo:**
   - Clique em "📥 Exportar Todos os Dados"
   - Gera arquivos CSV com dados de todos os sócios

### Para SÓCIO:

1. **Login com suas credenciais** (fornecidas pela gerência)
2. **Visualize e edite** seus próprios registros
3. **Adicione novos registros:**
   - Aba "Distribuição de Lucros"
   - Aba "Rendimentos Financeiros"
4. **Exporte seus dados** clicando em "📥 Exportar para Excel"

---

## 🔒 Segurança Implementada

### ✅ O que foi feito:

1. **Registro público removido** - Ninguém pode criar conta sozinho
2. **Criação controlada** - Apenas Gerência cria usuários
3. **Isolamento de dados** - Sócios veem apenas próprios dados
4. **Filtros para gerência** - Visualização seletiva ou consolidada
5. **Roles atribuídas** - Cada usuário tem função definida

### ⚠️ Limitações:

> **Atenção:** Este é um sistema cliente-side (roda no navegador).
> - Os dados ficam no **LocalStorage** do navegador
> - A segurança é **UX-based** (não é criptografia real)
> - Para segurança real, seria necessário um **servidor backend**

---

## 🎨 Interface

### Badges de Role:
- **⭐ GERÊNCIA** - Badge amarelo/dourado
- **👔 SÓCIO** - Badge transparente/branco

### Botões Especiais (apenas Gerência):
- **⚙️ Admin** - Abre painel de administração
- **📥 Exportar Todos os Dados** - Exporta tudo em CSV

### Filtro (apenas Gerência):
- **Dropdown "Filtrar Sócio:"** - Seleciona qual sócio visualizar
- **Opção "Todos os Sócios"** - Visualização consolidada (somente leitura)

---

## 📁 Estrutura de Dados

### LocalStorage:
```javascript
// Todos os usuários cadastrados
todosOsSocios = [
  {
    id: 1234567890,
    nome: "João Silva",
    cpf: "12345678901",
    senha: "senha123",
    role: "socio" // ou "gerencia"
  },
  ...
]

// Dados de cada usuário (separados por CPF)
dados_12345678901 = {
  lucros: [...],
  rendimentos: [...]
}

// Sessão atual
usuarioLogado = {
  cpf: "12345678901",
  role: "socio"
}
```

---

## 🛠️ Funcionalidades

### Comuns a todos:
- ✅ Login/Logout
- ✅ Visualizar lista de sócios
- ✅ Editar próprios dados
- ✅ Exportar próprios dados para CSV/Excel
- ✅ Alternar entre abas (Ctrl+1, Ctrl+2)
- ✅ Adicionar registros (Ctrl+N)

### Exclusivas de Gerência:
- ⭐ Criar novos usuários
- ⭐ Excluir usuários
- ⭐ Filtrar visualização por sócio
- ⭐ Ver dados consolidados de todos
- ⭐ Exportar dados de todos os sócios
- ⭐ Acessar painel de administração

### Exclusivas de Sócio:
- 👔 Apenas visualização e edição dos próprios dados

---

## 📝 Fluxo de Trabalho

### Cenário 1: Configuração Inicial
1. Sistema carrega → Cria admin automaticamente
2. Admin faz login (00000000000 / admin123)
3. Admin abre painel Admin
4. Admin cria usuários sócios com CPF e senha real
5. Admin informa credenciais aos sócios

### Cenário 2: Sócio Trabalhando
1. Sócio faz login com suas credenciais
2. Vê apenas seus próprios dados
3. Adiciona registros de lucros/rendimentos
4. Seleciona qual sócio recebeu o valor (dropdown)
5. Exporta seus dados quando necessário

### Cenário 3: Gerência Auditando
1. Gerência faz login
2. Usa filtro para ver dados de sócio específico
3. Ou seleciona "Todos os Sócios" para visão geral
4. Exporta tudo para análise consolidada
5. Cria relatórios gerenciais

---

## 🔧 Solução de Problemas

### "Não consigo criar usuários"
✅ Verifique se está logado como Gerência
✅ Badge deve mostrar "⭐ GERÊNCIA"

### "Não vejo o botão Admin"
✅ Apenas Gerência vê este botão
✅ Faça login com usuário de gerência

### "CPF inválido ao criar usuário"
✅ CPF deve ter exatamente 11 dígitos
✅ Não use pontos ou traços

### "Não vejo dados de outros sócios"
✅ Se você é Sócio, isso é correto (cada um vê só seus dados)
✅ Se você é Gerência, use o filtro no topo

### "Perdi a senha do admin"
✅ Abra o Console do navegador (F12)
✅ Execute: `localStorage.clear()`
✅ Recarregue a página (sistema recria admin padrão)

---

## 📊 Exportação de Dados

### Formato CSV:
- **Encoding:** UTF-8 com BOM (abre corretamente no Excel)
- **Separador:** Ponto e vírgula (;)
- **Campos entre aspas** para preservar formatação

### Arquivos gerados:
1. `distribuicao_lucros.csv` - Todos os registros de lucros
2. `rendimentos_financeiros.csv` - Todos os registros de rendimentos

### Colunas extras para Gerência:
Quando Gerência exporta "Todos os Sócios", adiciona coluna:
- **"Registrado por"** - Nome do sócio que criou o registro

---

## 🎯 Próximos Passos (Opcional)

### Melhorias Possíveis:
1. **Backend real** com Node.js/Express
2. **Banco de dados** PostgreSQL ou MongoDB
3. **Autenticação JWT** com tokens seguros
4. **Criptografia de senhas** com bcrypt
5. **HTTPS** para comunicação segura
6. **Logs de auditoria** de todas as ações
7. **Recuperação de senha** via e-mail
8. **Two-Factor Authentication (2FA)**
9. **Permissões granulares** (criar, ler, editar, excluir)
10. **Dashboard com gráficos** e análises

---

## 📞 Suporte

**Sistema desenvolvido em:**
- HTML5
- CSS3
- JavaScript (Vanilla)
- LocalStorage API

**Arquivos do sistema:**
- `index.html` - Estrutura principal
- `styles.css` - Estilos completos
- `app.js` - Lógica e controle de acesso

**Compatibilidade:**
- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ⚠️ Internet Explorer (não suportado)

---

## 🔐 Credenciais Padrão

```
=================================
   ADMIN PADRÃO DO SISTEMA
=================================
CPF:   00000000000
Senha: admin123
Role:  Gerência
=================================
```

**⚠️ Recomendação de Segurança:**
Após criar seu usuário real de gerência, você pode excluir o admin padrão pelo painel Admin (exceto se for o único usuário).

---

**Sistema pronto para uso! 🎉**
