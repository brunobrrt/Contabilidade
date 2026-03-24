/* ============================================================
   SISTEMA DE ATOS SOCIETÁRIOS — App Principal
   ============================================================ */

// ===== ESTADO GLOBAL =====
let usuarioAtual = null;
let processos = [];
let sociosFormCount = 0;
let arquivosUpload = { iptu: [], docs: [] };

// ===== CONFIGURAÇÃO DE ETAPAS POR TIPO =====
const ETAPAS_POR_TIPO = {
    abertura: [
        { id: 'solicitacao', label: 'Solicitação' },
        { id: 'rede-sim', label: 'Rede Sim' },
        { id: 'dbe', label: 'DBE' },
        { id: 'clicksign', label: 'ClickSign' },
        { id: 'jucesp', label: 'JUCESP' },
        { id: 'exigencia', label: 'Exigência' },
        { id: 'inscricoes', label: 'Inscrições' },
        { id: 'concluido', label: 'Concluído' }
    ],
    alteracao: [
        { id: 'solicitacao', label: 'Solicitação' },
        { id: 'formulario', label: 'Formulário' },
        { id: 'clicksign', label: 'ClickSign' },
        { id: 'jucesp', label: 'JUCESP' },
        { id: 'exigencia', label: 'Exigência' },
        { id: 'concluido', label: 'Concluído' }
    ],
    encerramento: [
        { id: 'solicitacao', label: 'Solicitação' },
        { id: 'distrato', label: 'Distrato' },
        { id: 'documentos', label: 'Documentos' },
        { id: 'prefeitura', label: 'Prefeitura' },
        { id: 'concluido', label: 'Concluído' }
    ]
};

const TIPOS_LABEL = {
    abertura: 'Abertura',
    alteracao: 'Alteração',
    encerramento: 'Encerramento'
};

const SUBTIPOS_LABEL = {
    'razao-social': 'Razão Social',
    'endereco': 'Endereço',
    'quadro-societario': 'Quadro Societário',
    'objeto-social': 'Objeto Social',
    'clausulas': 'Cláusulas Vigentes',
    'transformacao': 'Transformação de Tipo',
    'capital': 'Capital Social'
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    inicializarFirebase();
    configurarAbas();
});

function inicializarFirebase() {
    try {
        if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }
        document.getElementById('firebase-loading').style.display = 'none';
    } catch (e) {
        console.warn('Firebase não configurado. Usando modo local.');
        document.getElementById('firebase-loading').style.display = 'none';
    }
}

// ===== ABAS =====
function configurarAbas() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab + '-section').classList.add('active');
        });
    });
}

// ===== LOGIN / LOGOUT =====
function fazerLogin() {
    const cpf = document.getElementById('login-cpf').value.trim();
    const senha = document.getElementById('login-senha').value;

    if (!cpf || cpf.length !== 11) {
        showToast('CPF deve ter 11 dígitos');
        return;
    }
    if (!senha) {
        showToast('Digite sua senha');
        return;
    }

    // TODO: Integrar com Firebase Auth
    // Por enquanto, simulação
    usuarioAtual = {
        cpf: cpf,
        nome: cpf === '00000000000' ? 'Administrador' : 'Usuário',
        role: cpf === '00000000000' ? 'contabilidade' : 'cliente'
    };

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-system').style.display = 'block';
    document.getElementById('usuario-logado').textContent = usuarioAtual.nome;

    const roleEl = document.getElementById('usuario-role');
    roleEl.textContent = usuarioAtual.role === 'contabilidade' ? '⭐ CONTABILIDADE' : '👤 CLIENTE';
    roleEl.className = 'role-badge ' + usuarioAtual.role;

    if (usuarioAtual.role === 'contabilidade') {
        document.getElementById('btn-admin').style.display = 'inline-flex';
        document.getElementById('filtro-contabilidade').style.display = 'block';
    }

    showToast('Bem-vindo, ' + usuarioAtual.nome + '!');
}

function fazerLogout() {
    if (!confirm('Deseja sair do sistema?')) return;
    usuarioAtual = null;
    document.getElementById('main-system').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-cpf').value = '';
    document.getElementById('login-senha').value = '';
    document.getElementById('btn-admin').style.display = 'none';
    document.getElementById('filtro-contabilidade').style.display = 'none';
}

// ===== MODAL: NOVO PROCESSO =====
function abrirModalNovoProcesso(tipo) {
    document.getElementById('modal-novo-processo').style.display = 'flex';
    sociosFormCount = 0;
    document.getElementById('lista-socios-form').innerHTML = '';
    arquivosUpload = { iptu: [], docs: [] };
    document.getElementById('arquivos-iptu').innerHTML = '';
    document.getElementById('arquivos-docs').innerHTML = '';

    // Reset form
    document.querySelectorAll('#modal-novo-processo input, #modal-novo-processo textarea, #modal-novo-processo select').forEach(el => {
        if (el.type === 'file') return;
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
    });

    if (tipo) {
        document.getElementById('processo-tipo').value = tipo;
        atualizarFormularioProcesso();
    }

    // Adicionar primeiro sócio por padrão
    adicionarSocioForm();
}

function fecharModalNovoProcesso() {
    document.getElementById('modal-novo-processo').style.display = 'none';
}

function atualizarFormularioProcesso() {
    const tipo = document.getElementById('processo-tipo').value;

    // Mostrar/esconder subtipo de alteração
    document.getElementById('campo-tipo-alteracao').style.display =
        tipo === 'alteracao' ? 'block' : 'none';

    // Mostrar/esconder seções conforme tipo
    const secoesEmpresa = ['secao-empresa', 'secao-socios', 'secao-capital',
        'secao-atividades', 'secao-cnpj', 'secao-regime', 'secao-emails', 'secao-valor', 'secao-documentos'];

    if (tipo === 'encerramento') {
        secoesEmpresa.forEach(id => {
            const el = document.getElementById(id);
            if (['secao-empresa', 'secao-socios', 'secao-documentos'].includes(id)) {
                el.style.display = 'block';
            } else {
                el.style.display = 'none';
            }
        });
    } else if (tipo === 'alteracao') {
        secoesEmpresa.forEach(id => document.getElementById(id).style.display = 'block');
        document.getElementById('secao-valor').style.display = 'none';
    } else {
        secoesEmpresa.forEach(id => document.getElementById(id).style.display = 'block');
    }
}

// ===== SÓCIOS DINÂMICOS =====
function adicionarSocioForm() {
    sociosFormCount++;
    const idx = sociosFormCount;
    const container = document.getElementById('lista-socios-form');

    const html = `
        <div class="socio-entry" id="socio-entry-${idx}">
            <div class="socio-entry-header">
                <span class="socio-entry-title">Sócio ${idx}</span>
                <button class="btn-remove-socio" onclick="removerSocioForm(${idx})" title="Remover sócio">×</button>
            </div>
            <div class="form-row">
                <div class="form-field">
                    <label>Nome Completo <span class="required">*</span></label>
                    <input type="text" id="socio-nome-${idx}" placeholder="Nome completo do sócio">
                </div>
                <div class="form-field" style="flex:0 0 180px;">
                    <label>% Participação</label>
                    <input type="number" id="socio-percentual-${idx}" placeholder="0" min="0" max="100" step="0.01" oninput="recalcularParticipacoes()">
                </div>
            </div>
            <div class="form-row" style="margin-top:10px;">
                <div class="form-field">
                    <label>Nacionalidade</label>
                    <input type="text" id="socio-nacionalidade-${idx}" placeholder="Brasileira" value="Brasileira">
                </div>
                <div class="form-field">
                    <label>Profissão</label>
                    <input type="text" id="socio-profissao-${idx}" placeholder="Profissão">
                </div>
                <div class="form-field">
                    <label>Estado Civil</label>
                    <select id="socio-estado-civil-${idx}">
                        <option value="">Selecione...</option>
                        <option value="solteiro">Solteiro(a)</option>
                        <option value="casado">Casado(a)</option>
                        <option value="divorciado">Divorciado(a)</option>
                        <option value="viuvo">Viúvo(a)</option>
                        <option value="uniao-estavel">União Estável</option>
                    </select>
                </div>
            </div>
            <div class="form-row" style="margin-top:10px;">
                <div class="form-field">
                    <label>Regime de Casamento</label>
                    <select id="socio-regime-${idx}">
                        <option value="">N/A</option>
                        <option value="comunhao-parcial">Comunhão Parcial</option>
                        <option value="comunhao-universal">Comunhão Universal</option>
                        <option value="separacao-total">Separação Total</option>
                        <option value="participacao-final">Participação Final nos Aquestos</option>
                    </select>
                </div>
                <div class="form-field">
                    <label>Endereço Completo</label>
                    <input type="text" id="socio-endereco-${idx}" placeholder="Endereço do sócio">
                </div>
            </div>
            <div class="form-field" id="socio-valor-calc-${idx}" style="margin-top:8px;"></div>
            <div class="socio-checkboxes">
                <label>
                    <input type="checkbox" id="socio-admin-${idx}"> Administrador
                </label>
                <label>
                    <input type="radio" name="responsavel-rf" id="socio-rf-${idx}" value="${idx}"> Responsável na RF
                </label>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
}

function removerSocioForm(idx) {
    const entry = document.getElementById('socio-entry-' + idx);
    if (entry) entry.remove();
    recalcularParticipacoes();
}

function recalcularParticipacoes() {
    const capital = parseFloat(document.getElementById('processo-capital')?.value) || 0;

    document.querySelectorAll('[id^="socio-percentual-"]').forEach(input => {
        const idx = input.id.split('-').pop();
        const pct = parseFloat(input.value) || 0;
        const valorEl = document.getElementById('socio-valor-calc-' + idx);

        if (valorEl && capital > 0 && pct > 0) {
            const valor = (capital * pct / 100);
            valorEl.innerHTML = `<div class="valor-calculado">Valor da participação: R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>`;
        } else if (valorEl) {
            valorEl.innerHTML = '';
        }
    });
}

// ===== UPLOAD =====
function handleUpload(input, containerId) {
    const container = document.getElementById(containerId);
    const files = Array.from(input.files);

    files.forEach(file => {
        const fileId = Date.now() + Math.random().toString(36).substr(2, 5);
        const el = document.createElement('div');
        el.className = 'uploaded-file';
        el.id = 'file-' + fileId;
        el.innerHTML = `
            <span class="uploaded-file-name">📄 ${file.name}</span>
            <button class="btn-remove-file" onclick="removerArquivo('${fileId}', '${containerId}')">×</button>
        `;
        container.appendChild(el);

        // Armazenar referência
        if (containerId === 'arquivos-iptu') {
            arquivosUpload.iptu.push({ id: fileId, file: file });
        } else {
            arquivosUpload.docs.push({ id: fileId, file: file });
        }
    });

    input.value = '';
}

function removerArquivo(fileId, containerId) {
    const el = document.getElementById('file-' + fileId);
    if (el) el.remove();

    if (containerId === 'arquivos-iptu') {
        arquivosUpload.iptu = arquivosUpload.iptu.filter(a => a.id !== fileId);
    } else {
        arquivosUpload.docs = arquivosUpload.docs.filter(a => a.id !== fileId);
    }
}

// ===== SALVAR PROCESSO =====
function salvarProcesso() {
    const tipo = document.getElementById('processo-tipo').value;
    if (!tipo) {
        showToast('Selecione o tipo de ato societário');
        return;
    }

    const razao1 = document.getElementById('processo-razao1').value.trim();
    if (!razao1 && tipo !== 'encerramento') {
        showToast('Preencha a razão social');
        return;
    }

    // Coletar sócios
    const socios = [];
    document.querySelectorAll('[id^="socio-entry-"]').forEach(entry => {
        const idx = entry.id.split('-').pop();
        const nome = document.getElementById('socio-nome-' + idx)?.value.trim();
        if (nome) {
            socios.push({
                nome: nome,
                percentual: parseFloat(document.getElementById('socio-' + idx)?.value) || 0,
                nacionalidade: document.getElementById('socio-nacionalidade-' + idx)?.value || '',
                profissao: document.getElementById('socio-profissao-' + idx)?.value || '',
                estadoCivil: document.getElementById('socio-estado-civil-' + idx)?.value || '',
                regimeCasamento: document.getElementById('socio-regime-' + idx)?.value || '',
                endereco: document.getElementById('socio-endereco-' + idx)?.value || '',
                administrador: document.getElementById('socio-admin-' + idx)?.checked || false,
                responsavelRF: document.getElementById('socio-rf-' + idx)?.checked || false
            });
        }
    });

    const processo = {
        id: Date.now().toString(),
        tipo: tipo,
        subtipo: document.getElementById('processo-subtipo')?.value || null,
        razaoSocial: razao1,
        razaoSocial2: document.getElementById('processo-razao2')?.value.trim() || '',
        endereco: document.getElementById('processo-endereco')?.value.trim() || '',
        socios: socios,
        capitalSocial: parseFloat(document.getElementById('processo-capital')?.value) || 0,
        atividadePrincipal: document.getElementById('processo-atividade-principal')?.value.trim() || '',
        atividadeSecundaria: document.getElementById('processo-atividade-secundaria')?.value.trim() || '',
        telefone: document.getElementById('processo-telefone')?.value.trim() || '',
        emailCNPJ: document.getElementById('processo-email-cnpj')?.value.trim() || '',
        porte: document.getElementById('processo-porte')?.value || '',
        regimeTributario: document.getElementById('processo-regime')?.value || '',
        etapas: {},
        status: 'pendente',
        criadoPor: usuarioAtual?.cpf || '',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
    };

    // Inicializar etapas
    const etapasConfig = ETAPAS_POR_TIPO[tipo] || [];
    etapasConfig.forEach(etapa => {
        processo.etapas[etapa.id] = { status: 'pendente', data: null, observacao: '' };
    });
    if (etapasConfig.length > 0) {
        processo.etapas[etapasConfig[0].id].status = 'em-andamento';
    }

    // Salvar localmente (TODO: Firebase)
    processos.push(processo);
    localStorage.setItem('atos-societarios-processos', JSON.stringify(processos));

    fecharModalNovoProcesso();
    renderizarProcessos();
    showToast('Processo salvo com sucesso! 🎉');
}

// ===== RENDERIZAÇÃO =====
function renderizarProcessos() {
    // Carregar do localStorage se vazio
    if (processos.length === 0) {
        const salvos = localStorage.getItem('atos-societarios-processos');
        if (salvos) processos = JSON.parse(salvos);
    }

    renderizarDashboard();
    renderizarLista('abertura', 'lista-aberturas');
    renderizarLista('alteracao', 'lista-alteracoes');
    renderizarLista('encerramento', 'lista-encerramentos');
}

function renderizarDashboard() {
    const aberturas = processos.filter(p => p.tipo === 'abertura').length;
    const alteracoes = processos.filter(p => p.tipo === 'alteracao').length;
    const encerramentos = processos.filter(p => p.tipo === 'encerramento').length;
    const pendentes = processos.filter(p => p.status === 'pendente').length;

    document.getElementById('dash-aberturas').textContent = aberturas;
    document.getElementById('dash-alteracoes').textContent = alteracoes;
    document.getElementById('dash-encerramentos').textContent = encerramentos;
    document.getElementById('dash-pendentes').textContent = pendentes;

    const recentes = document.getElementById('processos-recentes');
    if (processos.length === 0) {
        recentes.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📋</span>
                <p>Nenhum processo cadastrado</p>
                <p class="empty-hint">Clique em "Novo Processo" para começar</p>
            </div>`;
        return;
    }

    const sorted = [...processos].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
    recentes.innerHTML = sorted.slice(0, 5).map(p => criarCardProcesso(p)).join('');
}

function renderizarLista(tipo, containerId) {
    const container = document.getElementById(containerId);
    const lista = processos.filter(p => p.tipo === tipo);

    if (lista.length === 0) {
        const icons = { abertura: '🏢', alteracao: '✏️', encerramento: '❌' };
        const labels = { abertura: 'abertura', alteracao: 'alteração', encerramento: 'encerramento' };
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">${icons[tipo]}</span>
                <p>Nenhum ${labels[tipo]} cadastrado</p>
            </div>`;
        return;
    }

    container.innerHTML = lista.map(p => criarCardProcesso(p)).join('');
}

function criarCardProcesso(processo) {
    const statusLabel = {
        'pendente': 'Pendente',
        'em-andamento': 'Em Andamento',
        'concluido': 'Concluído'
    };

    // Calcular etapa atual
    const etapasConfig = ETAPAS_POR_TIPO[processo.tipo] || [];
    let etapaAtual = 'Início';
    for (const etapa of etapasConfig) {
        const estado = processo.etapas?.[etapa.id]?.status;
        if (estado === 'em-andamento') { etapaAtual = etapa.label; break; }
        if (estado === 'concluido') etapaAtual = etapa.label;
    }

    const statusGeral = calcularStatusGeral(processo);

    return `
        <div class="processo-card" onclick="abrirDetalheProcesso('${processo.id}')">
            <div class="processo-header">
                <span class="processo-tipo ${processo.tipo}">${TIPOS_LABEL[processo.tipo]}</span>
                <span class="processo-status ${statusGeral}">${statusLabel[statusGeral] || statusGeral}</span>
            </div>
            <div class="processo-empresa">${processo.razaoSocial || 'Sem razão social'}</div>
            <div class="processo-meta">
                ${processo.subtipo ? SUBTIPOS_LABEL[processo.subtipo] + ' · ' : ''}
                Etapa: ${etapaAtual} ·
                ${new Date(processo.criadoEm).toLocaleDateString('pt-BR')}
            </div>
        </div>
    `;
}

function calcularStatusGeral(processo) {
    const etapas = Object.values(processo.etapas || {});
    if (etapas.every(e => e.status === 'concluido')) return 'concluido';
    if (etapas.some(e => e.status === 'em-andamento')) return 'em-andamento';
    return 'pendente';
}

// ===== DETALHE DO PROCESSO =====
function abrirDetalheProcesso(id) {
    const processo = processos.find(p => p.id === id);
    if (!processo) return;

    document.getElementById('modal-detalhe-processo').style.display = 'flex';
    document.getElementById('detalhe-titulo').textContent = processo.razaoSocial || 'Processo';
    document.getElementById('detalhe-subtitle').textContent =
        TIPOS_LABEL[processo.tipo] + (processo.subtipo ? ' — ' + SUBTIPOS_LABEL[processo.subtipo] : '');

    // Renderizar pipeline
    const etapasConfig = ETAPAS_POR_TIPO[processo.tipo] || [];
    const pipeline = document.getElementById('detalhe-pipeline');
    pipeline.innerHTML = etapasConfig.map((etapa, i) => {
        const estado = processo.etapas?.[etapa.id]?.status || 'pendente';
        const isLast = i === etapasConfig.length - 1;

        return `
            <div class="etapa">
                <div class="etapa-circle ${estado}">
                    ${estado === 'concluido' ? '✓' : (i + 1)}
                </div>
                <span class="etapa-label">${etapa.label}</span>
            </div>
            ${!isLast ? `<div class="etapa-connector ${estado === 'concluido' ? 'concluido' : ''}"></div>` : ''}
        `;
    }).join('');

    // Info do processo
    const info = document.getElementById('detalhe-info');
    info.innerHTML = `
        <div class="form-row" style="gap:20px;">
            <div class="form-field">
                <label>Razão Social</label>
                <p style="padding:8px 0;font-weight:600;">${processo.razaoSocial || '-'}</p>
            </div>
            ${processo.razaoSocial2 ? `
            <div class="form-field">
                <label>Razão Social (opção 2)</label>
                <p style="padding:8px 0;">${processo.razaoSocial2}</p>
            </div>` : ''}
        </div>
        ${processo.endereco ? `
        <div class="form-field" style="margin-top:12px;">
            <label>Endereço</label>
            <p style="padding:8px 0;">${processo.endereco}</p>
        </div>` : ''}
        ${processo.socios?.length ? `
        <div style="margin-top:16px;">
            <label style="font-size:0.75rem;font-weight:700;color:var(--text-mid);text-transform:uppercase;letter-spacing:.4px;">Sócios (${processo.socios.length})</label>
            ${processo.socios.map(s => `
                <div style="padding:8px 0;border-bottom:1px solid var(--border);">
                    <strong>${s.nome}</strong>
                    ${s.percentual ? ` — ${s.percentual}%` : ''}
                    ${s.administrador ? ' <span style="color:var(--gold);font-weight:700;">Admin</span>' : ''}
                    ${s.responsavelRF ? ' <span style="color:var(--accent);font-size:0.78rem;">Responsável RF</span>' : ''}
                </div>
            `).join('')}
        </div>` : ''}
        ${processo.capitalSocial ? `
        <div class="form-field" style="margin-top:12px;">
            <label>Capital Social</label>
            <p style="padding:8px 0;font-weight:600;">R$ ${processo.capitalSocial.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
        </div>` : ''}
    `;
}

function fecharModalDetalhe() {
    document.getElementById('modal-detalhe-processo').style.display = 'none';
}

// ===== ADMINISTRAÇÃO =====
function abrirPainelAdmin() {
    document.getElementById('modal-admin').style.display = 'flex';
}

function fecharPainelAdmin() {
    document.getElementById('modal-admin').style.display = 'none';
}

function criarNovoUsuario() {
    // TODO: Integrar com Firebase
    showToast('Funcionalidade será integrada com Firebase');
}

// ===== FILTROS =====
function aplicarFiltro() {
    // TODO: Implementar filtros
    renderizarProcessos();
}

// ===== TOAST =====
function showToast(msg) {
    const existing = document.querySelector('.success-message');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.className = 'success-message';
    el.textContent = msg;
    document.body.appendChild(el);

    setTimeout(() => el.remove(), 3000);
}

// ===== CARREGAR PROCESSOS AO INICIAR =====
renderizarProcessos();
