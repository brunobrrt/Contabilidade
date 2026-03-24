/* ============================================================
   SISTEMA DE ATOS SOCIETÁRIOS — App Principal
   Acesso via links: painel, formulário, status
   ============================================================ */

// ===== ESTADO GLOBAL =====
let processos = [];
let processoAtual = null; // processo sendo visualizado/editado
let sociosFormCount = 0;
let arquivosUpload = { iptu: [], docs: [] };
let db = null; // Firestore instance
let unsubscribePainel = null; // listener em tempo real

// ===== CONFIGURAÇÕES =====
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

const PORTES = { 'ME': 'ME — R$ 80.000,01 a R$ 360.000,00', 'EPP': 'EPP — R$ 360.000,01 a R$ 4.800.000,00' };
const REGIMES = { 'simples': 'Simples Nacional', 'presumido': 'Lucro Presumido', 'real': 'Lucro Real' };
const ESTADOS_CIVIS = { 'solteiro': 'Solteiro(a)', 'casado': 'Casado(a)', 'divorciado': 'Divorciado(a)', 'viuvo': 'Viúvo(a)', 'uniao-estavel': 'União Estável' };
const REGIMES_CASAMENTO = { 'comunhao-parcial': 'Comunhão Parcial', 'comunhao-universal': 'Comunhão Universal', 'separacao-total': 'Separação Total', 'participacao-final': 'Participação Final nos Aquestos' };

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    await inicializarFirebase();
    rotear();
});

async function inicializarFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK não carregou. Verifique a conexão.');
            showToast('Erro: não foi possível conectar ao servidor');
            return;
        }
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        console.log('Firebase conectado ✓');
    } catch (e) {
        console.error('Erro ao inicializar Firebase:', e);
        showToast('Erro ao conectar ao servidor');
    }
}

// ===== ROTEAMENTO =====
async function rotear() {
    const params = new URLSearchParams(window.location.search);
    document.getElementById('loading-screen').style.display = 'none';

    if (params.has('form')) {
        const codigo = params.get('form');
        mostrarView('view-form');
        await carregarFormulario(codigo);
    } else if (params.has('status')) {
        const codigo = params.get('status');
        mostrarView('view-status');
        await carregarStatus(codigo);
    } else {
        // Sem parâmetro ou ?painel → painel da contabilidade
        mostrarView('view-painel');
        configurarAbas();
        iniciarPainel();
    }
}

function mostrarView(viewId) {
    ['view-painel', 'view-form', 'view-status', 'view-invalido'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    document.getElementById(viewId).style.display = 'block';
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

// ===== GERAR CÓDIGOS ÚNICOS =====
function gerarCodigo(tamanho = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let codigo = '';
    for (let i = 0; i < tamanho; i++) {
        codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codigo;
}

async function gerarLinks() {
    let codigoForm, codigoStatus;
    let tentativas = 0;
    do {
        codigoForm = gerarCodigo(10);
        tentativas++;
        if (tentativas > 20) throw new Error('Não foi possível gerar código único');
    } while (await existeCodigo(codigoForm));

    tentativas = 0;
    do {
        codigoStatus = gerarCodigo(10);
        tentativas++;
        if (tentativas > 20) throw new Error('Não foi possível gerar código único');
    } while (await existeCodigo(codigoStatus));

    return { form: codigoForm, status: codigoStatus };
}

function getUrlBase() {
    // file:// não tem origin, usa só o pathname
    if (window.location.protocol === 'file:') {
        return window.location.pathname.split('/').slice(-1)[0] || 'index.html';
    }
    return window.location.origin + window.location.pathname;
}

function montarLinkForm(codigo) {
    return getUrlBase() + '?form=' + codigo;
}

function montarLinkStatus(codigo) {
    return getUrlBase() + '?status=' + codigo;
}

// ===== PERSISTÊNCIA (FIRESTORE) =====
const COLLECTION = 'atos-societarios';

// Carregar processo único por ID (para formulário/status do cliente)
async function buscarProcessoPorId(id) {
    if (!db) return null;
    try {
        const doc = await db.collection(COLLECTION).doc(id).get();
        if (doc.exists) return { id: doc.id, ...doc.data() };
    } catch (e) {
        console.error('Erro ao buscar processo:', e);
    }
    return null;
}

// Buscar por código do formulário (consulta única)
async function buscarPorLinkForm(codigo) {
    if (!db) return null;
    try {
        const snap = await db.collection(COLLECTION).where('linkForm', '==', codigo).limit(1).get();
        if (!snap.empty) {
            const doc = snap.docs[0];
            return { id: doc.id, ...doc.data() };
        }
    } catch (e) {
        console.error('Erro ao buscar por linkForm:', e);
    }
    return null;
}

// Buscar por código de status (consulta única)
async function buscarPorLinkStatus(codigo) {
    if (!db) return null;
    try {
        const snap = await db.collection(COLLECTION).where('linkStatus', '==', codigo).limit(1).get();
        if (!snap.empty) {
            const doc = snap.docs[0];
            return { id: doc.id, ...doc.data() };
        }
    } catch (e) {
        console.error('Erro ao buscar por linkStatus:', e);
    }
    return null;
}

// Verificar se código já existe (para gerarLinks)
async function existeCodigo(codigo) {
    if (!db) return false;
    try {
        const snapForm = await db.collection(COLLECTION).where('linkForm', '==', codigo).limit(1).get();
        if (!snapForm.empty) return true;
        const snapStatus = await db.collection(COLLECTION).where('linkStatus', '==', codigo).limit(1).get();
        if (!snapStatus.empty) return true;
    } catch (e) {
        console.error('Erro ao verificar código:', e);
    }
    return false;
}

// Criar processo no Firestore
async function criarProcessoNoFirestore(processo) {
    if (!db) throw new Error('Firestore não conectado');
    const docRef = await db.collection(COLLECTION).add(processo);
    return docRef.id;
}

// Atualizar processo no Firestore
async function atualizarProcessoNoFirestore(id, dados) {
    if (!db) throw new Error('Firestore não conectado');
    await db.collection(COLLECTION).doc(id).update(dados);
}

// Listener em tempo real para o painel (lista todos os processos)
function escutarProcessos(callback) {
    if (!db) return null;
    return db.collection(COLLECTION)
        .orderBy('criadoEm', 'desc')
        .onSnapshot(snap => {
            const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            processos = lista;
            callback(lista);
        }, error => {
            console.error('Erro no listener:', error);
            showToast('Erro ao carregar processos');
        });
}

// Listener em tempo real para 1 processo (cliente)
function escutarProcesso(processoId, callback) {
    if (!db) return null;
    return db.collection(COLLECTION).doc(processoId)
        .onSnapshot(doc => {
            if (doc.exists) {
                callback({ id: doc.id, ...doc.data() });
            }
        }, error => {
            console.error('Erro no listener do processo:', error);
        });
}

// ===================================================================
//  PAINEL DA CONTABILIDADE
// ===================================================================

function iniciarPainel() {
    // Listener em tempo real — atualiza automaticamente quando dados mudam
    if (unsubscribePainel) unsubscribePainel();
    unsubscribePainel = escutarProcessos(lista => {
        processos = lista;
        renderizarPainel();
    });
}

function renderizarPainel() {
    renderizarDashboard();
    renderizarLista('abertura', 'lista-aberturas');
    renderizarLista('alteracao', 'lista-alteracoes');
    renderizarLista('encerramento', 'lista-encerramentos');
    popularFiltroClientes();
}

function popularFiltroClientes() {
    const select = document.getElementById('filtro-cliente');
    const clientes = [...new Set(processos.map(p => p.clienteNome).filter(Boolean))];
    select.innerHTML = '<option value="todos">Todos os Clientes</option>';
    clientes.forEach(nome => {
        select.innerHTML += `<option value="${nome}">${nome}</option>`;
    });
}

// Modal: Novo Processo
function abrirModalNovoProcesso(tipo) {
    document.getElementById('modal-novo-processo').style.display = 'flex';
    document.getElementById('processo-tipo').value = tipo || '';
    document.getElementById('processo-cliente-nome').value = '';
    document.getElementById('processo-subtipo').selectedIndex = 0;
    atualizarFormularioProcesso();
}

function fecharModalNovoProcesso() {
    document.getElementById('modal-novo-processo').style.display = 'none';
}

function atualizarFormularioProcesso() {
    const tipo = document.getElementById('processo-tipo').value;
    document.getElementById('campo-tipo-alteracao').style.display = tipo === 'alteracao' ? 'block' : 'none';
}

// Criar processo (contabilidade)
async function criarProcesso() {
    const tipo = document.getElementById('processo-tipo').value;
    if (!tipo) { showToast('Selecione o tipo de ato societário'); return; }

    const clienteNome = document.getElementById('processo-cliente-nome').value.trim();
    if (!clienteNome) { showToast('Preencha o nome do cliente'); return; }

    const subtipo = document.getElementById('processo-subtipo')?.value || null;

    showToast('Gerando links...');

    let links;
    try {
        links = await gerarLinks();
    } catch (e) {
        showToast('Erro ao gerar links. Tente novamente.');
        return;
    }

    const etapasConfig = ETAPAS_POR_TIPO[tipo] || [];
    const etapas = {};
    etapasConfig.forEach(etapa => {
        etapas[etapa.id] = { status: 'pendente', data: null, observacao: '' };
    });
    if (etapasConfig.length > 0) {
        etapas[etapasConfig[0].id].status = 'em-andamento';
    }

    const processo = {
        tipo: tipo,
        subtipo: subtipo,
        clienteNome: clienteNome,
        linkForm: links.form,
        linkStatus: links.status,
        dados: {},
        socios: [],
        etapas: etapas,
        status: 'pendente',
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
        preenchidoEm: null
    };

    try {
        const novoId = await criarProcessoNoFirestore(processo);
        processo.id = novoId;
    } catch (e) {
        console.error('Erro ao salvar processo:', e);
        showToast('Erro ao salvar. Tente novamente.');
        return;
    }

    fecharModalNovoProcesso();

    // Mostrar modal com links gerados
    document.getElementById('link-gerado-form').value = montarLinkForm(links.form);
    document.getElementById('link-gerado-status').value = montarLinkStatus(links.status);
    document.getElementById('modal-links-gerados').style.display = 'flex';

    // Guardar pra enviar WhatsApp
    window._linksParaEnviar = {
        form: montarLinkForm(links.form),
        status: montarLinkStatus(links.status),
        cliente: clienteNome,
        tipo: TIPOS_LABEL[tipo]
    };

    showToast('Processo criado! Envie os links ao cliente. ✅');
}

function fecharModalLinksGerados() {
    document.getElementById('modal-links-gerados').style.display = 'none';
}

// Detalhe do processo (contabilidade)
function abrirDetalheProcesso(id) {
    const processo = processos.find(p => p.id === id);
    if (!processo) return;

    window._processoDetalhe = processo;

    document.getElementById('modal-detalhe-processo').style.display = 'flex';
    document.getElementById('detalhe-titulo').textContent = processo.clienteNome || processo.dados?.razaoSocial || 'Processo';
    document.getElementById('detalhe-subtitle').textContent =
        TIPOS_LABEL[processo.tipo] + (processo.subtipo ? ' — ' + SUBTIPOS_LABEL[processo.subtipo] : '');

    // Links
    document.getElementById('detalhe-link-form').value = montarLinkForm(processo.linkForm);
    document.getElementById('detalhe-link-status').value = montarLinkStatus(processo.linkStatus);

    // Pipeline
    renderizarPipeline(processo, 'detalhe-pipeline', true);

    // Botões de etapa
    const botoes = document.getElementById('detalhe-etapas-botoes');
    const etapasConfig = ETAPAS_POR_TIPO[processo.tipo] || [];
    botoes.innerHTML = etapasConfig.map(etapa => {
        const estado = processo.etapas?.[etapa.id]?.status || 'pendente';
        const proximo = estado === 'pendente' ? 'em-andamento' : estado === 'em-andamento' ? 'concluido' : null;
        if (!proximo) return '';
        const label = proximo === 'em-andamento' ? `▶ Iniciar: ${etapa.label}` : `✓ Concluir: ${etapa.label}`;
        const cls = proximo === 'concluido' ? 'btn-success' : 'btn-primary';
        return `<button class="btn btn-small ${cls}" onclick="avancarEtapa('${processo.id}','${etapa.id}','${proximo}')">${label}</button>`;
    }).join('');

    // Info
    renderizarInfoProcesso(processo, 'detalhe-info');
}

function fecharModalDetalhe() {
    document.getElementById('modal-detalhe-processo').style.display = 'none';
}

async function avancarEtapa(processoId, etapaId, novoStatus) {
    const processo = processos.find(p => p.id === processoId);
    if (!processo) return;

    processo.etapas[etapaId].status = novoStatus;
    processo.etapas[etapaId].data = new Date().toISOString();
    processo.atualizadoEm = new Date().toISOString();

    // Verificar se concluiu
    const etapasConfig = ETAPAS_POR_TIPO[processo.tipo] || [];
    const todasConcluidas = etapasConfig.every(e => processo.etapas[e.id]?.status === 'concluido');
    processo.status = todasConcluidas ? 'concluido' : 'em-andamento';

    try {
        await atualizarProcessoNoFirestore(processoId, {
            etapas: processo.etapas,
            status: processo.status,
            atualizadoEm: processo.atualizadoEm
        });
    } catch (e) {
        console.error('Erro ao atualizar etapa:', e);
        showToast('Erro ao salvar. Tente novamente.');
        return;
    }

    abrirDetalheProcesso(processoId);
    showToast('Etapa atualizada!');
}

// ===================================================================
//  FORMULÁRIO DO CLIENTE (acesso via ?form=CODIGO)
// ===================================================================

async function carregarFormulario(codigo) {
    const processo = await buscarPorLinkForm(codigo);
    if (!processo) {
        mostrarView('view-invalido');
        return;
    }

    processoAtual = processo;
    const tipo = processo.tipo;

    document.getElementById('form-tipo-badge').textContent = TIPOS_LABEL[tipo];
    document.getElementById('form-tipo-badge').className = 'role-badge ' + tipo;

    const titulos = {
        abertura: '📝 Formulário de Abertura de Empresa',
        alteracao: '📝 Formulário de Alteração do Contrato Social',
        encerramento: '📝 Formulário de Encerramento de Empresa'
    };
    document.getElementById('form-titulo').textContent = titulos[tipo] || 'Preencha os dados';

    const container = document.getElementById('form-cliente-container');
    container.innerHTML = montarFormularioHTML(processo);

    // Se já tem dados, preencher
    if (processo.preenchidoEm) {
        preencherFormulario(processo);
        document.getElementById('form-links-salvos').style.display = 'block';
        document.getElementById('link-form').value = montarLinkForm(processo.linkForm);
        document.getElementById('link-status').value = montarLinkStatus(processo.linkStatus);
    }

    // Sócio inicial
    sociosFormCount = 0;
    if (tipo !== 'encerramento' && (!processo.socios || processo.socios.length === 0)) {
        adicionarSocioForm();
    } else if (processo.socios && processo.socios.length > 0) {
        processo.socios.forEach((s, i) => adicionarSocioForm(s));
    }

    // Escutar atualizações em tempo real
    escutarProcesso(processo.id, atualizado => {
        processoAtual = atualizado;
        // Se dados mudaram de outra aba/dispositivo, atualizar
        if (atualizado.preenchidoEm && !document.getElementById('fc-razao1')?.value) {
            preencherFormulario(atualizado);
        }
    });
}

function montarFormularioHTML(processo) {
    const tipo = processo.tipo;
    let html = '';

    // Botão salvar
    html += `<div style="display:flex;justify-content:flex-end;margin-bottom:20px;">
        <button class="btn btn-primary" onclick="salvarFormularioCliente()">💾 Salvar Dados</button>
    </div>`;

    // Dados da Empresa
    if (tipo !== 'encerramento') {
        html += `
        <div class="modal-section">
            <h3>🏢 Dados da Empresa</h3>
            <div class="form-row">
                <div class="form-field">
                    <label>Razão Social (opção 1) <span class="required">*</span></label>
                    <input type="text" id="fc-razao1" placeholder="Nome da empresa">
                </div>
                <div class="form-field">
                    <label>Razão Social (opção 2) <span class="optional">(alternativa)</span></label>
                    <input type="text" id="fc-razao2" placeholder="Nome alternativo">
                </div>
            </div>
            <div class="form-field" style="margin-top:12px;">
                <label>Endereço da Sede <span class="required">*</span></label>
                <textarea id="fc-endereco" placeholder="Endereço completo da sede"></textarea>
            </div>
            <div class="form-field" style="margin-top:12px;">
                <label>IPTU</label>
                <div class="upload-area" onclick="document.getElementById('fc-upload-iptu').click()">
                    <input type="file" id="fc-upload-iptu" accept="image/*,.pdf" onchange="handleUpload(this, 'fc-arquivos-iptu')">
                    <span class="upload-icon">📎</span>
                    <span class="upload-text">Clique para enviar o comprovante de IPTU</span>
                    <span class="upload-hint">PDF ou imagem (JPG, PNG)</span>
                </div>
                <div class="uploaded-files" id="fc-arquivos-iptu"></div>
            </div>
        </div>`;
    }

    // Documentos (sempre para encerramento)
    if (tipo === 'encerramento' || tipo === 'abertura') {
        html += `
        <div class="modal-section">
            <h3>📎 Documentos Pessoais dos Sócios</h3>
            <p style="font-size:0.82rem;color:var(--text-light);margin-bottom:12px;">RG, CPF e outros documentos</p>
            <div class="upload-area" onclick="document.getElementById('fc-upload-docs').click()">
                <input type="file" id="fc-upload-docs" accept="image/*,.pdf" multiple onchange="handleUpload(this, 'fc-arquivos-docs')">
                <span class="upload-icon">📎</span>
                <span class="upload-text">Clique para enviar documentos</span>
                <span class="upload-hint">PDF ou imagem — pode selecionar vários</span>
            </div>
            <div class="uploaded-files" id="fc-arquivos-docs"></div>
        </div>`;
    }

    // Sócios
    if (tipo !== 'encerramento') {
        html += `
        <div class="modal-section">
            <h3>👥 Sócios</h3>
            <div id="fc-lista-socios"></div>
            <button class="btn btn-outline" onclick="adicionarSocioForm()" style="margin-top:8px;">+ Adicionar Sócio</button>
        </div>`;
    }

    // Capital Social
    if (tipo === 'abertura') {
        html += `
        <div class="modal-section">
            <h3>💰 Capital Social</h3>
            <div class="form-row">
                <div class="form-field">
                    <label>Capital Social Total (R$) <span class="required">*</span></label>
                    <input type="number" id="fc-capital" placeholder="0,00" step="0.01" min="0" oninput="recalcularParticipacoes()">
                </div>
            </div>
        </div>

        <div class="modal-section">
            <h3>🏭 Atividades da Empresa</h3>
            <div class="form-field">
                <label>Atividade Principal <span class="required">*</span></label>
                <input type="text" id="fc-atividade-principal" placeholder="CNAE ou descrição">
            </div>
            <div class="form-field" style="margin-top:12px;">
                <label>Atividade Secundária</label>
                <input type="text" id="fc-atividade-secundaria" placeholder="CNAE ou descrição">
            </div>
        </div>

        <div class="modal-section">
            <h3>📇 Dados para Cartão CNPJ</h3>
            <div class="aviso-publico">
                ⚠️ Essas informações ficam disponíveis para consulta pública. Recomendamos criar um e-mail específico.
            </div>
            <div class="form-row" style="margin-top:12px;">
                <div class="form-field">
                    <label>Telefone</label>
                    <input type="text" id="fc-telefone" placeholder="(00) 00000-0000">
                </div>
                <div class="form-field">
                    <label>E-mail</label>
                    <input type="email" id="fc-email-cnpj" placeholder="email@empresa.com.br">
                </div>
            </div>
        </div>

        <div class="modal-section">
            <h3>📊 Porte e Regime Tributário</h3>
            <div class="form-row">
                <div class="form-field">
                    <label>Porte da Empresa <span class="required">*</span></label>
                    <select id="fc-porte">
                        <option value="">Selecione...</option>
                        <option value="ME">ME — R$ 80.000,01 a R$ 360.000,00</option>
                        <option value="EPP">EPP — R$ 360.000,01 a R$ 4.800.000,00</option>
                    </select>
                </div>
                <div class="form-field">
                    <label>Regime Tributário <span class="required">*</span></label>
                    <select id="fc-regime">
                        <option value="">Selecione...</option>
                        <option value="simples">Simples Nacional</option>
                        <option value="presumido">Lucro Presumido</option>
                        <option value="real">Lucro Real</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="valor-calculado" style="font-size:1.1rem;text-align:center;padding:16px;margin-top:16px;">
            💰 Valor da Abertura: <strong>R$ 1.000,00</strong>
            <br><span style="font-size:0.78rem;font-weight:400;opacity:0.8;">Inclui: elaboração do contrato, registros e taxas</span>
        </div>`;
    }

    // Info pós-abertura
    if (tipo === 'abertura') {
        html += `
        <div class="modal-section" style="margin-top:20px;">
            <h3>📌 Após a Abertura</h3>
            <div class="aviso-publico" style="background:#d1ecf1;border-color:#0c5460;color:#0c5460;">
                Após a conclusão, você precisará:<br>
                • Acessar o <strong>Portal da JUCESP</strong> com sua senha Gov.br<br>
                • Assinar os documentos online<br>
                • Adquirir <strong>Certificado Digital A1</strong> (obrigatório)
            </div>
        </div>`;
    }

    // Botão salvar embaixo também
    html += `<div style="display:flex;justify-content:flex-end;margin-top:24px;padding-top:16px;border-top:1px solid var(--border);">
        <button class="btn btn-primary" onclick="salvarFormularioCliente()">💾 Salvar Dados</button>
    </div>`;

    return html;
}

// ===== SÓCIOS DINÂMICOS (FORMULÁRIO DO CLIENTE) =====
function adicionarSocioForm(dadosExistentes) {
    sociosFormCount++;
    const idx = sociosFormCount;
    const container = document.getElementById('fc-lista-socios');
    if (!container) return;

    const s = dadosExistentes || {};

    const html = `
        <div class="socio-entry" id="socio-entry-${idx}">
            <div class="socio-entry-header">
                <span class="socio-entry-title">Sócio ${idx}</span>
                <button class="btn-remove-socio" onclick="removerSocioForm(${idx})" title="Remover">×</button>
            </div>
            <div class="form-row">
                <div class="form-field">
                    <label>Nome Completo <span class="required">*</span></label>
                    <input type="text" id="socio-nome-${idx}" placeholder="Nome completo" value="${s.nome || ''}">
                </div>
                <div class="form-field" style="flex:0 0 180px;">
                    <label>% Participação</label>
                    <input type="number" id="socio-percentual-${idx}" placeholder="0" min="0" max="100" step="0.01" value="${s.percentual || ''}" oninput="recalcularParticipacoes()">
                </div>
            </div>
            <div class="form-row" style="margin-top:10px;">
                <div class="form-field">
                    <label>Nacionalidade</label>
                    <input type="text" id="socio-nacionalidade-${idx}" value="${s.nacionalidade || 'Brasileira'}">
                </div>
                <div class="form-field">
                    <label>Profissão</label>
                    <input type="text" id="socio-profissao-${idx}" value="${s.profissao || ''}">
                </div>
                <div class="form-field">
                    <label>Estado Civil</label>
                    <select id="socio-estado-civil-${idx}">
                        <option value="">Selecione...</option>
                        ${Object.entries(ESTADOS_CIVIS).map(([v, l]) => `<option value="${v}" ${s.estadoCivil === v ? 'selected' : ''}>${l}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-row" style="margin-top:10px;">
                <div class="form-field">
                    <label>Regime de Casamento</label>
                    <select id="socio-regime-${idx}">
                        <option value="">N/A</option>
                        ${Object.entries(REGIMES_CASAMENTO).map(([v, l]) => `<option value="${v}" ${s.regimeCasamento === v ? 'selected' : ''}>${l}</option>`).join('')}
                    </select>
                </div>
                <div class="form-field">
                    <label>Endereço Completo</label>
                    <input type="text" id="socio-endereco-${idx}" value="${s.endereco || ''}">
                </div>
            </div>
            <div class="form-field" id="socio-valor-calc-${idx}" style="margin-top:8px;"></div>
            <div class="socio-checkboxes">
                <label><input type="checkbox" id="socio-admin-${idx}" ${s.administrador ? 'checked' : ''}> Administrador</label>
                <label><input type="radio" name="responsavel-rf" id="socio-rf-${idx}" value="${idx}" ${s.responsavelRF ? 'checked' : ''}> Responsável na RF</label>
            </div>
        </div>`;

    container.insertAdjacentHTML('beforeend', html);
}

function removerSocioForm(idx) {
    const entry = document.getElementById('socio-entry-' + idx);
    if (entry) entry.remove();
    recalcularParticipacoes();
}

function recalcularParticipacoes() {
    const capital = parseFloat(document.getElementById('fc-capital')?.value) || 0;
    document.querySelectorAll('[id^="socio-percentual-"]').forEach(input => {
        const idx = input.id.split('-').pop();
        const pct = parseFloat(input.value) || 0;
        const valorEl = document.getElementById('socio-valor-calc-' + idx);
        if (valorEl && capital > 0 && pct > 0) {
            const valor = capital * pct / 100;
            valorEl.innerHTML = `<div class="valor-calculado">Valor da participação: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>`;
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
        el.innerHTML = `<span class="uploaded-file-name">📄 ${file.name}</span><button class="btn-remove-file" onclick="this.parentElement.remove()">×</button>`;
        container.appendChild(el);
    });
    input.value = '';
}

function handleUploadCliente(input) {
    handleUpload(input, 'status-arquivos-docs');
}

// ===== SALVAR FORMULÁRIO DO CLIENTE =====
async function salvarFormularioCliente() {
    if (!processoAtual) return;

    // Coletar dados
    const razao1 = document.getElementById('fc-razao1')?.value.trim();
    if (!razao1 && processoAtual.tipo !== 'encerramento') {
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
                nome,
                percentual: parseFloat(document.getElementById('socio-percentual-' + idx)?.value) || 0,
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

    const dados = {
        razaoSocial: razao1 || '',
        razaoSocial2: document.getElementById('fc-razao2')?.value.trim() || '',
        endereco: document.getElementById('fc-endereco')?.value.trim() || '',
        capitalSocial: parseFloat(document.getElementById('fc-capital')?.value) || 0,
        atividadePrincipal: document.getElementById('fc-atividade-principal')?.value.trim() || '',
        atividadeSecundaria: document.getElementById('fc-atividade-secundaria')?.value.trim() || '',
        telefone: document.getElementById('fc-telefone')?.value.trim() || '',
        emailCNPJ: document.getElementById('fc-email-cnpj')?.value.trim() || '',
        porte: document.getElementById('fc-porte')?.value || '',
        regimeTributario: document.getElementById('fc-regime')?.value || ''
    };

    const agora = new Date().toISOString();
    const atualizacoes = {
        dados: dados,
        socios: socios,
        preenchidoEm: processoAtual.preenchidoEm || agora,
        atualizadoEm: agora
    };

    // Avançar etapa de solicitação se ainda em andamento
    if (processoAtual.etapas?.solicitacao?.status === 'em-andamento') {
        const novasEtapas = { ...processoAtual.etapas };
        novasEtapas.solicitacao = { status: 'concluido', data: agora, observacao: '' };
        atualizacoes.etapas = novasEtapas;
    }

    try {
        await atualizarProcessoNoFirestore(processoAtual.id, atualizacoes);
        processoAtual = { ...processoAtual, ...atualizacoes };
    } catch (e) {
        console.error('Erro ao salvar:', e);
        showToast('Erro ao salvar. Tente novamente.');
        return;
    }

    // Mostrar links
    document.getElementById('form-links-salvos').style.display = 'block';
    document.getElementById('link-form').value = montarLinkForm(processoAtual.linkForm);
    document.getElementById('link-status').value = montarLinkStatus(processoAtual.linkStatus);

    showToast('Dados salvos com sucesso! 🎉');
}

function preencherFormulario(processo) {
    const d = processo.dados || {};
    setTimeout(() => {
        if (document.getElementById('fc-razao1')) document.getElementById('fc-razao1').value = d.razaoSocial || '';
        if (document.getElementById('fc-razao2')) document.getElementById('fc-razao2').value = d.razaoSocial2 || '';
        if (document.getElementById('fc-endereco')) document.getElementById('fc-endereco').value = d.endereco || '';
        if (document.getElementById('fc-capital')) document.getElementById('fc-capital').value = d.capitalSocial || '';
        if (document.getElementById('fc-atividade-principal')) document.getElementById('fc-atividade-principal').value = d.atividadePrincipal || '';
        if (document.getElementById('fc-atividade-secundaria')) document.getElementById('fc-atividade-secundaria').value = d.atividadeSecundaria || '';
        if (document.getElementById('fc-telefone')) document.getElementById('fc-telefone').value = d.telefone || '';
        if (document.getElementById('fc-email-cnpj')) document.getElementById('fc-email-cnpj').value = d.emailCNPJ || '';
        if (document.getElementById('fc-porte')) document.getElementById('fc-porte').value = d.porte || '';
        if (document.getElementById('fc-regime')) document.getElementById('fc-regime').value = d.regimeTributario || '';
    }, 100);
}

// ===================================================================
//  STATUS DO CLIENTE (acesso via ?status=CODIGO)
// ===================================================================

async function carregarStatus(codigo) {
    const processo = await buscarPorLinkStatus(codigo);
    if (!processo) {
        mostrarView('view-invalido');
        return;
    }

    const d = processo.dados || {};
    document.getElementById('status-titulo').textContent = `📋 ${d.razaoSocial || processo.clienteNome || 'Seu Processo'}`;
    document.getElementById('status-descricao').textContent = TIPOS_LABEL[processo.tipo] +
        (processo.subtipo ? ' — ' + SUBTIPOS_LABEL[processo.subtipo] : '');

    // Pipeline
    renderizarPipeline(processo, 'status-pipeline', false);

    // Info
    renderizarInfoProcesso(processo, 'status-info');

    // Upload de docs (se não concluído)
    if (processo.status !== 'concluido') {
        document.getElementById('status-secao-upload').style.display = 'block';
    }

    // Listener em tempo real pra atualizar automaticamente
    escutarProcesso(processo.id, atualizado => {
        renderizarPipeline(atualizado, 'status-pipeline', false);
        renderizarInfoProcesso(atualizado, 'status-info');
    });
}

// ===================================================================
//  COMPONENTES COMPARTILHADOS
// ===================================================================

function renderizarPipeline(processo, containerId, editavel) {
    const etapasConfig = ETAPAS_POR_TIPO[processo.tipo] || [];
    const container = document.getElementById(containerId);

    container.innerHTML = etapasConfig.map((etapa, i) => {
        const estado = processo.etapas?.[etapa.id]?.status || 'pendente';
        const isLast = i === etapasConfig.length - 1;
        return `
            <div class="etapa">
                <div class="etapa-circle ${estado}">${estado === 'concluido' ? '✓' : (i + 1)}</div>
                <span class="etapa-label">${etapa.label}</span>
            </div>
            ${!isLast ? `<div class="etapa-connector ${estado === 'concluido' ? 'concluido' : ''}"></div>` : ''}
        `;
    }).join('');
}

function renderizarInfoProcesso(processo, containerId) {
    const container = document.getElementById(containerId);
    const d = processo.dados || {};

    let html = '';

    if (d.razaoSocial) {
        html += `<div class="form-row" style="gap:20px;">
            <div class="form-field"><label>Razão Social</label><p style="padding:8px 0;font-weight:600;">${d.razaoSocial}</p></div>
            ${d.razaoSocial2 ? `<div class="form-field"><label>Razão Social (opção 2)</label><p style="padding:8px 0;">${d.razaoSocial2}</p></div>` : ''}
        </div>`;
    }

    if (d.endereco) html += `<div class="form-field" style="margin-top:12px;"><label>Endereço</label><p style="padding:8px 0;">${d.endereco}</p></div>`;

    if (processo.socios?.length) {
        html += `<div style="margin-top:16px;">
            <label style="font-size:0.75rem;font-weight:700;color:var(--text-mid);text-transform:uppercase;letter-spacing:.4px;">Sócios (${processo.socios.length})</label>
            ${processo.socios.map(s => `<div style="padding:8px 0;border-bottom:1px solid var(--border);">
                <strong>${s.nome}</strong>${s.percentual ? ` — ${s.percentual}%` : ''}
                ${s.administrador ? ' <span style="color:var(--gold);font-weight:700;">Admin</span>' : ''}
                ${s.responsavelRF ? ' <span style="color:var(--accent);font-size:0.78rem;">Responsável RF</span>' : ''}
            </div>`).join('')}
        </div>`;
    }

    if (d.capitalSocial) html += `<div class="form-field" style="margin-top:12px;"><label>Capital Social</label><p style="padding:8px 0;font-weight:600;">R$ ${d.capitalSocial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>`;

    if (!html) html = '<p style="color:var(--text-light);">Aguardando preenchimento do cliente...</p>';

    container.innerHTML = html;
}

// ===== RENDERIZAÇÃO DO PAINEL =====
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
        recentes.innerHTML = `<div class="empty-state"><span class="empty-icon">📋</span><p>Nenhum processo cadastrado</p><p class="empty-hint">Clique em "Novo Processo" para começar</p></div>`;
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
        container.innerHTML = `<div class="empty-state"><span class="empty-icon">${icons[tipo]}</span><p>Nenhum ${labels[tipo]} cadastrado</p></div>`;
        return;
    }

    container.innerHTML = lista.map(p => criarCardProcesso(p)).join('');
}

function criarCardProcesso(processo) {
    const statusLabel = { 'pendente': 'Pendente', 'em-andamento': 'Em Andamento', 'concluido': 'Concluído' };

    const etapasConfig = ETAPAS_POR_TIPO[processo.tipo] || [];
    let etapaAtual = 'Início';
    for (const etapa of etapasConfig) {
        const estado = processo.etapas?.[etapa.id]?.status;
        if (estado === 'em-andamento') { etapaAtual = etapa.label; break; }
        if (estado === 'concluido') etapaAtual = etapa.label;
    }

    const statusGeral = calcularStatusGeral(processo);
    const nome = processo.dados?.razaoSocial || processo.clienteNome || 'Sem nome';
    const preenchido = processo.preenchidoEm ? '' : ' <span style="color:var(--warning);font-size:0.72rem;">⏳ Aguardando preenchimento</span>';

    return `
        <div class="processo-card" onclick="abrirDetalheProcesso('${processo.id}')">
            <div class="processo-header">
                <span class="processo-tipo ${processo.tipo}">${TIPOS_LABEL[processo.tipo]}</span>
                <span class="processo-status ${statusGeral}">${statusLabel[statusGeral]}</span>
            </div>
            <div class="processo-empresa">${nome}${preenchido}</div>
            <div class="processo-meta">
                ${processo.subtipo ? SUBTIPOS_LABEL[processo.subtipo] + ' · ' : ''}
                Etapa: ${etapaAtual} · ${new Date(processo.criadoEm).toLocaleDateString('pt-BR')}
            </div>
        </div>`;
}

function calcularStatusGeral(processo) {
    const etapas = Object.values(processo.etapas || {});
    if (etapas.every(e => e.status === 'concluido')) return 'concluido';
    if (etapas.some(e => e.status === 'em-andamento')) return 'em-andamento';
    return 'pendente';
}

// ===== UTILITÁRIOS =====
function copiarLink(inputId) {
    const input = document.getElementById(inputId);
    input.select();
    navigator.clipboard.writeText(input.value).then(() => showToast('Link copiado! 📋'));
}

function enviarLinksWhatsApp() {
    const links = window._linksParaEnviar || window._linksParaEnviarDetalhe;
    if (!links) return;

    const msg = `Olá! Seu processo de ${links.tipo || 'ato societário'} foi criado.\n\n` +
        `📝 *Preencher dados:* ${links.form}\n` +
        `📊 *Acompanhar status:* ${links.status}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function aplicarFiltro() {
    renderizarPainel();
}

function showToast(msg) {
    const existing = document.querySelector('.success-message');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.className = 'success-message';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}
