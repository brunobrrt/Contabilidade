# 📋 Checklist de Teste do Sistema

Use esta lista para testar todas as funcionalidades do sistema:

## ✅ Testes de Autenticação

- [ ] Abrir o sistema no navegador
- [ ] Ver tela de login
- [ ] Clicar em "Cadastre-se aqui"
- [ ] Criar primeiro sócio (Ex: João)
- [ ] Tentar cadastrar com CPF duplicado (deve dar erro)
- [ ] Tentar cadastrar com senhas diferentes (deve dar erro)
- [ ] Fazer login com sucesso
- [ ] Verificar nome do usuário no canto superior direito
- [ ] Fazer logout
- [ ] Tentar login com CPF errado (deve dar erro)
- [ ] Tentar login com senha errada (deve dar erro)
- [ ] Fazer login novamente com sucesso

## ✅ Testes de Cadastro de Múltiplos Sócios

- [ ] Fazer logout
- [ ] Cadastrar segundo sócio (Ex: Maria)
- [ ] Fazer logout
- [ ] Cadastrar terceiro sócio (Ex: Pedro)
- [ ] Fazer login com primeiro sócio
- [ ] Clicar em "Gerenciar Sócios"
- [ ] Verificar se todos os 3 sócios aparecem na lista
- [ ] Verificar se o usuário logado está marcado

## ✅ Testes de Distribuição de Lucros

- [ ] Adicionar novo registro de lucro
- [ ] Verificar se o dropdown mostra todos os sócios
- [ ] Selecionar um sócio diferente do logado
- [ ] Preencher data, valor e descrição
- [ ] Verificar se o total é atualizado automaticamente
- [ ] Adicionar mais 2 registros
- [ ] Editar um valor existente
- [ ] Verificar se o total é recalculado
- [ ] Excluir um registro
- [ ] Confirmar exclusão

## ✅ Testes de Rendimentos Financeiros

- [ ] Ir para aba "Rendimentos Financeiros"
- [ ] Adicionar novo registro
- [ ] Preencher mês, banco, valor e IR
- [ ] Verificar se ambos os totais são calculados
- [ ] Adicionar mais 2 registros
- [ ] Editar valores
- [ ] Verificar recálculo dos totais
- [ ] Excluir um registro

## ✅ Testes de Exportação

- [ ] Na aba de Lucros, clicar em "Exportar Excel"
- [ ] Verificar se o arquivo CSV foi baixado
- [ ] Abrir o arquivo no Excel
- [ ] Verificar se os dados dos sócios aparecem corretamente
- [ ] Verificar formatação de CPF
- [ ] Repetir para aba de Rendimentos

## ✅ Testes de Separação de Dados

- [ ] Fazer logout
- [ ] Fazer login com o segundo sócio
- [ ] Verificar que não aparecem os registros do primeiro sócio
- [ ] Adicionar registros próprios
- [ ] Fazer logout
- [ ] Fazer login com o terceiro sócio
- [ ] Verificar isolamento de dados
- [ ] Fazer login novamente com o primeiro sócio
- [ ] Verificar que os dados originais continuam lá

## ✅ Testes de Atalhos de Teclado

- [ ] Pressionar Ctrl + 1 (deve ir para Lucros)
- [ ] Pressionar Ctrl + 2 (deve ir para Rendimentos)
- [ ] Pressionar Ctrl + N em cada aba (deve adicionar registro)

## ✅ Testes de Persistência

- [ ] Adicionar vários registros
- [ ] Fechar o navegador completamente
- [ ] Abrir novamente
- [ ] Fazer login
- [ ] Verificar se todos os dados foram mantidos

## ✅ Testes de Limpeza

- [ ] Clicar em "Limpar Tudo" na aba de Lucros
- [ ] Confirmar limpeza
- [ ] Verificar que todos os registros foram removidos
- [ ] Verificar que os dados de Rendimentos não foram afetados

## ✅ Testes Responsivos

- [ ] Redimensionar janela do navegador
- [ ] Testar em largura mínima (mobile)
- [ ] Verificar se as tabelas são scrolláveis
- [ ] Verificar se os botões ficam acessíveis
- [ ] Testar no celular (se possível)

## ✅ Testes de Validação

- [ ] Tentar adicionar registro sem preencher campos obrigatórios
- [ ] Tentar cadastrar com CPF < 11 dígitos
- [ ] Tentar cadastrar com senha < 4 caracteres
- [ ] Tentar exportar sem dados (deve dar aviso)

## 🎯 Cenário Completo de Teste

**Simule uma empresa com 3 sócios:**

1. **João (Sócio 1):**
   - Cadastra-se no sistema
   - Cria 3 distribuições de lucros (para si, Maria e Pedro)
   - Cria 2 rendimentos financeiros
   - Exporta os dados

2. **Maria (Sócio 2):**
   - Cadastra-se no sistema
   - Verifica que não vê os dados de João
   - Cria 2 distribuições de lucros (para João e Pedro)
   - Cria 1 rendimento financeiro
   - Exporta os dados

3. **Pedro (Sócio 3):**
   - Cadastra-se no sistema
   - Verifica que não vê dados de João e Maria
   - Cria 1 distribuição de lucros (para Maria)
   - Cria 3 rendimentos financeiros
   - Exporta os dados

4. **Volta para João:**
   - Faz login novamente
   - Verifica que seus dados originais estão intactos
   - Verifica na lista de sócios que Maria e Pedro foram cadastrados

---

✅ **Todos os testes passaram?** Sistema pronto para uso!  
❌ **Algum teste falhou?** Anote o erro e reporte.
