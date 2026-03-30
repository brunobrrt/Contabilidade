# 🔄 Diferenças entre Sócio e Gerência

## 📊 Visualização de Dados

### 👔 SÓCIO
**Campo "Sócio Beneficiário":**
- ❌ **NÃO vê dropdown de seleção**
- ✅ Vê apenas seu próprio nome (texto simples)
- 🔒 Não pode alterar o beneficiário
- 📝 Todos os registros são automaticamente atribuídos a ele mesmo

**Exemplo na tela:**
```
┌─────────────────────────────────────────┐
│ Data        │ Sócio Beneficiário        │
├─────────────┼───────────────────────────┤
│ 13/02/2026  │ João Silva               │  ← Nome fixo (não editável)
└─────────────┴───────────────────────────┘
```

### ⭐ GERÊNCIA
**Campo "Sócio Beneficiário":**
- ✅ **VÊ dropdown de seleção**
- ✅ Pode selecionar qualquer sócio da lista
- 🔓 Pode alterar o beneficiário a qualquer momento
- 📝 Dropdown vem **preenchido automaticamente** com o sócio filtrado

**Exemplo na tela:**
```
┌─────────────────────────────────────────┐
│ Data        │ Sócio Beneficiário        │
├─────────────┼───────────────────────────┤
│ 13/02/2026  │ ▼ João Silva            │  ← Dropdown selecionável
│             │   ├ Administrador        │
│             │   ├ João Silva           │
│             │   ├ Maria Santos         │
│             │   └ Pedro Costa          │
└─────────────┴───────────────────────────┘
```

---

## 🎯 Fluxo de Trabalho

### 👔 SÓCIO - Adicionando Registro

1. **Clica em "➕ Adicionar Registro"**
   ```
   Sistema automaticamente:
   - Cria novo registro
   - Define socioId = ID do próprio sócio
   - Proprietário = CPF do próprio sócio
   ```

2. **Preenche os dados**
   ```
   Data: 13/02/2026
   Sócio Beneficiário: [João Silva] ← Fixo, não editável
   Descrição: Distribuição mensal
   Valor: R$ 5.000,00
   Observações: -
   ```

3. **Resultado**
   - Registro salvo apenas nos dados dele
   - Outros sócios não veem este registro
   - Campo beneficiário sempre mostra seu próprio nome

---

### ⭐ GERÊNCIA - Adicionando Registro

1. **Seleciona sócio no filtro**
   ```
   Filtrar Sócio: [▼ João Silva]
   ```

2. **Clica em "➕ Adicionar Registro"**
   ```
   Sistema automaticamente:
   - Cria novo registro
   - Define socioId = ID do sócio filtrado (João)
   - Proprietário = CPF do sócio filtrado
   - Dropdown já vem selecionado com João Silva
   ```

3. **Pode alterar beneficiário se necessário**
   ```
   Data: 13/02/2026
   Sócio Beneficiário: [▼ João Silva] ← Pode trocar
                         └→ Maria Santos
   Descrição: Distribuição mensal
   Valor: R$ 5.000,00
   Observações: -
   ```

4. **Resultado**
   - Registro salvo nos dados do sócio proprietário
   - Gerência pode visualizar ao filtrar "Todos os Sócios"
   - No modo "Todos", aparece coluna "Registrado por"

---

## 📋 Tabela Comparativa

| Funcionalidade | 👔 Sócio | ⭐ Gerência |
|----------------|----------|-------------|
| **Campo Beneficiário** | Texto fixo (próprio nome) | Dropdown selecionável |
| **Editar Beneficiário** | ❌ Não | ✅ Sim |
| **Preenchimento Automático** | ✅ Sempre ele mesmo | ✅ Sócio filtrado |
| **Ver Dropdown** | ❌ Não | ✅ Sim |
| **Alterar Beneficiário** | ❌ Não | ✅ Sim (quando filtrado) |
| **Ver Dados de Outros** | ❌ Não | ✅ Sim (com filtro) |
| **Filtro de Sócios** | ❌ Não aparece | ✅ Aparece no topo |
| **Botão Admin** | ❌ Não aparece | ✅ Aparece |
| **Exportar Todos** | ❌ Apenas próprios | ✅ Todos os sócios |

---

## 💡 Exemplos Práticos

### Cenário 1: Sócio João registrando distribuição
```
João faz login → Vê apenas seus dados
Clica "Adicionar Registro"
Sistema cria registro com:
  - socioId = ID do João
  - proprietarioCpf = CPF do João
  
Tabela mostra:
  Data: 13/02/2026
  Sócio Beneficiário: João Silva  ← Texto simples
  Valor: R$ 5.000,00
```

### Cenário 2: Gerência registrando para João
```
Admin faz login → Vê botão Admin e filtros
Seleciona filtro: "João Silva"
Clica "Adicionar Registro"
Sistema cria registro com:
  - socioId = ID do João (preenchido automaticamente)
  - proprietarioCpf = CPF do João
  
Tabela mostra:
  Data: 13/02/2026
  Sócio Beneficiário: [▼ João Silva]  ← Dropdown
  Valor: R$ 5.000,00
  
Admin pode trocar para: Maria Santos, Pedro Costa, etc.
```

### Cenário 3: Gerência vendo todos
```
Admin faz login
Seleciona filtro: "Todos os Sócios"
Ve dados consolidados (somente leitura)

Tabela mostra:
  Data: 13/02/2026
  Sócio Beneficiário: João Silva  ← Texto (não editável)
  Valor: R$ 5.000,00
  Registrado por: João Silva  ← Info extra
  Ações: - (não pode editar)
```

---

## 🔐 Regras de Segurança

### Para Sócios:
- ✅ Vê apenas registros que ELE criou
- ❌ Não vê registros de outros sócios
- ❌ Não pode alterar beneficiário (sempre ele mesmo)
- ❌ Não tem acesso ao painel Admin
- ❌ Não vê filtro de sócios

### Para Gerência:
- ✅ Vê todos os registros (com filtro)
- ✅ Pode editar quando filtrar sócio específico
- ✅ Pode alterar beneficiário via dropdown
- ✅ Acessa painel Admin para criar/excluir usuários
- ✅ Usa filtros para visualização segmentada

---

## 🎨 Interface Visual

### Sócio vê:
```
╔══════════════════════════════════════════╗
║ 👤 João Silva   👔 SÓCIO       [Sair]   ║
╠══════════════════════════════════════════╣
║  [👥 Gerenciar Sócios]                   ║
╠══════════════════════════════════════════╣
║ 💰 Distribuição de Lucros                ║
║ [➕ Adicionar] [📥 Exportar] [🗑️ Limpar] ║
║                                           ║
║ Data      │ Beneficiário │ Valor │ Ações ║
║──────────────────────────────────────────║
║ 13/02     │ João Silva   │ 5.000 │ 🗑️    ║
║                                           ║
║ TOTAL: R$ 5.000,00                       ║
╚══════════════════════════════════════════╝
```

### Gerência vê:
```
╔══════════════════════════════════════════╗
║ 👤 Admin   ⭐ GERÊNCIA  [⚙️ Admin] [Sair]║
╠══════════════════════════════════════════╣
║  [👥 Gerenciar Sócios]                   ║
║  Filtrar Sócio: [▼ João Silva         ] ║
║  [📥 Exportar Todos os Dados]            ║
╠══════════════════════════════════════════╣
║ 💰 Distribuição de Lucros                ║
║ [➕ Adicionar] [📥 Exportar] [🗑️ Limpar] ║
║                                           ║
║ Data   │ Beneficiário▼     │ Valor│Ações ║
║──────────────────────────────────────────║
║ 13/02  │ ▼ João Silva      │ 5.000│ 🗑️   ║
║        │   Pode selecionar │      │      ║
║                                           ║
║ TOTAL: R$ 5.000,00                       ║
╚══════════════════════════════════════════╝
```

---

## ✅ Checklist de Verificação

### Para Sócio:
- [ ] Não vejo dropdown de seleção de sócio
- [ ] Campo beneficiário mostra apenas meu nome
- [ ] Não consigo alterar o beneficiário
- [ ] Não vejo botão "⚙️ Admin"
- [ ] Não vejo filtro de sócios no topo
- [ ] Badge mostra "👔 SÓCIO"

### Para Gerência:
- [ ] Vejo dropdown de seleção de sócio
- [ ] Posso selecionar qualquer sócio na lista
- [ ] Dropdown vem preenchido com sócio filtrado
- [ ] Vejo botão "⚙️ Admin"
- [ ] Vejo filtro de sócios no topo
- [ ] Badge mostra "⭐ GERÊNCIA"
- [ ] Posso exportar dados de todos

---

**Sistema v3.0 - Atualizado com controle completo de beneficiários**
