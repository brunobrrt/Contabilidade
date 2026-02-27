// ===== VARIÁVEIS GLOBAIS =====
let usuarioLogado = null;
let todosOsSocios = [];
let sociosEmpresa = []; // Sócios da empresa para a conta ativa
let lucrosData = [];
let rendimentosData = [];
let filtroAtual = 'todos'; // Para gerência

// ===== INICIALIZAÇÃO =====
window.addEventListener('DOMContentLoaded', () => {
    inicializarSistema();
    verificarLogin();
});

// ===== INICIALIZAÇÃO DO SISTEMA =====
function inicializarSistema() {
    carregarTodosOsSocios();
    
    // Criar usuário admin padrão se não existir
    if (todosOsSocios.length === 0) {
        const admin = {
            id: Date.now(),
            nome: 'Administrador',
            cpf: '00000000000',
            senha: 'admin123',
            role: 'gerencia'
        };
        todosOsSocios.push(admin);
        salvarTodosOsSocios();
        console.log('Usuário administrador criado: CPF 00000000000, Senha: admin123');
    }
}

// ===== FUNÇÕES DE AUTENTICAÇÃO =====
function verificarLogin() {
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    
    if (usuarioSalvo) {
        usuarioLogado = JSON.parse(usuarioSalvo);
        
        // Garantir compatibilidade: se usuário salvo não tem ID, buscar do todosOsSocios
        if (!usuarioLogado.id || !usuarioLogado.nome) {
            carregarTodosOsSocios();
            const socioCompleto = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf);
            if (socioCompleto) {
                usuarioLogado.id = socioCompleto.id;
                usuarioLogado.nome = socioCompleto.nome;
                usuarioLogado.role = socioCompleto.role;
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            }
        }
        
        mostrarSistema();
    } else {
        mostrarLogin();
    }
}

function mostrarLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-system').style.display = 'none';
}

function mostrarSistema() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-system').style.display = 'block';
    
    // Atualizar nome do usuário e role
    const socio = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf);
    if (socio) {
        document.getElementById('usuario-logado').textContent = `👤 ${socio.nome}`;
        
        const roleBadge = document.getElementById('usuario-role');
        if (socio.role === 'gerencia') {
            roleBadge.textContent = '⭐ GERÊNCIA';
            roleBadge.className = 'role-badge gerencia';
            document.getElementById('btn-admin').style.display = 'inline-block';
            document.getElementById('btn-ver-usuarios').style.display = 'inline-block';
            document.getElementById('filtro-gerencia').style.display = 'block';
            carregarFiltroSocios();
        } else {
            roleBadge.textContent = '👔 SÓCIO';
            roleBadge.className = 'role-badge socio';
            document.getElementById('btn-admin').style.display = 'none';
            document.getElementById('btn-ver-usuarios').style.display = 'none';
            document.getElementById('filtro-gerencia').style.display = 'none';
        }
    }
    
    // Carregar sócios da empresa para a conta logada
    carregarSociosEmpresa(usuarioLogado.cpf);
    
    carregarDadosParaExibicao();
    initializeTabs();
    renderLucrosTable();
    renderRendimentosTable();
}

function fazerLogin() {
    const cpf = document.getElementById('login-cpf').value.replace(/\D/g, '');
    const senha = document.getElementById('login-senha').value;
    
    if (!cpf || !senha) {
        alert('Por favor, preencha todos os campos!');
        return;
    }
    
    const socio = todosOsSocios.find(s => s.cpf === cpf);
    
    if (!socio) {
        alert('CPF não encontrado!');
        return;
    }
    
    if (socio.senha !== senha) {
        alert('Senha incorreta!');
        return;
    }
    
    usuarioLogado = { cpf: socio.cpf, role: socio.role, id: socio.id, nome: socio.nome };
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
    
    // Limpar campos
    document.getElementById('login-cpf').value = '';
    document.getElementById('login-senha').value = '';
    
    mostrarSistema();
}

function fazerLogout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('usuarioLogado');
        usuarioLogado = null;
        lucrosData = [];
        rendimentosData = [];
        filtroAtual = 'todos';
        mostrarLogin();
    }
}

// ===== FUNÇÕES DE SÓCIOS =====
function carregarTodosOsSocios() {
    const socios = localStorage.getItem('todosOsSocios');
    if (socios) {
        todosOsSocios = JSON.parse(socios);
    }
}

function salvarTodosOsSocios() {
    localStorage.setItem('todosOsSocios', JSON.stringify(todosOsSocios));
}

// ===== FUNÇÕES DE SÓCIOS DA EMPRESA =====
function getCPFParaSociosEmpresa() {
    const userLogado = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf);
    if (userLogado && userLogado.role === 'gerencia' && filtroAtual !== 'todos') {
        return filtroAtual;
    }
    return usuarioLogado.cpf;
}

function carregarSociosEmpresa(cpf) {
    const saved = localStorage.getItem(`socios_empresa_${cpf}`);
    sociosEmpresa = saved ? JSON.parse(saved) : [];
}

function salvarSociosEmpresa() {
    const cpf = getCPFParaSociosEmpresa();
    localStorage.setItem(`socios_empresa_${cpf}`, JSON.stringify(sociosEmpresa));
}

function abrirModalSociosEmpresa() {
    const cpf = getCPFParaSociosEmpresa();
    carregarSociosEmpresa(cpf);

    // Atualizar título do modal
    const conta = todosOsSocios.find(s => s.cpf === cpf);
    const userLogado = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf);
    let titulo = '🏢 Sócios da Empresa';
    if (conta) {
        titulo = `🏢 Sócios da Empresa — ${conta.nome}`;
    }
    document.getElementById('modal-socios-empresa-titulo').textContent = titulo;

    // Exibir aviso se gerência está em modo "todos"
    const subtitulo = document.getElementById('modal-socios-empresa-subtitulo');
    if (userLogado && userLogado.role === 'gerencia' && filtroAtual === 'todos') {
        subtitulo.innerHTML = '<span style="color:#d4a017">&#9888; Gerenciando sua própria conta. Filtre por um sócio para gerenciar a conta dele.</span>';
    } else {
        subtitulo.textContent = 'Gerencie os sócios vinculados a esta conta';
    }

    document.getElementById('modal-socios-empresa').style.display = 'flex';
    renderSociosEmpresaLista();
}

function fecharModalSociosEmpresa() {
    document.getElementById('modal-socios-empresa').style.display = 'none';
    document.getElementById('socio-emp-nome').value = '';
    document.getElementById('socio-emp-cpf').value = '';
    document.getElementById('socio-emp-percentual').value = '';
}

function adicionarSocioEmpresa() {
    const nome = document.getElementById('socio-emp-nome').value.trim();
    const cpfRaw = document.getElementById('socio-emp-cpf').value.trim();
    const percentual = document.getElementById('socio-emp-percentual').value;

    if (!nome) {
        alert('O nome do sócio é obrigatório!');
        return;
    }

    // Verificar duplicata
    if (sociosEmpresa.some(s => s.nome.toLowerCase() === nome.toLowerCase())) {
        alert('Já existe um sócio com este nome!');
        return;
    }

    const novoSocio = {
        id: Date.now(),
        nome,
        cpf: cpfRaw || null,
        percentual: percentual ? parseFloat(percentual) : null
    };

    sociosEmpresa.push(novoSocio);
    salvarSociosEmpresa();

    document.getElementById('socio-emp-nome').value = '';
    document.getElementById('socio-emp-cpf').value = '';
    document.getElementById('socio-emp-percentual').value = '';

    renderSociosEmpresaLista();
    renderLucrosTable(); // Atualiza dropdowns
    showSuccessMessage(`Sócio "${nome}" adicionado com sucesso!`);
}

function excluirSocioEmpresa(id) {
    const socio = sociosEmpresa.find(s => s.id === id);
    if (!socio) return;
    if (!confirm(`Deseja realmente excluir "${socio.nome}"?\nRegistros existentes na planilha não serão afetados.`)) return;

    sociosEmpresa = sociosEmpresa.filter(s => s.id !== id);
    salvarSociosEmpresa();
    renderSociosEmpresaLista();
    renderLucrosTable();
    showSuccessMessage('Sócio excluído com sucesso!');
}

function renderSociosEmpresaLista() {
    const container = document.getElementById('socios-empresa-lista');

    if (sociosEmpresa.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👤</div>
                <p>Nenhum sócio cadastrado ainda.</p>
                <p class="empty-hint">Use o formulário acima para adicionar os sócios da empresa.<br>Eles aparecerão como opções selecionáveis na coluna "Sócio Beneficiário" da planilha.</p>
            </div>`;
        return;
    }

    const totalPercentual = sociosEmpresa.reduce((s, x) => s + (x.percentual || 0), 0);

    let html = `<div class="socios-cards">`;
    sociosEmpresa.forEach(socio => {
        const percentualBadge = socio.percentual
            ? `<span class="percentual-badge">${socio.percentual}%</span>`
            : '';
        const cpfInfo = socio.cpf ? `<span class="socio-info-item">🧗 ${socio.cpf}</span>` : '';
        html += `
            <div class="socio-card">
                <div class="socio-card-left">
                    <div class="socio-avatar">${socio.nome.charAt(0).toUpperCase()}</div>
                    <div class="socio-details">
                        <div class="socio-nome">${socio.nome} ${percentualBadge}</div>
                        <div class="socio-meta">${cpfInfo}</div>
                    </div>
                </div>
                <button class="btn btn-delete btn-small" onclick="excluirSocioEmpresa(${socio.id})" title="Excluir sócio">🗑️ Excluir</button>
            </div>`;
    });

    if (totalPercentual > 0) {
        const cor = totalPercentual === 100 ? '#28a745' : totalPercentual > 100 ? '#dc3545' : '#ffc107';
        html += `<div class="percentual-total" style="border-color:${cor}; color:${cor};">Total de participação: <strong>${totalPercentual.toFixed(2)}%</strong></div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
}

// Retorna o nome do beneficiário de um item (compatibilidade com registros antigos)
function getNomeSocioBeneficiario(item) {
    if (item.socioBeneficiario) return item.socioBeneficiario;
    // Compatibilidade com registros antigos que usavam socioId
    if (item.socioId) {
        const socio = todosOsSocios.find(s => s.id.toString() === item.socioId);
        return socio ? socio.nome : '';
    }
    return '';
}

function gerenciarSocios() {
    const modal = document.getElementById('modal-socios');
    modal.style.display = 'flex';
    renderSociosTable();
}

function fecharModalSocios() {
    document.getElementById('modal-socios').style.display = 'none';
}

function renderSociosTable() {
    const tbody = document.getElementById('socios-tbody');
    tbody.innerHTML = '';
    
    todosOsSocios.forEach(socio => {
        const row = document.createElement('tr');
        const roleText = socio.role === 'gerencia' ? '⭐ Gerência' : '👔 Sócio';
        const isYou = socio.cpf === usuarioLogado.cpf ? '<span style="color: #28a745;"> (Você)</span>' : '';
        
        row.innerHTML = `
            <td>${socio.nome}${isYou}</td>
            <td>${formatarCPFExibicao(socio.cpf)}</td>
            <td>${roleText}</td>
        `;
        tbody.appendChild(row);
    });
}

// ===== FUNÇÕES DE ADMINISTRAÇÃO =====
function abrirPainelAdmin() {
    const userLogado = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf);
    if (userLogado.role !== 'gerencia') {
        alert('Acesso negado!');
        return;
    }
    
    document.getElementById('modal-admin').style.display = 'flex';
    renderAdminUsersTable();
}

function fecharPainelAdmin() {
    document.getElementById('modal-admin').style.display = 'none';
    // Limpar campos
    document.getElementById('admin-nome').value = '';
    document.getElementById('admin-cpf').value = '';
    document.getElementById('admin-senha').value = '';
    document.getElementById('admin-role').value = 'socio';
}

function criarNovoUsuario() {
    const nome = document.getElementById('admin-nome').value.trim();
    const cpf = document.getElementById('admin-cpf').value.replace(/\D/g, '');
    const senha = document.getElementById('admin-senha').value;
    const role = document.getElementById('admin-role').value;
    
    if (!nome || !cpf || !senha) {
        alert('Por favor, preencha todos os campos!');
        return;
    }
    
    if (cpf.length !== 11) {
        alert('CPF deve ter 11 dígitos!');
        return;
    }
    
    if (senha.length < 4) {
        alert('A senha deve ter pelo menos 4 caracteres!');
        return;
    }
    
    // Verificar se CPF já existe
    if (todosOsSocios.some(s => s.cpf === cpf)) {
        alert('Este CPF já está cadastrado!');
        return;
    }
    
    // Adicionar novo usuário
    const novoUsuario = {
        id: Date.now(),
        nome: nome,
        cpf: cpf,
        senha: senha,
        role: role
    };
    
    todosOsSocios.push(novoUsuario);
    salvarTodosOsSocios();
    
    // Limpar campos
    document.getElementById('admin-nome').value = '';
    document.getElementById('admin-cpf').value = '';
    document.getElementById('admin-senha').value = '';
    document.getElementById('admin-role').value = 'socio';
    
    renderAdminUsersTable();
    carregarFiltroSocios();
    showSuccessMessage('Usuário criado com sucesso!');
}

function renderAdminUsersTable() {
    const tbody = document.getElementById('admin-users-tbody');
    tbody.innerHTML = '';
    
    todosOsSocios.forEach(socio => {
        const row = document.createElement('tr');
        const roleText = socio.role === 'gerencia' ? '⭐ Gerência' : '👔 Sócio';
        const isYou = socio.cpf === usuarioLogado.cpf;
        
        row.innerHTML = `
            <td>${socio.nome}${isYou ? ' <span style="color: #28a745;">(Você)</span>' : ''}</td>
            <td>${formatarCPFExibicao(socio.cpf)}</td>
            <td>${roleText}</td>
            <td>
                ${!isYou ? `<button class="btn btn-delete btn-small" onclick="excluirUsuario('${socio.cpf}')">🗑️ Excluir</button>` : '<span style="color: #6c757d;">-</span>'}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function excluirUsuario(cpf) {
    if (!confirm('Deseja realmente excluir este usuário? Todos os dados dele serão perdidos!')) {
        return;
    }
    
    // Remover usuário
    todosOsSocios = todosOsSocios.filter(s => s.cpf !== cpf);
    salvarTodosOsSocios();
    
    // Remover dados do usuário
    localStorage.removeItem(`dados_${cpf}`);
    
    renderAdminUsersTable();
    carregarFiltroSocios();
    showSuccessMessage('Usuário excluído com sucesso!');
}

// ===== FUNÇÕES DE FILTRO (GERÊNCIA) =====
function carregarFiltroSocios() {
    const select = document.getElementById('filtro-socio');
    select.innerHTML = '<option value="todos">Todos os Sócios</option>';
    
    todosOsSocios.forEach(socio => {
        if (socio.role === 'socio') { // Apenas sócios, não gerência
            const option = document.createElement('option');
            option.value = socio.cpf;
            option.textContent = `${socio.nome} (${formatarCPFExibicao(socio.cpf)})`;
            select.appendChild(option);
        }
    });
}

function aplicarFiltro() {
    filtroAtual = document.getElementById('filtro-socio').value;
    // Recarregar sócios da empresa para o contexto correto
    const cpf = getCPFParaSociosEmpresa();
    carregarSociosEmpresa(cpf);
    carregarDadosParaExibicao();
    renderLucrosTable();
    renderRendimentosTable();
}

// ===== CARREGAMENTO DE DADOS BASEADO EM ROLE =====
function carregarDadosParaExibicao() {
    const userLogado = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf);
    
    if (userLogado.role === 'gerencia') {
        // Gerência vê tudo ou filtrado
        if (filtroAtual === 'todos') {
            carregarTodosOsDados();
        } else {
            carregarDadosDeUsuario(filtroAtual);
        }
    } else {
        // Sócio vê apenas próprios dados
        carregarDadosDeUsuario(usuarioLogado.cpf);
    }
}

function carregarTodosOsDados() {
    lucrosData = [];
    rendimentosData = [];
    
    // Carregar dados de todos os sócios
    todosOsSocios.forEach(socio => {
        if (socio.role === 'socio') {
            const chave = `dados_${socio.cpf}`;
            const dados = localStorage.getItem(chave);
            
            if (dados) {
                const dadosParseados = JSON.parse(dados);
                
                // Adicionar dados com identificação do proprietário
                if (dadosParseados.lucros) {
                    dadosParseados.lucros.forEach(item => {
                        lucrosData.push({ ...item, proprietarioCpf: socio.cpf });
                    });
                }
                
                if (dadosParseados.rendimentos) {
                    dadosParseados.rendimentos.forEach(item => {
                        rendimentosData.push({ ...item, proprietarioCpf: socio.cpf });
                    });
                }
            }
        }
    });
}

function carregarDadosDeUsuario(cpf) {
    const chave = `dados_${cpf}`;
    const dados = localStorage.getItem(chave);
    
    if (dados) {
        const dadosParseados = JSON.parse(dados);
        lucrosData = dadosParseados.lucros || [];
        rendimentosData = dadosParseados.rendimentos || [];
        
        // Adicionar proprietário para gerência
        lucrosData = lucrosData.map(item => ({ ...item, proprietarioCpf: cpf }));
        rendimentosData = rendimentosData.map(item => ({ ...item, proprietarioCpf: cpf }));
    } else {
        lucrosData = [];
        rendimentosData = [];
    }
}

function salvarDadosDoUsuario(cpfUsuario = null) {
    const userLogado = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf);
    
    // Se for sócio, sempre salva nos próprios dados
    if (userLogado.role === 'socio') {
        const chave = `dados_${usuarioLogado.cpf}`;
        const dados = {
            lucros: lucrosData.map(({ proprietarioCpf, ...rest }) => rest),
            rendimentos: rendimentosData.map(({ proprietarioCpf, ...rest }) => rest)
        };
        localStorage.setItem(chave, JSON.stringify(dados));
    } else {
        // Se for gerência, salvar nos dados do usuário correto
        if (filtroAtual === 'todos') {
            // Quando está em "todos", precisa separar por proprietário
            salvarDadosSeparados();
        } else {
            // Quando filtrado, salva no usuário filtrado
            const chave = `dados_${filtroAtual}`;
            const dados = {
                lucros: lucrosData.filter(l => l.proprietarioCpf === filtroAtual).map(({ proprietarioCpf, ...rest }) => rest),
                rendimentos: rendimentosData.filter(r => r.proprietarioCpf === filtroAtual).map(({ proprietarioCpf, ...rest }) => rest)
            };
            localStorage.setItem(chave, JSON.stringify(dados));
        }
    }
}

function salvarDadosSeparados() {
    // Agrupar dados por proprietário
    const dadosPorUsuario = {};
    
    lucrosData.forEach(item => {
        if (!dadosPorUsuario[item.proprietarioCpf]) {
            dadosPorUsuario[item.proprietarioCpf] = { lucros: [], rendimentos: [] };
        }
        dadosPorUsuario[item.proprietarioCpf].lucros.push(item);
    });
    
    rendimentosData.forEach(item => {
        if (!dadosPorUsuario[item.proprietarioCpf]) {
            dadosPorUsuario[item.proprietarioCpf] = { lucros: [], rendimentos: [] };
        }
        dadosPorUsuario[item.proprietarioCpf].rendimentos.push(item);
    });
    
    // Salvar cada usuário
    Object.keys(dadosPorUsuario).forEach(cpf => {
        const chave = `dados_${cpf}`;
        const dados = {
            lucros: dadosPorUsuario[cpf].lucros.map(({ proprietarioCpf, ...rest }) => rest),
            rendimentos: dadosPorUsuario[cpf].rendimentos.map(({ proprietarioCpf, ...rest }) => rest)
        };
        localStorage.setItem(chave, JSON.stringify(dados));
    });
}

// ===== FUNÇÕES DE NAVEGAÇÃO ENTRE TABS =====
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-section`).classList.add('active');
}

// ===== FUNÇÕES DE LUCROS =====
function addLucroRow() {
    const userLogado = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf);
    const cpfProprietario = userLogado.role === 'socio' ? usuarioLogado.cpf : filtroAtual;
    
    if (userLogado.role === 'gerencia' && filtroAtual === 'todos') {
        alert('Por favor, selecione um sócio específico para adicionar registros.');
        return;
    }
    
    // Pré-selecionar o primeiro sócio da empresa se existir
    const cpfConta = getCPFParaSociosEmpresa();
    const sociosDisponiveis = JSON.parse(localStorage.getItem(`socios_empresa_${cpfConta}`) || '[]');
    const beneficiarioInicial = sociosDisponiveis.length === 1 ? sociosDisponiveis[0].nome : '';
    
    const newLucro = {
        id: Date.now(),
        data: '',
        socioBeneficiario: beneficiarioInicial,
        descricao: '',
        valor: 0,
        observacoes: '',
        proprietarioCpf: cpfProprietario
    };
    
    lucrosData.push(newLucro);
    renderLucrosTable();
    salvarDadosDoUsuario();
    showSuccessMessage('Registro adicionado com sucesso!');
}

function deleteLucroRow(id) {
    if (confirm('Deseja realmente excluir este registro?')) {
        lucrosData = lucrosData.filter(item => item.id !== id);
        renderLucrosTable();
        salvarDadosDoUsuario();
        showSuccessMessage('Registro excluído com sucesso!');
    }
}

function updateLucroData(id, field, value) {
    const item = lucrosData.find(l => l.id === id);
    if (item) {
        if (field === 'valor') {
            item[field] = parseFloat(value) || 0;
        } else {
            item[field] = value;
        }
        salvarDadosDoUsuario();
        updateLucrosTotal();
    }
}

function renderLucrosTable() {
    const tbody = document.getElementById('lucros-tbody');
    tbody.innerHTML = '';
    
    const userLogado = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf);
    const isGerencia = userLogado.role === 'gerencia';
    const podeEditar = !isGerencia || filtroAtual !== 'todos';
    
    if (lucrosData.length === 0 && podeEditar) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-table-msg">
            <div class="empty-row-hint">📋 Nenhum registro ainda. Clique em <strong>➕ Adicionar Registro</strong> para começar.</div>
        </td></tr>`;
        updateLucrosTotal();
        return;
    }

    lucrosData.forEach(item => {
        const row = document.createElement('tr');
        
        const nomeBeneficiario = getNomeSocioBeneficiario(item);
        
        // Determinar como mostrar o campo Sócio Beneficiário
        let socioBeneficiarioHTML = '';
        
        if (podeEditar) {
            // Carregar sócios da empresa para a conta em questão
            const cpfConta = userLogado.role === 'socio' ? usuarioLogado.cpf : filtroAtual;
            const sociosDisponiveis = JSON.parse(localStorage.getItem(`socios_empresa_${cpfConta}`) || '[]');
            
            if (sociosDisponiveis.length > 0) {
                let options = '<option value="">-- Selecione um Sócio --</option>';
                let valorEncontrado = false;
                
                sociosDisponiveis.forEach(s => {
                    const selected = nomeBeneficiario === s.nome ? 'selected' : '';
                    if (selected) valorEncontrado = true;
                    const label = s.percentual ? `${s.nome} (${s.percentual}%)` : s.nome;
                    options += `<option value="${s.nome}" ${selected}>${label}</option>`;
                });
                
                // Se o valor atual não está na lista (valor antigo/manual), adicionar como opção extra
                if (nomeBeneficiario && !valorEncontrado) {
                    options += `<option value="${nomeBeneficiario}" selected>✏️ ${nomeBeneficiario}</option>`;
                }
                
                socioBeneficiarioHTML = `<select onchange="updateLucroData(${item.id}, 'socioBeneficiario', this.value)">${options}</select>`;
            } else {
                // Nenhum sócio cadastrado: campo de texto + dica
                socioBeneficiarioHTML = `
                    <div class="no-socios-hint">
                        <input type="text" value="${nomeBeneficiario}" placeholder="Nome do sócio"
                            onchange="updateLucroData(${item.id}, 'socioBeneficiario', this.value)">
                        <small class="hint-text" onclick="abrirModalSociosEmpresa()" title="Clique para cadastrar sócios da empresa">
                            💡 Cadastre sócios para facilitar a seleção
                        </small>
                    </div>`;
            }
        } else {
            // Modo somente leitura (gerência visualizando todos)
            socioBeneficiarioHTML = `<span class="socio-beneficiario-text">${nomeBeneficiario || '-'}</span>`;
        }
        
        const proprietario = isGerencia && filtroAtual === 'todos' 
            ? todosOsSocios.find(s => s.cpf === item.proprietarioCpf) 
            : null;
        
        const proprietarioInfo = proprietario ? `<br><small style="color: #6c757d;">Registrado por: ${proprietario.nome}</small>` : '';
        
        row.innerHTML = `
            <td><input type="date" value="${item.data}" ${podeEditar ? '' : 'disabled'} onchange="updateLucroData(${item.id}, 'data', this.value)"></td>
            <td>
                ${socioBeneficiarioHTML}
            </td>
            <td><input type="text" value="${item.descricao}" ${podeEditar ? '' : 'disabled'} placeholder="Descrição (opcional)" onchange="updateLucroData(${item.id}, 'descricao', this.value)">${proprietarioInfo}</td>
            <td><input type="number" step="0.01" value="${item.valor}" ${podeEditar ? '' : 'disabled'} placeholder="0.00" onchange="updateLucroData(${item.id}, 'valor', this.value)"></td>
            <td><input type="text" value="${item.observacoes}" ${podeEditar ? '' : 'disabled'} placeholder="Observações (opcional)" onchange="updateLucroData(${item.id}, 'observacoes', this.value)"></td>
            <td>${podeEditar ? `<button class="btn btn-delete" onclick="deleteLucroRow(${item.id})">🗑️ Excluir</button>` : '-'}</td>
        `;
        tbody.appendChild(row);
    });
    
    updateLucrosTotal();
}

function updateLucrosTotal() {
    const total = lucrosData.reduce((sum, item) => sum + (item.valor || 0), 0);
    document.getElementById('lucros-total').textContent = formatCurrency(total);
}

// ===== FUNÇÕES DE RENDIMENTOS =====
function addRendimentoRow() {
    const userLogado = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf);
    const cpfProprietario = userLogado.role === 'socio' ? usuarioLogado.cpf : filtroAtual;
    
    if (userLogado.role === 'gerencia' && filtroAtual === 'todos') {
        alert('Por favor, selecione um sócio específico para adicionar registros.');
        return;
    }
    
    const newRendimento = {
        id: Date.now(),
        mes: '',
        banco: '',
        valorRendimento: 0,
        irRetido: 0,
        observacoes: '',
        proprietarioCpf: cpfProprietario
    };
    
    rendimentosData.push(newRendimento);
    renderRendimentosTable();
    salvarDadosDoUsuario();
    showSuccessMessage('Registro adicionado com sucesso!');
}

function deleteRendimentoRow(id) {
    if (confirm('Deseja realmente excluir este registro?')) {
        rendimentosData = rendimentosData.filter(item => item.id !== id);
        renderRendimentosTable();
        salvarDadosDoUsuario();
        showSuccessMessage('Registro excluído com sucesso!');
    }
}

function updateRendimentoData(id, field, value) {
    const item = rendimentosData.find(r => r.id === id);
    if (item) {
        if (field === 'valorRendimento' || field === 'irRetido') {
            item[field] = parseFloat(value) || 0;
        } else {
            item[field] = value;
        }
        salvarDadosDoUsuario();
        updateRendimentosTotal();
    }
}

function renderRendimentosTable() {
    const tbody = document.getElementById('rendimentos-tbody');
    tbody.innerHTML = '';
    
    const userLogado = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf);
    const isGerencia = userLogado.role === 'gerencia';
    const podeEditar = !isGerencia || filtroAtual !== 'todos';
    
    if (rendimentosData.length === 0 && podeEditar) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-table-msg">
            <div class="empty-row-hint">📋 Nenhum registro ainda. Clique em <strong>➕ Adicionar Registro</strong> para começar.</div>
        </td></tr>`;
        updateRendimentosTotal();
        return;
    }

    rendimentosData.forEach(item => {
        const row = document.createElement('tr');
        
        const proprietario = isGerencia && filtroAtual === 'todos' 
            ? todosOsSocios.find(s => s.cpf === item.proprietarioCpf) 
            : null;
        
        const proprietarioInfo = proprietario ? `<br><small style="color: #6c757d;">Registrado por: ${proprietario.nome}</small>` : '';
        
        row.innerHTML = `
            <td><input type="month" value="${item.mes}" ${podeEditar ? '' : 'disabled'} onchange="updateRendimentoData(${item.id}, 'mes', this.value)"></td>
            <td><input type="text" value="${item.banco}" ${podeEditar ? '' : 'disabled'} placeholder="Nome do banco" onchange="updateRendimentoData(${item.id}, 'banco', this.value)">${proprietarioInfo}</td>
            <td><input type="number" step="0.01" value="${item.valorRendimento}" ${podeEditar ? '' : 'disabled'} placeholder="0.00" onchange="updateRendimentoData(${item.id}, 'valorRendimento', this.value)"></td>
            <td><input type="number" step="0.01" value="${item.irRetido}" ${podeEditar ? '' : 'disabled'} placeholder="0.00" onchange="updateRendimentoData(${item.id}, 'irRetido', this.value)"></td>
            <td><input type="text" value="${item.observacoes}" ${podeEditar ? '' : 'disabled'} placeholder="Observações (opcional)" onchange="updateRendimentoData(${item.id}, 'observacoes', this.value)"></td>
            <td>${podeEditar ? `<button class="btn btn-delete" onclick="deleteRendimentoRow(${item.id})">🗑️ Excluir</button>` : '-'}</td>
        `;
        tbody.appendChild(row);
    });
    
    updateRendimentosTotal();
}

function updateRendimentosTotal() {
    const totalRendimento = rendimentosData.reduce((sum, item) => sum + (item.valorRendimento || 0), 0);
    const totalIR = rendimentosData.reduce((sum, item) => sum + (item.irRetido || 0), 0);
    
    document.getElementById('rendimentos-total').textContent = formatCurrency(totalRendimento);
    document.getElementById('ir-total').textContent = formatCurrency(totalIR);
}

// ===== FUNÇÕES DE FORMATAÇÃO =====
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatarCPFExibicao(cpf) {
    if (cpf === '00000000000') return 'Admin';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// ===== FUNÇÃO DE LIMPEZA DE DADOS =====
function clearAllData(type) {
    const userLogado = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf);
    
    if (userLogado.role === 'gerencia' && filtroAtual === 'todos') {
        alert('Por favor, selecione um sócio específico para limpar dados.');
        return;
    }
    
    const message = type === 'lucros' 
        ? 'Deseja realmente limpar todos os dados de Distribuição de Lucros?' 
        : 'Deseja realmente limpar todos os dados de Rendimentos Financeiros?';
    
    if (confirm(message)) {
        if (type === 'lucros') {
            lucrosData = [];
            renderLucrosTable();
        } else {
            rendimentosData = [];
            renderRendimentosTable();
        }
        salvarDadosDoUsuario();
        showSuccessMessage('Dados limpos com sucesso!');
    }
}

// ===== FUNÇÃO DE EXPORTAÇÃO PARA EXCEL =====
function exportToExcel(type) {
    let data, headers, filename;
    
    if (type === 'lucros') {
        if (lucrosData.length === 0) {
            alert('Não há dados para exportar!');
            return;
        }
        
        const userLogado = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf);
        const incluirProprietario = userLogado.role === 'gerencia' && filtroAtual === 'todos';
        
        headers = incluirProprietario 
            ? ['Registrado por', 'Data do Crédito', 'Sócio Beneficiário', 'Descrição da Operação', 'Valor (R$)', 'Observações']
            : ['Data do Crédito', 'Sócio Beneficiário', 'Descrição da Operação', 'Valor (R$)', 'Observações'];
        
        data = lucrosData.map(item => {
            const nomeBeneficiario = getNomeSocioBeneficiario(item);
            const proprietario = todosOsSocios.find(s => s.cpf === item.proprietarioCpf);
            
            const baseData = [
                item.data,
                nomeBeneficiario,
                item.descricao,
                item.valor.toFixed(2),
                item.observacoes
            ];
            
            return incluirProprietario ? [proprietario ? proprietario.nome : '', ...baseData] : baseData;
        });
        
        filename = 'distribuicao_lucros.csv';
    } else {
        if (rendimentosData.length === 0) {
            alert('Não há dados para exportar!');
            return;
        }
        
        const userLogado = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf);
        const incluirProprietario = userLogado.role === 'gerencia' && filtroAtual === 'todos';
        
        headers = incluirProprietario
            ? ['Registrado por', 'Mês do Rendimento', 'Banco', 'Valor Rendimento (R$)', 'IR Retido pelo Banco', 'Observações']
            : ['Mês do Rendimento', 'Banco', 'Valor Rendimento (R$)', 'IR Retido pelo Banco', 'Observações'];
        
        data = rendimentosData.map(item => {
            const proprietario = todosOsSocios.find(s => s.cpf === item.proprietarioCpf);
            
            const baseData = [
                item.mes,
                item.banco,
                item.valorRendimento.toFixed(2),
                item.irRetido.toFixed(2),
                item.observacoes
            ];
            
            return incluirProprietario ? [proprietario ? proprietario.nome : '', ...baseData] : baseData;
        });
        
        filename = 'rendimentos_financeiros.csv';
    }
    
    // Criar CSV
    let csvContent = '\uFEFF'; // BOM para UTF-8
    csvContent += headers.join(';') + '\n';
    
    data.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(';') + '\n';
    });
    
    // Fazer download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccessMessage('Arquivo exportado com sucesso!');
}

// Exportar todos os dados (para gerência)
function exportarTodosOsDados() {
    const userLogado = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf);
    
    if (userLogado.role !== 'gerencia') {
        alert('Acesso negado!');
        return;
    }
    
    // Salvar filtro atual
    const filtroAnterior = filtroAtual;
    
    // Carregar todos os dados
    filtroAtual = 'todos';
    carregarDadosParaExibicao();
    
    // Exportar lucros
    if (lucrosData.length > 0) {
        exportToExcel('lucros');
    }
    
    // Exportar rendimentos
    setTimeout(() => {
        if (rendimentosData.length > 0) {
            exportToExcel('rendimentos');
        }
        
        // Restaurar filtro
        filtroAtual = filtroAnterior;
        carregarDadosParaExibicao();
        renderLucrosTable();
        renderRendimentosTable();
    }, 500);
}

// ===== FUNÇÃO DE MENSAGEM DE SUCESSO =====
function showSuccessMessage(message) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'success-message';
    msgDiv.textContent = message;
    document.body.appendChild(msgDiv);
    
    setTimeout(() => {
        msgDiv.remove();
    }, 3000);
}

// ===== ATALHOS DE TECLADO =====
document.addEventListener('keydown', (e) => {
    // Apenas se estiver logado
    if (!usuarioLogado) return;
    
    // Ctrl + 1 = Aba de Lucros
    if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        switchTab('lucros');
    }
    
    // Ctrl + 2 = Aba de Rendimentos
    if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        switchTab('rendimentos');
    }
    
    // Ctrl + N = Adicionar novo registro na aba atual
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        if (activeTab === 'lucros') {
            addLucroRow();
        } else {
            addRendimentoRow();
        }
    }
});

// Fechar modals ao clicar fora
window.onclick = function(event) {
    const targets = [
        { el: document.getElementById('modal-socios'),          fn: fecharModalSocios },
        { el: document.getElementById('modal-admin'),           fn: fecharPainelAdmin },
        { el: document.getElementById('modal-socios-empresa'),  fn: fecharModalSociosEmpresa },
        { el: document.getElementById('modal-editar-usuario'),  fn: fecharModalEditarUsuario },
    ];
    targets.forEach(({ el, fn }) => { if (event.target === el) fn(); });
}
