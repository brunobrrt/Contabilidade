// ===== VARIÁVEIS GLOBAIS =====
let usuarioLogado = null;
let todosOsSocios = [];
let sociosEmpresa = []; // Sócios da empresa para a conta ativa
let lucrosData = [];
let rendimentosData = [];
let filtroAtual = 'todos'; // Para gerência
let db = null; // Firebase Firestore
// Filtros de data por aba
let filtroLucros  = { de: '', ate: '' };
let filtroRendimentos = { mes: '', ano: '' };
// Meses destravados pela gerência (lista de "YYYY-MM")
let mesesDestravados = [];

// ===== HELPERS DE USUÁRIO =====
// Retorna o identificador primário do usuário logado (CPF ou CNPJ)
function getIdUsuario() {
    return usuarioLogado?.cpf || usuarioLogado?.cnpj || '';
}

// Busca usuário por CPF ou CNPJ
function buscarUsuarioPorDocumento(documento) {
    return todosOsSocios.find(s => s.cpf === documento || s.cnpj === documento);
}

// Busca o usuário logado na lista de sócos
function getUsuarioLogadoCompleto() {
    return todosOsSocios.find(s =>
        (s.cpf && s.cpf === usuarioLogado?.cpf) ||
        (s.cnpj && s.cnpj === usuarioLogado?.cnpj)
    );
}

// ===== INICIALIZAÇÃO =====
window.addEventListener('DOMContentLoaded', async () => {
    mostrarCarregandoFirebase(true);
    try {
        await inicializarFirebase();
    } catch (e) {
        console.warn('Erro na inicialização Firebase:', e.message);
    }
    mostrarCarregandoFirebase(false);
    // Inicializar crypto do sistema (chave fixa, não depende de login)
    if (typeof T7Crypto !== 'undefined') {
        await T7Crypto.initSession('sistema').catch(e => console.warn('Crypto init falhou:', e.message));
    }
    inicializarSistema();
    verificarLogin();
});

// ===== INICIALIZAÇÃO DO SISTEMA =====
function inicializarSistema() {
    carregarTodosOsSocios();
    carregarMesesDestravados();
    
    // Criar usuário admin padrão se não existir (local E Firebase)
    if (todosOsSocios.length === 0) {
        // Verificar se Firebase já tem dados antes de criar admin local
        if (db) {
            db.collection('sistema').doc('usuarios').get().then(async doc => {
                if (doc.exists) {
                    const raw = doc.data();
                    let lista = null;
                    // Dados podem estar criptografados
                    if (raw.__encrypted && typeof T7Crypto !== 'undefined') {
                        try {
                            const decrypted = await T7Crypto.decrypt(raw);
                            lista = decrypted?.lista || null;
                        } catch (e) {
                            console.warn('Erro ao decrypt usuários do Firebase:', e.message);
                        }
                    } else {
                        lista = raw.lista || null;
                    }
                    if (lista && Array.isArray(lista) && lista.length > 0) {
                        // Firebase já tem usuários — salvar localmente e carregar
                        localStorage.setItem('todosOsSocios', JSON.stringify(lista));
                        carregarTodosOsSocios();
                        return;
                    }
                }
                // Firebase vazio — criar admin local
                criarAdminPadrao();
            }).catch(() => {
                // Firebase indisponível — criar admin local
                criarAdminPadrao();
            });
        } else {
            criarAdminPadrao();
        }
    } else {
        // Migrar senhas plaintext para hash (executa uma vez)
        let migrado = false;
        todosOsSocios.forEach(s => {
            if (s.senha && !s.senhaHash) {
                T7Crypto.hashPassword(s.senha).then(hash => {
                    s.senhaHash = hash;
                    delete s.senha;
                    salvarTodosOsSocios();
                });
                migrado = true;
            }
        });
        if (migrado) console.log('Senhas migradas para hash SHA-256');
    }
}

function criarAdminPadrao() {
    const criarComHash = async () => {
        let senhaHash = null;
        if (typeof T7Crypto !== 'undefined') {
            try {
                senhaHash = await T7Crypto.hashPassword('admin123');
            } catch (e) {
                console.warn('Hash não disponível:', e.message);
            }
        }
        const admin = {
            id: Date.now(),
            nome: 'Administrador',
            cpf: '00000000000',
            senha: 'admin123', // fallback plaintext
            role: 'gerencia'
        };
        if (senhaHash) {
            admin.senhaHash = senhaHash;
            delete admin.senha;
        }
        todosOsSocios.push(admin);
        // Salvar apenas no localStorage — Firebase Auth ainda não existe neste ponto
        localStorage.setItem('todosOsSocios', JSON.stringify(todosOsSocios));
        console.log('✅ Usuário administrador padrão criado');
    };
    criarComHash();
}

// ===== FIREBASE =====
function mostrarCarregandoFirebase(show) {
    const el = document.getElementById('firebase-loading');
    if (el) el.style.display = show ? 'flex' : 'none';
}

async function inicializarFirebase() {
    try {
        if (typeof firebase === 'undefined' || !window.firebaseConfig || window.firebaseConfig.apiKey === 'PREENCHA_AQUI') {
            console.warn('Firebase não configurado. Usando apenas localStorage.');
            return;
        }
        firebase.initializeApp(window.firebaseConfig);
        db = firebase.firestore();
        
        // Desabilitar reCAPTCHA Enterprise (novo padrão Firebase, nosso app não precisa)
        try { firebase.auth().settings.appVerificationDisabledForTesting = true; } catch(e) {}
        
        console.log('✅ Firebase inicializado!');
    } catch (e) {
        console.warn('Firebase indisponível, usando dados locais:', e.message);
        db = null;
    }
}

// Login no Firebase Auth com CPF (transparente pro usuário)
// Cada CPF vira um email: cpf@t7system.local
async function firebaseAuthComCPF(cpf, senha, authSenha) {
    if (!db) return false;
    const auth = firebase.auth();
    
    // Limpar sessão inválida (ex: usuário deletado do Console, token expirado)
    if (auth.currentUser) {
        try {
            await auth.signOut();
        } catch (e) {}
    }
    
    // Desabilitar reCAPTCHA (já setado globalmente na inicialização, mas garantir)
    try { auth.settings.appVerificationDisabledForTesting = true; } catch(e) {}
    
    const email = `${cpf}@t7system.local`;
    // Usar senhaHash (estável) como senha do Firebase Auth se disponível
    // Isso evita desync quando a senha local muda
    const senhaAuth = authSenha || senha;

    try {
        // Tentar criar primeiro (funciona no primeiro login)
        await auth.createUserWithEmailAndPassword(email, senhaAuth);
        console.log('🔐 Firebase Auth: usuário criado');
        return true;
    } catch (createErr) {
        if (createErr.code === 'auth/email-already-in-use') {
            // Usuário já existe — fazer signIn
            try {
                await auth.signInWithEmailAndPassword(email, senhaAuth);
                console.log('🔐 Firebase Auth: login realizado');
                return true;
            } catch (signInErr) {
                console.warn('🔑 Erro signIn:', signInErr.code);
                // Hash não bate — deletar usuário antigo e recriar
                try {
                    if (auth.currentUser) await auth.currentUser.delete();
                    await auth.createUserWithEmailAndPassword(email, senhaAuth);
                    console.log('🔐 Firebase Auth: usuário recriado');
                    return true;
                } catch (reErr) {
                    console.warn('Erro ao recriar auth:', reErr.code);
                }
            }
        } else {
            console.warn('Erro ao criar auth:', createErr.code, createErr.message);
        }
        // Fallback: autenticação anônima
        try {
            await auth.signInAnonymously();
            console.log('🔐 Firebase Auth: conectado anonimamente');
            return true;
        } catch (anonErr) {
            return false;
        }
    }
}

async function sincronizarDoFirebase() {
    if (!db) return;
    
    const auth = firebase.auth();
    const user = auth.currentUser;
    if (!user) {
        console.warn('Sem autenticação Firebase — sync pulado');
        return;
    }

    const isGerencia = usuarioLogado && getUsuarioLogadoCompleto()?.role === 'gerencia';
    const cpfAtual = usuarioLogado?.cpf || usuarioLogado?.cnpj;
    const userCpf = user.email ? user.email.split('@')[0] : null;
    const isAnonimo = user.isAnonymous;
    console.log(`🔄 Sync Firebase: auth=${userCpf ? '***' : 'anonimo'}, gerencia=${isGerencia}`);

    try {
        // Carregar lista de usuários (qualquer autenticado pode ler sistema/)
        const usuariosDoc = await db.collection('sistema').doc('usuarios').get();
        if (usuariosDoc.exists) {
            const raw = usuariosDoc.data();
            const lista = raw.__encrypted ? await T7Crypto.decrypt(raw) : (raw.lista || []);
            if (Array.isArray(lista) && lista.length > 0) {
                localStorage.setItem('todosOsSocios', JSON.stringify(lista));
                carregarTodosOsSocios();
            }
        }

        // Meses destravados (qualquer autenticado pode ler sistema/)
        {
            const mesesDoc = await db.collection('sistema').doc('mesesDestravados').get();
            if (mesesDoc.exists) {
                const raw = mesesDoc.data();
                const dados = raw.__encrypted ? await T7Crypto.decrypt(raw) : raw;
                if (dados) localStorage.setItem('mesesDestravados', JSON.stringify(dados.lista || dados || []));
            }
        }

        // ⚠️ Dados de usuários exigem auth REAL (não anônima)
        // As regras Firestore bloqueiam acesso anônimo a dados_usuario/ e socios_empresa/
        if (isAnonimo) {
            console.log('🔄 Sync: auth anônima — pulando dados_usuario/socios_empresa (aguardando login real)');
        } else if (isGerencia) {
            // Gerência carrega dados de todos os clientes
            try {
                const dadosSnap = await db.collection('dados_usuario').get();
                for (const d of dadosSnap.docs) {
                    const raw = d.data();
                    const dados = raw.__encrypted ? await T7Crypto.decrypt(raw) : raw;
                    if (dados) localStorage.setItem(`dados_${d.id}`, JSON.stringify({
                        lucros: dados.lucros || [],
                        rendimentos: dados.rendimentos || []
                    }));
                }
                console.log(`🔄 Sync: ${dadosSnap.size} dados_usuario carregados`);
            } catch (e) { console.warn('Erro ao carregar dados_usuario:', e.message); }
            try {
                const sociosSnap = await db.collection('socios_empresa').get();
                for (const d of sociosSnap.docs) {
                    const raw = d.data();
                    const dados = raw.__encrypted ? await T7Crypto.decrypt(raw) : raw;
                    if (dados) localStorage.setItem(`socios_empresa_${d.id}`, JSON.stringify(dados.lista || []));
                }
                console.log(`🔄 Sync: ${sociosSnap.size} socios_empresa carregados`);
            } catch (e) { console.warn('Erro ao carregar socios_empresa:', e.message); }
        } else if (cpfAtual) {
            // Cliente carrega apenas próprios dados
            try {
                const meuDoc = await db.collection('dados_usuario').doc(cpfAtual).get();
                if (meuDoc.exists) {
                    const raw = meuDoc.data();
                    const dados = raw.__encrypted ? await T7Crypto.decrypt(raw) : raw;
                    if (dados) localStorage.setItem(`dados_${cpfAtual}`, JSON.stringify({
                        lucros: dados.lucros || [],
                        rendimentos: dados.rendimentos || []
                    }));
                    console.log('🔄 Sync: dados_usuario carregados');
                }
            } catch (e) { console.warn('Erro ao carregar dados_usuario:', e.message); }
            try {
                const sociosDoc = await db.collection('socios_empresa').doc(cpfAtual).get();
                if (sociosDoc.exists) {
                    const raw = sociosDoc.data();
                    const dados = raw.__encrypted ? await T7Crypto.decrypt(raw) : raw;
                    if (dados) localStorage.setItem(`socios_empresa_${cpfAtual}`, JSON.stringify(dados.lista || []));
                    console.log('🔄 Sync: socios_empresa carregados');
                }
            } catch (e) { console.warn('Erro ao carregar socios_empresa:', e.message); }
        }
    } catch (e) {
        console.warn('Erro ao sincronizar do Firebase:', e.message);
    }
    carregarMesesDestravados();
    console.log('🔄 Sync Firebase completo');
}

async function syncFirebaseUsuarios() {
    if (!db) return;
    const auth = firebase.auth();
    if (!auth.currentUser) return;
    try {
        // Fazer MERGE em vez de overwrite — evita apagar usuários criados por outro Clawdio
        let usuariosFirebase = [];
        try {
            const doc = await db.collection('sistema').doc('usuarios').get();
            if (doc.exists) {
                const raw = doc.data();
                if (raw.__encrypted) {
                    const decrypted = await T7Crypto.decrypt(raw);
                    usuariosFirebase = decrypted?.lista || [];
                } else {
                    usuariosFirebase = raw.lista || [];
                }
            }
        } catch (e) {
            console.warn('Não foi possível ler usuários do Firebase para merge:', e.message);
        }

        // Merge: cada CPF/CNPJ aparece apenas uma vez, versão mais recente vence
        const mergedMap = new Map();
        // Função auxiliar: identificador único do usuário
        const uid = u => u.cpf || u.cnpj;
        // Primeiro, colocar os do Firebase (base)
        usuariosFirebase.forEach(u => mergedMap.set(uid(u), u));
        // Depois, sobrescrever com os locais (mais recentes)
        todosOsSocios.forEach(u => mergedMap.set(uid(u), u));
        const merged = Array.from(mergedMap.values());

        // Atualizar lista local com o merge (salvar direto no localStorage, sem chamar salvarTodosOsSocios pra evitar loop)
        todosOsSocios = merged;
        localStorage.setItem('todosOsSocios', JSON.stringify(merged));

        const encrypted = await T7Crypto.encrypt({ lista: merged });
        await db.collection('sistema').doc('usuarios').set(encrypted);
        console.log(`✅ Usuários sincronizados (${merged.length} total, merge com ${usuariosFirebase.length} do Firebase)`);
    } catch (e) {
        console.error('❌ Erro ao sincronizar usuários no Firebase:', e.message);
    }
}

async function syncFirebaseDados(cpf, dados) {
    if (!db) return;
    if (!firebase.auth().currentUser) {
        console.warn('⚠️ Sync dados pulado: sem autenticação');
        return;
    }
    // Não sincronizar com auth anônima — espera login real
    if (firebase.auth().currentUser.isAnonymous) {
        console.warn('⚠️ Sync dados pulado: auth anônima (aguardando login real)');
        return;
    }
    const encrypted = await T7Crypto.encrypt(dados);
    await db.collection('dados_usuario').doc(cpf).set(encrypted);
    console.log(`✅ Dados de ${cpf} sincronizados`);
}

async function syncFirebaseSociosEmpresa(cpf, lista) {
    if (!db) return;
    if (!firebase.auth().currentUser) {
        console.warn('⚠️ Sync sócios pulado: sem autenticação');
        return;
    }
    // Não sincronizar com auth anónima
    if (firebase.auth().currentUser.isAnonymous) {
        console.warn('⚠️ Sync sócios pulado: auth anónima (aguardando login real)');
        return;
    }
    const encrypted = await T7Crypto.encrypt({ lista });
    await db.collection('socios_empresa').doc(cpf).set(encrypted);
    console.log(`✅ Sócios de ${cpf} sincronizados`);
}

async function deleteFirebaseDados(cpf) {
    if (!db) return;
    const auth = firebase.auth();
    if (!auth.currentUser || auth.currentUser.isAnonymous) return;
    db.collection('dados_usuario').doc(cpf).delete().catch(console.error);
}

// ===== TRAVAMENTO MENSAL =====
// Cada mês pode ser editado apenas durante o próprio mês.
// Ex: registros de março → editáveis em março, travam dia 1º de abril.
// Gerência pode destravar meses específicos pelo painel admin.

function getMesAtual() {
    const agora = new Date();
    return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
}

function carregarMesesDestravados() {
    const saved = localStorage.getItem('mesesDestravados');
    mesesDestravados = saved ? JSON.parse(saved) : [];
}

function salvarMesesDestravados() {
    localStorage.setItem('mesesDestravados', JSON.stringify(mesesDestravados));
    if (db) db.collection('sistema').doc('mesesDestravados').set({ lista: mesesDestravados }).catch(console.error);
}

// Retorna "YYYY-MM" a partir de uma data "YYYY-MM-DD" ou "YYYY-MM"
function extrairMes(dataStr) {
    if (!dataStr) return '';
    return dataStr.substring(0, 7); // "YYYY-MM"
}

// Verifica se um mês está trancado
// mesStr: "YYYY-MM" ou "YYYY-MM-DD"
function mesEstaTrancado(mesStr) {
    const mes = extrairMes(mesStr);
    if (!mes) return false; // sem data = não trava (deixa o usuário preencher)
    const mesAtual = getMesAtual();
    if (mes >= mesAtual) return false; // mês atual ou futuro → liberado
    // Mês passado → trancado, a menos que gerência destravou (válido para todos os usuários)
    if (mesesDestravados.includes(mes)) return false;
    return true;
}

// Verifica se o usuário pode editar um registro com a data dada
function podeEditarRegistro(dataStr) {
    return !mesEstaTrancado(dataStr);
}

// Verifica se gerência pode destravar um mês (só faz sentido pra mês passado)
function mesPodeSerDestravado(mesStr) {
    const mes = extrairMes(mesStr);
    if (!mes) return false;
    return mes < getMesAtual();
}

// Destravar/travar um mês (toggle, só gerência)
function toggleDestravarMes(mesStr) {
    const userLogado = getUsuarioLogadoCompleto();
    if (userLogado?.role !== 'gerencia') {
        alert('Apenas gerência pode destravar meses!');
        return;
    }
    const mes = extrairMes(mesStr);
    if (!mes) return;
    if (mesesDestravados.includes(mes)) {
        mesesDestravados = mesesDestravados.filter(m => m !== mes);
    } else {
        mesesDestravados.push(mes);
    }
    salvarMesesDestravados();
    renderLucrosTable();
    renderRendimentosTable();
}

// ===== FUNÇÕES DE AUTENTICAÇÃO =====
function verificarLogin() {
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    
    if (usuarioSalvo) {
        usuarioLogado = JSON.parse(usuarioSalvo);
        
        // Garantir compatibilidade: se usuário salvo não tem ID, buscar do todosOsSocios
        if (!usuarioLogado.id || !usuarioLogado.nome) {
            carregarTodosOsSocios();
            const socioCompleto = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf || s.cnpj === usuarioLogado.cnpj);
            if (socioCompleto) {
                usuarioLogado.id = socioCompleto.id;
                usuarioLogado.nome = socioCompleto.nome;
                usuarioLogado.role = socioCompleto.role;
                usuarioLogado.cpf = socioCompleto.cpf || '';
                usuarioLogado.cnpj = socioCompleto.cnpj || '';
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            }
        }
        
        mostrarSistema();

        // Sincronizar com Firebase em background (auto-login não fazia sync!)
        if (db) {
            const auth = firebase.auth();
            if (auth.currentUser) {
                sincronizarDoFirebase().then(() => {
                    carregarTodosOsSocios();
                    carregarDadosParaExibicao();
                    renderLucrosTable();
                    renderRendimentosTable();
                    console.log('🔄 Auto-login: dados sincronizados do Firebase');
                }).catch(e => console.warn('Auto-login sync falhou:', e.message));
            } else {
                // Sem auth — tentar auth anônima e depois sync
                auth.signInAnonymously().then(() => {
                    return sincronizarDoFirebase();
                }).then(() => {
                    carregarTodosOsSocios();
                    carregarDadosParaExibicao();
                    renderLucrosTable();
                    renderRendimentosTable();
                    console.log('🔄 Auto-login: dados sincronizados (auth anônima)');
                }).catch(e => console.warn('Auto-login sync falhou:', e.message));
            }
        }
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
    const socio = todosOsSocios.find(s => s.cpf === usuarioLogado.cpf || s.cnpj === usuarioLogado.cnpj);
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
            roleBadge.textContent = '👔 CLIENTE';
            roleBadge.className = 'role-badge socio';
            document.getElementById('btn-admin').style.display = 'none';
            document.getElementById('btn-ver-usuarios').style.display = 'none';
            document.getElementById('filtro-gerencia').style.display = 'none';
        }
    }
    
    // Carregar sócios da empresa para a conta logada
    carregarSociosEmpresa(getIdUsuario());
    
    carregarDadosParaExibicao();
    initializeTabs();
    renderLucrosTable();
    renderRendimentosTable();
}

async function fazerLogin() {
    try {
        const documento = document.getElementById('login-cpf').value.replace(/\D/g, '');
        const senha = document.getElementById('login-senha').value;
        
        if (!documento || !senha) {
            alert('Por favor, preencha todos os campos!');
            return;
        }

        // Detectar se é CPF (11 dígitos) ou CNPJ (14 dígitos)
        const isCNPJ = documento.length === 14;
        const isCPF = documento.length === 11;

        if (!isCPF && !isCNPJ) {
            alert('Digite um CPF (11 dígitos) ou CNPJ (14 dígitos)!');
            return;
        }

        // Recarregar lista de usuários (pode ter sido atualizada pelo Firebase)
        carregarTodosOsSocios();
        
        // Função auxiliar: buscar usuário por CPF ou CNPJ
        const buscarUsuario = (lista) => {
            if (isCPF) return lista.find(s => s.cpf === documento);
            return lista.find(s => s.cnpj === documento);
        };

        const concluirLogin = async (socio) => {
            if (!socio) {
                alert(isCNPJ ? 'CNPJ não encontrado!' : 'CPF não encontrado!');
                return;
            }

            // Iniciar sessão criptográfica (se disponível)
            if (typeof T7Crypto !== 'undefined') {
                try {
                    await T7Crypto.initSession(senha);
                } catch (e) {
                    console.warn('Crypto não disponível, continuando sem:', e.message);
                }
            }

            // Login no Firebase Auth (se ainda não autenticado)
            // Usa CPF ou CNPJ como identificador do email
            const authId = socio.cpf || socio.cnpj;
            if (db) {
                const auth = firebase.auth();
                // Limpar sessão anônima temporária (usada só pra fetch inicial)
                if (auth.currentUser) {
                    await auth.signOut();
                }
                await firebaseAuthComCPF(authId, senha, socio.senhaHash);
            }

            // Definir usuário logado ANTES do sync (sync precisa saber o role e cpf)
            usuarioLogado = { cpf: socio.cpf || '', cnpj: socio.cnpj || '', role: socio.role, id: socio.id, nome: socio.nome };
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));

            // Sincronizar dados do Firebase
            if (db) {
                await sincronizarDoFirebase();
                await syncFirebaseUsuarios();
                // Recarregar após sync (pode ter atualizado dados)
                carregarTodosOsSocios();
                socio = buscarUsuario(todosOsSocios) || socio;
                // Atualizar usuarioLogado com dados possivelmente atualizados
                usuarioLogado = { cpf: socio.cpf || '', cnpj: socio.cnpj || '', role: socio.role, id: socio.id, nome: socio.nome };
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            }
            
            document.getElementById('login-cpf').value = '';
            document.getElementById('login-senha').value = '';
            
            mostrarSistema();
        };

        const verificarSenhaELogar = (socio) => {
            if (!socio) {
                alert(isCNPJ ? 'CNPJ não encontrado!' : 'CPF não encontrado!');
                return;
            }
            // Verificar senha (hash, plaintext legado, ou fallback)
            if (socio.senhaHash && typeof T7Crypto !== 'undefined') {
                T7Crypto.verifyPassword(senha, socio.senhaHash).then(ok => {
                    if (!ok) { alert('Senha incorreta!'); return; }
                    concluirLogin(socio);
                });
            } else if (socio.senha) {
                if (socio.senha !== senha) { alert('Senha incorreta!'); return; }
                concluirLogin(socio);
            } else {
                alert('Erro: dados de senha não encontrados para este usuário.');
            }
        };

        // Se já tem no localStorage, tenta login direto
        let socio = buscarUsuario(todosOsSocios);
        if (socio) {
            verificarSenhaELogar(socio);
            return;
        }

        // Usuário não está no localStorage — buscar do Firebase
        if (db) {
            // 1. Garantir auth (anônima é suficiente pra ler sistema/usuarios)
            const auth = firebase.auth();
            if (!auth.currentUser) {
                try {
                    await auth.signInAnonymously();
                    console.log('🔐 Auth anônima para buscar usuários');
                } catch (e) {
                    console.error('Erro auth anônima:', e.message);
                    alert('Erro ao conectar com o servidor. Tente novamente.');
                    return;
                }
            }

            // 2. Iniciar sessão crypto com chave do sistema (pra descriptografar lista de usuários)
            if (typeof T7Crypto !== 'undefined') {
                try { await T7Crypto.initSession('sistema'); } catch (e) {
                    console.warn('Crypto init falhou:', e.message);
                }
            }

            // 3. Buscar e descriptografar lista de usuários do Firebase
            let encontrouNoFirebase = false;
            try {
                const doc = await db.collection('sistema').doc('usuarios').get();
                if (doc.exists) {
                    const raw = doc.data();
                    let lista = null;
                    if (raw.__encrypted && typeof T7Crypto !== 'undefined') {
                        const decrypted = await T7Crypto.decrypt(raw);
                        lista = decrypted?.lista || null;
                        if (!lista) console.warn('⚠️ Descriptografia retornou null — dados podem estar corrompidos');
                    } else {
                        lista = raw.lista || null;
                    }
                    if (lista && Array.isArray(lista) && lista.length > 0) {
                        localStorage.setItem('todosOsSocios', JSON.stringify(lista));
                        carregarTodosOsSocios();
                        encontrouNoFirebase = true;
                        console.log(`📥 ${lista.length} usuários carregados do Firebase`);
                    } else {
                        console.warn('⚠️ Lista de usuários vazia ou inválida no Firebase');
                    }
                } else {
                    console.warn('⚠️ Documento sistema/usuarios não existe no Firestore');
                }
            } catch (e) {
                console.error('❌ Erro ao buscar usuários do Firebase:', e.message);
            }

            // 4. Verificar se usuário existe agora
            socio = buscarUsuario(todosOsSocios);
            if (!socio) {
                if (encontrouNoFirebase) {
                    alert(isCNPJ ? 'CNPJ não encontrado no sistema!' : 'CPF não encontrado no sistema!');
                } else {
                    alert('Não foi possível carregar os dados do servidor. Verifique sua conexão.');
                }
                return;
            }
            verificarSenhaELogar(socio);
        } else {
            alert('Documento não encontrado nos dados locais e servidor indisponível.');
        }
    } catch (e) {
        console.error('Erro no login:', e);
        alert('Erro ao fazer login: ' + e.message);
    }
}

// Sincronização manual (botão "Sincronizar")
async function sincronizarManual() {
    if (!db) {
        alert('Firebase não disponível.');
        return;
    }
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Sincronizando...';
    try {
        // Garantir auth
        const auth = firebase.auth();
        if (!auth.currentUser) {
            await auth.signInAnonymously();
        }
        await sincronizarDoFirebase();
        carregarTodosOsSocios();
        carregarDadosParaExibicao();
        renderLucrosTable();
        renderRendimentosTable();
        if (typeof carregarFiltroSocios === 'function') carregarFiltroSocios();
        btn.textContent = '✅ Sincronizado!';
        setTimeout(() => { btn.textContent = '🔄 Sincronizar'; btn.disabled = false; }, 2000);
    } catch (e) {
        console.error('Erro na sincronização manual:', e);
        btn.textContent = '❌ Erro';
        setTimeout(() => { btn.textContent = '🔄 Sincronizar'; btn.disabled = false; }, 2000);
    }
}

function fazerLogout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('usuarioLogado');
        usuarioLogado = null;
        lucrosData = [];
        rendimentosData = [];
        filtroAtual = 'todos';
        T7Crypto.clearSession(); // Limpar chave de criptografia da memória
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
    syncFirebaseUsuarios();
}

// ===== FUNÇÕES DE SÓCIOS DA EMPRESA =====
function getCPFParaSociosEmpresa() {
    const userLogado = getUsuarioLogadoCompleto();
    if (userLogado && userLogado.role === 'gerencia' && filtroAtual !== 'todos') {
        return filtroAtual;
    }
    return getIdUsuario();
}

function carregarSociosEmpresa(cpf) {
    const saved = localStorage.getItem(`socios_empresa_${cpf}`);
    sociosEmpresa = saved ? JSON.parse(saved) : [];
}

function salvarSociosEmpresa() {
    const cpf = getCPFParaSociosEmpresa();
    localStorage.setItem(`socios_empresa_${cpf}`, JSON.stringify(sociosEmpresa));
    syncFirebaseSociosEmpresa(cpf, sociosEmpresa);
}

function abrirModalSociosEmpresa() {
    const cpf = getCPFParaSociosEmpresa();
    carregarSociosEmpresa(cpf);

    // Atualizar título do modal
    const conta = todosOsSocios.find(s => s.cpf === cpf);
    const userLogado = getUsuarioLogadoCompleto();
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
    document.getElementById('socios-nome').value = '';
    document.getElementById('socios-cpf').value = '';
    document.getElementById('socios-cnpj').value = '';
    document.getElementById('socios-senha').value = '';
    document.getElementById('socios-role').value = 'cliente';
}

function criarUsuarioNoModalSocios() {
    const nome = document.getElementById('socios-nome').value.trim();
    const cpf = document.getElementById('socios-cpf').value.replace(/\D/g, '');
    const cnpj = document.getElementById('socios-cnpj').value.replace(/\D/g, '');
    const senha = document.getElementById('socios-senha').value;
    const role = document.getElementById('socios-role').value;

    if (!nome || !senha) {
        alert('Por favor, preencha o nome e a senha!');
        return;
    }
    if (!cpf && !cnpj) {
        alert('Informe pelo menos um CPF ou CNPJ!');
        return;
    }
    if (cpf && cpf.length !== 11) {
        alert('CPF deve ter 11 dígitos!');
        return;
    }
    if (cnpj && cnpj.length !== 14) {
        alert('CNPJ deve ter 14 dígitos!');
        return;
    }
    if (senha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres!');
        return;
    }
    if (cpf && todosOsSocios.some(s => s.cpf === cpf)) {
        alert('Este CPF já está cadastrado!');
        return;
    }
    if (cnpj && todosOsSocios.some(s => s.cnpj === cnpj)) {
        alert('Este CNPJ já está cadastrado!');
        return;
    }

    T7Crypto.hashPassword(senha).then(senhaHash => {
        const novoUsuario = {
            id: Date.now(),
            nome: nome,
            cpf: cpf || null,
            cnpj: cnpj || null,
            senhaHash: senhaHash,
            role: role
        };

        todosOsSocios.push(novoUsuario);
        salvarTodosOsSocios();

        document.getElementById('socios-nome').value = '';
        document.getElementById('socios-cpf').value = '';
        document.getElementById('socios-cnpj').value = '';
        document.getElementById('socios-senha').value = '';
        document.getElementById('socios-role').value = 'cliente';

        renderSociosTable();
        carregarFiltroSocios();
        showSuccessMessage('Usuário criado com sucesso!');
    });
}

function renderSociosTable() {
    const tbody = document.getElementById('socios-tbody');
    tbody.innerHTML = '';
    
    todosOsSocios.forEach(socio => {
        const row = document.createElement('tr');
        const roleText = socio.role === 'gerencia' ? '⭐ Gerência' : '👔 Cliente';
        const isYou = ((socio.cpf && socio.cpf === usuarioLogado.cpf) || (socio.cnpj && socio.cnpj === usuarioLogado.cnpj)) ? '<span style="color: #28a745;"> (Você)</span>' : '';
        
        const docs = [];
        if (socio.cpf) docs.push(formatarCPFExibicao(socio.cpf));
        if (socio.cnpj) docs.push(formatarCNPJExibicao(socio.cnpj));

        row.innerHTML = `
            <td>${socio.nome}${isYou}</td>
            <td>${docs.join(' / ') || '-'}</td>
            <td>${roleText}</td>
        `;
        tbody.appendChild(row);
    });
}

// ===== FUNÇÕES DE ADMINISTRAÇÃO =====
function abrirPainelAdmin() {
    const userLogado = getUsuarioLogadoCompleto();
    if (userLogado.role !== 'gerencia') {
        alert('Acesso negado!');
        return;
    }
    
    document.getElementById('modal-admin').style.display = 'flex';
    renderAdminUsersTable();
    renderMesesDestravados();
}

function fecharPainelAdmin() {
    document.getElementById('modal-admin').style.display = 'none';
    // Limpar campos
    document.getElementById('admin-nome').value = '';
    document.getElementById('admin-cpf').value = '';
    document.getElementById('admin-cnpj').value = '';
    document.getElementById('admin-senha').value = '';
    document.getElementById('admin-role').value = 'cliente';
}

function criarNovoUsuario() {
    const nome = document.getElementById('admin-nome').value.trim();
    const cpf = document.getElementById('admin-cpf').value.replace(/\D/g, '');
    const cnpj = document.getElementById('admin-cnpj').value.replace(/\D/g, '');
    const senha = document.getElementById('admin-senha').value;
    const role = document.getElementById('admin-role').value;
    
    if (!nome || !senha) {
        alert('Por favor, preencha o nome e a senha!');
        return;
    }

    // Deve ter CPF ou CNPJ (ou ambos)
    if (!cpf && !cnpj) {
        alert('Informe pelo menos um CPF ou CNPJ!');
        return;
    }
    
    if (cpf && cpf.length !== 11) {
        alert('CPF deve ter 11 dígitos!');
        return;
    }

    if (cnpj && cnpj.length !== 14) {
        alert('CNPJ deve ter 14 dígitos!');
        return;
    }
    
    if (senha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres!');
        return;
    }
    
    // Verificar se CPF/CNPJ já existe
    if (cpf && todosOsSocios.some(s => s.cpf === cpf)) {
        alert('Este CPF já está cadastrado!');
        return;
    }
    if (cnpj && todosOsSocios.some(s => s.cnpj === cnpj)) {
        alert('Este CNPJ já está cadastrado!');
        return;
    }
    
    // Adicionar novo usuário (com hash de senha)
    T7Crypto.hashPassword(senha).then(senhaHash => {
        const novoUsuario = {
            id: Date.now(),
            nome: nome,
            cpf: cpf || null,
            cnpj: cnpj || null,
            senhaHash: senhaHash,
            role: role
        };
        
        todosOsSocios.push(novoUsuario);
        salvarTodosOsSocios();
        
        // Limpar campos
        document.getElementById('admin-nome').value = '';
        document.getElementById('admin-cpf').value = '';
        document.getElementById('admin-cnpj').value = '';
        document.getElementById('admin-senha').value = '';
        document.getElementById('admin-role').value = 'cliente';
        
        renderAdminUsersTable();
        carregarFiltroSocios();
        showSuccessMessage('Usuário criado com sucesso!');
    });
}

// ===== GERENCIAR MESES TRAVADOS =====
function renderMesesDestravados() {
    const container = document.getElementById('meses-destravados-lista');
    if (!container) return;

    const agora = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
    const mesesNomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

    // Gerar últimos 12 meses (incluindo atual)
    const mesesDisponiveis = [];
    for (let i = 12; i >= 1; i--) {
        const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        const mesStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (mesStr < mesAtual) { // Apenas meses passados
            mesesDisponiveis.push({
                valor: mesStr,
                label: `${mesesNomes[d.getMonth()]} de ${d.getFullYear()}`,
                destravado: mesesDestravados.includes(mesStr)
            });
        }
    }

    if (mesesDisponiveis.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light); font-size: 0.85rem;">Nenhum mês anterior disponível para destravar.</p>';
        return;
    }

    let html = '<div class="meses-grid">';
    mesesDisponiveis.forEach(m => {
        const cor = m.destravado ? '#28a745' : '#dc3545';
        const texto = m.destravado ? '🔓 Editável' : '🔒 Travado';
        const btnTexto = m.destravado ? '🔒 Travar' : '🔓 Destravar';
        const btnClass = m.destravado ? 'btn-warning' : 'btn-success';
        html += `
            <div class="mes-item">
                <div class="mes-info">
                    <span class="mes-label">${m.label}</span>
                    <span class="mes-status" style="color: ${cor};">${texto}</span>
                </div>
                <button class="btn btn-small ${btnClass}" onclick="toggleDestravarMes('${m.valor}'); renderMesesDestravados(); renderLucrosTable(); renderRendimentosTable();">${btnTexto}</button>
            </div>`;
    });
    html += '</div>';

    if (mesesDestravados.length > 0) {
        html += `<div style="margin-top: 12px;"><button class="btn btn-small btn-danger" onclick="travarTodosMeses()">🔒 Travar Todos os Meses</button></div>`;
    }

    container.innerHTML = html;
}

function travarTodosMeses() {
    if (!confirm('Deseja travar TODOS os meses destravados? Os registros voltarão a ficar somente leitura.')) return;
    mesesDestravados = [];
    salvarMesesDestravados();
    renderMesesDestravados();
    renderLucrosTable();
    renderRendimentosTable();
    showSuccessMessage('Todos os meses foram travados!');
}

function renderAdminUsersTable() {
    const tbody = document.getElementById('admin-users-tbody');
    tbody.innerHTML = '';
    
    todosOsSocios.forEach(socio => {
        const row = document.createElement('tr');
        const roleText = socio.role === 'gerencia' ? '⭐ Gerência' : '👔 Cliente';
        const isYou = (socio.cpf && socio.cpf === usuarioLogado.cpf) || (socio.cnpj && socio.cnpj === usuarioLogado.cnpj);
        
        // Montar exibição do documento (CPF, CNPJ ou ambos)
        const docs = [];
        if (socio.cpf) docs.push(formatarCPFExibicao(socio.cpf));
        if (socio.cnpj) docs.push(formatarCNPJExibicao(socio.cnpj));
        const docText = docs.join(' / ') || '-';

        row.innerHTML = `
            <td>${socio.nome}${isYou ? ' <span style="color: #28a745;">(Você)</span>' : ''}</td>
            <td>${docText}</td>
            <td>${roleText}</td>
            <td class="td-actions">
                ${!isYou
                    ? `<button class="btn btn-edit btn-small" onclick="abrirModalEditarUsuario('${socio.cpf || socio.cnpj}')">✏️ Editar</button>
                       <button class="btn btn-delete btn-small" onclick="excluirUsuario('${socio.cpf || socio.cnpj}')">🗑️ Excluir</button>`
                    : '<span style="color: #6c757d;">-</span>'}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function excluirUsuario(documento) {
    if (!confirm('Deseja realmente excluir este usuário? Todos os dados dele serão perdidos!')) {
        return;
    }
    
    // Encontrar o usuário (pode ser CPF ou CNPJ)
    const socio = todosOsSocios.find(s => s.cpf === documento || s.cnpj === documento);
    if (!socio) return;
    
    const docId = socio.cpf || socio.cnpj;
    
    // Remover usuário
    todosOsSocios = todosOsSocios.filter(s => s.id !== socio.id);
    salvarTodosOsSocios();
    
    // Remover dados do usuário
    localStorage.removeItem(`dados_${docId}`);
    deleteFirebaseDados(docId);

    renderAdminUsersTable();
    carregarFiltroSocios();
    showSuccessMessage('Usuário excluído com sucesso!');
}

// ===== FUNÇÕES DE EDIÇÃO DE USUÁRIO =====
function abrirModalEditarUsuario(documento) {
    const socio = todosOsSocios.find(s => s.cpf === documento || s.cnpj === documento);
    if (!socio) return;

    const docId = socio.cpf || socio.cnpj;
    document.getElementById('edit-user-cpf-original').value = docId;
    document.getElementById('edit-user-nome').value = socio.nome;
    document.getElementById('edit-user-cpf').value = socio.cpf || '';
    document.getElementById('edit-user-cnpj').value = socio.cnpj || '';
    document.getElementById('edit-user-role').value = socio.role;
    document.getElementById('edit-user-senha').value = '';

    const docs = [];
    if (socio.cpf) docs.push(formatarCPFExibicao(socio.cpf));
    if (socio.cnpj) docs.push(formatarCNPJExibicao(socio.cnpj));
    document.getElementById('edit-user-subtitle').textContent = `Editando: ${socio.nome} — ${docs.join(' / ')}`;

    document.getElementById('modal-editar-usuario').style.display = 'flex';
}

function fecharModalEditarUsuario() {
    document.getElementById('modal-editar-usuario').style.display = 'none';
    document.getElementById('edit-user-nome').value = '';
    document.getElementById('edit-user-cpf').value = '';
    document.getElementById('edit-user-cnpj').value = '';
    document.getElementById('edit-user-senha').value = '';
    document.getElementById('edit-user-cpf-original').value = '';
}

function salvarEdicaoUsuario() {
    const docOriginal = document.getElementById('edit-user-cpf-original').value;
    const novoNome = document.getElementById('edit-user-nome').value.trim();
    const novoCpf = document.getElementById('edit-user-cpf').value.replace(/\D/g, '');
    const novoCnpj = document.getElementById('edit-user-cnpj').value.replace(/\D/g, '');
    const novoRole = document.getElementById('edit-user-role').value;
    const novaSenha = document.getElementById('edit-user-senha').value;

    if (!novoNome) { alert('O nome é obrigatório!'); return; }
    if (!novoCpf && !novoCnpj) { alert('Informe pelo menos um CPF ou CNPJ!'); return; }
    if (novoCpf && novoCpf.length !== 11) { alert('CPF inválido! Deve ter 11 dígitos.'); return; }
    if (novoCnpj && novoCnpj.length !== 14) { alert('CNPJ inválido! Deve ter 14 dígitos.'); return; }

    // Verificar duplicados (apenas se mudou)
    if (novoCpf && todosOsSocios.some(s => s.cpf === novoCpf && s.cpf !== docOriginal)) {
        alert('Este CPF já está em uso por outro usuário!');
        return;
    }
    if (novoCnpj && todosOsSocios.some(s => s.cnpj === novoCnpj && s.cnpj !== docOriginal)) {
        alert('Este CNPJ já está em uso por outro usuário!');
        return;
    }

    // Encontrar o usuário original (pode ser CPF ou CNPJ)
    const idx = todosOsSocios.findIndex(s => s.cpf === docOriginal || s.cnpj === docOriginal);
    if (idx === -1) { alert('Usuário não encontrado!'); return; }

    const idOriginal = todosOsSocios[idx].cpf || todosOsSocios[idx].cnpj;
    const novoId = novoCpf || novoCnpj;

    // Migrar dados do localStorage se o identificador mudou
    if (novoId !== idOriginal) {
        const dadosAntigos = localStorage.getItem(`dados_${idOriginal}`);
        if (dadosAntigos) {
            localStorage.setItem(`dados_${novoId}`, dadosAntigos);
            localStorage.removeItem(`dados_${idOriginal}`);
            syncFirebaseDados(novoId, JSON.parse(dadosAntigos));
            deleteFirebaseDados(idOriginal);
        }
        const sociosEmpresaAntigos = localStorage.getItem(`socios_empresa_${idOriginal}`);
        if (sociosEmpresaAntigos) {
            localStorage.setItem(`socios_empresa_${novoId}`, sociosEmpresaAntigos);
            localStorage.removeItem(`socios_empresa_${idOriginal}`);
            syncFirebaseSociosEmpresa(novoId, JSON.parse(sociosEmpresaAntigos));
            if (db) db.collection('socios_empresa').doc(idOriginal).delete().catch(console.error);
        }
    }

    todosOsSocios[idx].nome = novoNome;
    todosOsSocios[idx].cpf = novoCpf || null;
    todosOsSocios[idx].cnpj = novoCnpj || null;
    todosOsSocios[idx].role = novoRole;

    const finalizar = () => {
        salvarTodosOsSocios();
        fecharModalEditarUsuario();
        renderAdminUsersTable();
        carregarFiltroSocios();
        showSuccessMessage(`Usuário "${novoNome}" atualizado com sucesso!`);
    };

    if (novaSenha) {
        T7Crypto.hashPassword(novaSenha).then(hash => {
            todosOsSocios[idx].senhaHash = hash;
            delete todosOsSocios[idx].senha; // Remover plaintext legado
            finalizar();
        });
    } else {
        finalizar();
    }
}

// ===== FUNÇÕES DE FILTRO (GERÊNCIA) =====
function carregarFiltroSocios() {
    const select = document.getElementById('filtro-socio');
    select.innerHTML = '<option value="todos">Todos os Clientes</option>';
    
    todosOsSocios.forEach(socio => {
        if (socio.role === 'cliente') { // Apenas clientes, não gerência
            const option = document.createElement('option');
            option.value = socio.cpf || socio.cnpj;
            const docs = [];
            if (socio.cpf) docs.push(formatarCPFExibicao(socio.cpf));
            if (socio.cnpj) docs.push(formatarCNPJExibicao(socio.cnpj));
            option.textContent = `${socio.nome} (${docs.join(' / ')})`;
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
    // Mostrar/ocultar botão de exportar empresa selecionada
    const btnExportarEmpresa = document.getElementById('btn-exportar-empresa');
    if (btnExportarEmpresa) {
        btnExportarEmpresa.style.display = filtroAtual !== 'todos' ? 'inline-block' : 'none';
    }
}

// ===== CARREGAMENTO DE DADOS BASEADO EM ROLE =====
function carregarDadosParaExibicao() {
    const userLogado = getUsuarioLogadoCompleto();
    
    if (userLogado.role === 'gerencia') {
        // Gerência vê tudo ou filtrado
        if (filtroAtual === 'todos') {
            carregarTodosOsDados();
        } else {
            carregarDadosDeUsuario(filtroAtual);
        }
    } else {
        // Sócio vê apenas próprios dados
        carregarDadosDeUsuario(getIdUsuario());
    }
}

function carregarTodosOsDados() {
    lucrosData = [];
    rendimentosData = [];
    
    // Carregar dados de todos os sócios
    todosOsSocios.forEach(socio => {
        if (socio.role === 'cliente') {
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
        rendimentosData = (dadosParseados.rendimentos || []).map(normalizarRendimento);
        
        // Adicionar proprietário para gerência
        lucrosData = lucrosData.map(item => ({ ...item, proprietarioCpf: cpf }));
        rendimentosData = rendimentosData.map(item => ({ ...item, proprietarioCpf: cpf }));
    } else {
        lucrosData = [];
        rendimentosData = [];
    }
}

// Normaliza rendimentos do formato antigo (data) para o novo (mes)
function normalizarRendimento(item) {
    const r = { ...item };
    
    // Formato antigo: tinha campo "data" (YYYY-MM-DD) em vez de "mes" (YYYY-MM)
    if (r.data && !r.mes) {
        r.mes = r.data.substring(0, 7); // "2026-03-15" → "2026-03"
        delete r.data;
    }
    
    // Formato antigo: campo "valor" em vez de "valorRendimento"
    if (r.valor !== undefined && r.valorRendimento === undefined) {
        r.valorRendimento = r.valor;
        delete r.valor;
    }
    
    // Garantir campos obrigatórios
    r.mes = r.mes || '';
    r.banco = r.banco || '';
    r.valorRendimento = r.valorRendimento || 0;
    r.irRetido = r.irRetido || 0;
    r.observacoes = r.observacoes || '';
    
    return r;
}

function salvarDadosDoUsuario(cpfUsuario = null) {
    const userLogado = getUsuarioLogadoCompleto();
    
    // Se for sócio, sempre salva nos próprios dados
    if (userLogado.role === 'cliente') {
        const chave = `dados_${getIdUsuario()}`;
        const dados = {
            lucros: lucrosData.map(({ proprietarioCpf, ...rest }) => rest),
            rendimentos: rendimentosData.map(({ proprietarioCpf, ...rest }) => rest)
        };
        localStorage.setItem(chave, JSON.stringify(dados));
        syncFirebaseDados(getIdUsuario(), dados);
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
            syncFirebaseDados(filtroAtual, dados);
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
        syncFirebaseDados(cpf, dados);
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
    const userLogado = getUsuarioLogadoCompleto();
    const cpfProprietario = userLogado.role === 'cliente' ? getIdUsuario() : filtroAtual;
    
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
    const item = lucrosData.find(l => l.id === id);
    if (item && item.data && !podeEditarRegistro(item.data)) {
        alert('🔒 Este registro pertence a um mês trancado! Não é possível excluir.\n\nApenas gerência pode destravar meses pelo painel de Administração.');
        return;
    }
    if (confirm('Deseja realmente excluir este registro?')) {
        lucrosData = lucrosData.filter(item => item.id !== id);
        renderLucrosTable();
        salvarDadosDoUsuario();
        showSuccessMessage('Registro excluído com sucesso!');
    }
}

function updateLucroData(id, field, value) {
    const item = lucrosData.find(l => l.id === id);
    if (!item) return;

    // Verificar travamento mensal (exceto gerência com acesso)
    if (field === 'data' || field === 'valor' || field === 'socioBeneficiario' || field === 'descricao' || field === 'observacoes') {
        // Se o campo é data, verificar a NOVA data; senão, verificar a data atual do registro
        const dataParaVerificar = field === 'data' ? value : item.data;
        if (dataParaVerificar && !podeEditarRegistro(dataParaVerificar)) {
            alert('🔒 Este registro pertence a um mês trancado! Não é possível editar.\n\nApenas gerência pode destravar meses pelo painel de Administração.');
            renderLucrosTable(); // Re-render para restaurar o valor original
            return;
        }
    }

    if (field === 'valor') {
        item[field] = parseFloat(value) || 0;
    } else {
        item[field] = value;
    }
    salvarDadosDoUsuario();
    updateLucrosTotal();
}

function aplicarFiltroLucros() {
    filtroLucros.de  = document.getElementById('filtro-lucros-de').value;
    filtroLucros.ate = document.getElementById('filtro-lucros-ate').value;
    renderLucrosTable();
}

function limparFiltroLucros() {
    filtroLucros = { de: '', ate: '' };
    document.getElementById('filtro-lucros-de').value = '';
    document.getElementById('filtro-lucros-ate').value = '';
    renderLucrosTable();
}

function renderLucrosTable() {
    const tbody = document.getElementById('lucros-tbody');
    tbody.innerHTML = '';
    
    const userLogado = getUsuarioLogadoCompleto();
    const isGerencia = userLogado.role === 'gerencia';
    const podeEditarGeral = !isGerencia || filtroAtual !== 'todos';

    // Aplicar filtro de período
    let dados = lucrosData;
    if (filtroLucros.de)  dados = dados.filter(i => i.data && i.data >= filtroLucros.de);
    if (filtroLucros.ate) dados = dados.filter(i => i.data && i.data <= filtroLucros.ate);
    
    if (dados.length === 0 && podeEditarGeral) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-table-msg">
            <div class="empty-row-hint">📋 Nenhum registro encontrado. ${lucrosData.length === 0 ? 'Clique em <strong>➕ Adicionar Registro</strong> para começar.' : 'Tente ajustar o filtro de data.'}</div>
        </td></tr>`;
        updateLucrosTotalFiltrado(dados);
        return;
    }

    dados.forEach(item => {
        const row = document.createElement('tr');
        const trancado = item.data && mesEstaTrancado(item.data);
        const podeEditar = podeEditarGeral && !trancado;

        // Classe visual para linha trancada
        if (trancado) row.classList.add('row-trancado');
        
        const nomeBeneficiario = getNomeSocioBeneficiario(item);
        
        // Determinar como mostrar o campo Sócio Beneficiário
        let socioBeneficiarioHTML = '';
        
        if (podeEditar) {
            // Carregar sócios da empresa para a conta em questão
            const cpfConta = userLogado.role === 'cliente' ? getIdUsuario() : filtroAtual;
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
            // Modo somente leitura (gerência visualizando todos ou mês trancado)
            socioBeneficiarioHTML = `<span class="socio-beneficiario-text">${nomeBeneficiario || '-'}</span>`;
        }
        
        const proprietario = isGerencia && filtroAtual === 'todos' 
            ? todosOsSocios.find(s => s.cpf === item.proprietarioCpf) 
            : null;
        
        const proprietarioInfo = proprietario ? `<br><small style="color: #6c757d;">Registrado por: ${proprietario.nome}</small>` : '';
        
        // Indicador de travamento
        const lockBadge = trancado ? `<span class="badge-trancado" title="Mês trancado — edite o mês atual ou peça à gerência para destravar">🔒</span>` : '';
        
        row.innerHTML = `
            <td>${podeEditar
                ? `<div class="date-input-wrapper">
                    <input type="text" value="${item.data ? formatarDataBR(item.data) : ''}" placeholder="DD/MM/AAAA" maxlength="10" class="input-data-br" oninput="mascaraData(this)" onchange="updateLucroData(${item.id}, 'data', converterDataParaISO(this.value))">
                    <span class="btn-calendar-wrap" title="Abrir calendário">
                        <span class="btn-calendar-icon">📅</span>
                        <input type="date" class="input-date-hidden" value="${item.data || ''}" onchange="selecionarData(this)">
                    </span>
                  </div>`
                : `<span class="date-display">${formatarDataBR(item.data)} ${lockBadge}</span>`
            }</td>
            <td>
                ${socioBeneficiarioHTML}
            </td>
            <td><input type="text" value="${item.descricao}" ${podeEditar ? '' : 'disabled'} placeholder="Descrição (opcional)" onchange="updateLucroData(${item.id}, 'descricao', this.value)">${proprietarioInfo}</td>
            <td><input type="number" step="0.01" value="${item.valor}" ${podeEditar ? '' : 'disabled'} placeholder="0.00" onchange="updateLucroData(${item.id}, 'valor', this.value)"></td>
            <td><input type="text" value="${item.observacoes}" ${podeEditar ? '' : 'disabled'} placeholder="Observações (opcional)" onchange="updateLucroData(${item.id}, 'observacoes', this.value)"></td>
            <td>${podeEditar
                ? `<button class="btn btn-delete" onclick="deleteLucroRow(${item.id})">🗑️ Excluir</button>`
                : trancado
                    ? `<button class="btn btn-locked" disabled title="Mês trancado">🔒</button>`
                    : '-'
            }</td>
        `;
        tbody.appendChild(row);
    });
    
    updateLucrosTotal();
    
    // Mostrar/ocultar alerta de mês trancado
    const alertaLucros = document.getElementById('alerta-lucros-trancado');
    if (alertaLucros) {
        const temTrancado = dados.some(item => item.data && mesEstaTrancado(item.data));
        alertaLucros.style.display = temTrancado ? 'flex' : 'none';
    }
}

function updateLucrosTotal() {
    // Respeita o filtro de período ativo
    let dados = lucrosData;
    if (filtroLucros.de)  dados = dados.filter(i => i.data && i.data >= filtroLucros.de);
    if (filtroLucros.ate) dados = dados.filter(i => i.data && i.data <= filtroLucros.ate);
    const total = dados.reduce((sum, item) => sum + (item.valor || 0), 0);
    document.getElementById('lucros-total').textContent = formatCurrency(total);
}

function updateLucrosTotalFiltrado(dados) {
    const total = dados.reduce((sum, item) => sum + (item.valor || 0), 0);
    document.getElementById('lucros-total').textContent = formatCurrency(total);
}

// ===== FUNÇÕES DE RENDIMENTOS =====
function addRendimentoRow() {
    const userLogado = getUsuarioLogadoCompleto();
    const cpfProprietario = userLogado.role === 'cliente' ? getIdUsuario() : filtroAtual;
    
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
    const item = rendimentosData.find(r => r.id === id);
    if (item && item.mes && !podeEditarRegistro(item.mes)) {
        alert('🔒 Este registro pertence a um mês trancado! Não é possível excluir.\n\nApenas gerência pode destravar meses pelo painel de Administração.');
        return;
    }
    if (confirm('Deseja realmente excluir este registro?')) {
        rendimentosData = rendimentosData.filter(item => item.id !== id);
        renderRendimentosTable();
        salvarDadosDoUsuario();
        showSuccessMessage('Registro excluído com sucesso!');
    }
}

function updateRendimentoData(id, field, value) {
    const item = rendimentosData.find(r => r.id === id);
    if (!item) return;

    // Verificar travamento mensal
    if (item.mes && !podeEditarRegistro(item.mes)) {
        alert('🔒 Este registro pertence a um mês trancado! Não é possível editar.\n\nApenas gerência pode destravar meses pelo painel de Administração.');
        renderRendimentosTable();
        return;
    }

    if (field === 'valorRendimento' || field === 'irRetido') {
        item[field] = parseFloat(value) || 0;
    } else {
        item[field] = value;
    }
    salvarDadosDoUsuario();
    updateRendimentosTotal();
}

function updateRendimentoMes(id, type, value) {
    const item = rendimentosData.find(r => r.id === id);
    if (!item) return;

    // Verificar travamento mensal antes de alterar
    if (item.mes && !podeEditarRegistro(item.mes)) {
        alert('🔒 Este registro pertence a um mês trancado! Não é possível editar.\n\nApenas gerência pode destravar meses pelo painel de Administração.');
        renderRendimentosTable();
        return;
    }

    let year = '', month = '';
    if (item.mes && item.mes.includes('-')) {
        const parts = item.mes.split('-');
        year = parts[0] || '';
        month = parts[1] || '';
    }
    if (type === 'mes') month = value;
    if (type === 'ano') year = value;

    // Se selecionou mês mas não ano, assume ano atual
    if (month && !year) {
        year = String(new Date().getFullYear());
    }
    // Salvar apenas se tiver mês selecionado
    item.mes = (year && month) ? `${year}-${month}` : '';
    salvarDadosDoUsuario();
    updateRendimentosTotal();
}

function aplicarFiltroRendimentos() {
    filtroRendimentos.mes = document.getElementById('filtro-rend-mes').value;
    filtroRendimentos.ano = document.getElementById('filtro-rend-ano').value;
    renderRendimentosTable();
}

function limparFiltroRendimentos() {
    filtroRendimentos = { mes: '', ano: '' };
    document.getElementById('filtro-rend-mes').value = '';
    document.getElementById('filtro-rend-ano').value = '';
    renderRendimentosTable();
}

function renderRendimentosTable() {
    const tbody = document.getElementById('rendimentos-tbody');
    tbody.innerHTML = '';
    
    const userLogado = getUsuarioLogadoCompleto();
    const isGerencia = userLogado.role === 'gerencia';
    // Admin sempre pode editar/excluir; sócio também (dados próprios)
    const podeEditarGeral = true;

    // Aplicar filtro de mês/ano
    let dados = rendimentosData;
    if (filtroRendimentos.ano) dados = dados.filter(i => i.mes && i.mes.startsWith(filtroRendimentos.ano));
    if (filtroRendimentos.mes) dados = dados.filter(i => i.mes && i.mes.split('-')[1] === filtroRendimentos.mes);
    
    if (dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-table-msg">
            <div class="empty-row-hint">📋 Nenhum registro encontrado. ${rendimentosData.length === 0 ? 'Clique em <strong>➕ Adicionar Registro</strong> para começar.' : 'Tente ajustar o filtro.'}</div>
        </td></tr>`;
        updateRendimentosTotalFiltrado(dados);
        return;
    }

    const mesesNomes = [
        ['01','Janeiro'],['02','Fevereiro'],['03','Março'],['04','Abril'],
        ['05','Maio'],['06','Junho'],['07','Julho'],['08','Agosto'],
        ['09','Setembro'],['10','Outubro'],['11','Novembro'],['12','Dezembro']
    ];
    const anosPreDef = [2018,2019,2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030];

    dados.forEach(item => {
        const row = document.createElement('tr');
        const trancado = item.mes && mesEstaTrancado(item.mes);
        const podeEditar = podeEditarGeral && !trancado;

        // Classe visual para linha trancada
        if (trancado) row.classList.add('row-trancado');
        
        const proprietario = isGerencia && filtroAtual === 'todos' 
            ? todosOsSocios.find(s => s.cpf === item.proprietarioCpf) 
            : null;
        
        const proprietarioInfo = proprietario ? `<br><small style="color: #6c757d;">Registrado por: ${proprietario.nome}</small>` : '';

        let mesPart = '', anoPart = '';
        if (item.mes) {
            const parts = item.mes.split('-');
            anoPart = parts[0] || '';
            mesPart = parts[1] || '';
        }
        const mesOpts = `<option value="">Mês</option>` +
            mesesNomes.map(([v,n]) => `<option value="${v}"${mesPart===v?' selected':''}>${n}</option>`).join('');
        const anoOpts = `<option value="">Ano</option>` +
            anosPreDef.map(a => `<option value="${a}"${anoPart===String(a)?' selected':''}>${a}</option>`).join('');
        
        // Indicador de travamento
        const lockBadge = trancado ? `<span class="badge-trancado" title="Mês trancado — edite o mês atual ou peça à gerência para destravar">🔒</span>` : '';
        const lockCol = trancado ? `<td><button class="btn btn-locked" disabled title="Mês trancado">🔒</button></td>` : `<td><button class="btn btn-delete" onclick="deleteRendimentoRow(${item.id})">🗑️ Excluir</button></td>`;
        
        row.innerHTML = `
            <td>
                <div style="display:flex;gap:4px;align-items:center;">
                    <select style="flex:1.8;" ${podeEditar ? '' : 'disabled'} onchange="updateRendimentoMes(${item.id},'mes',this.value)">${mesOpts}</select>
                    <select style="flex:1;" ${podeEditar ? '' : 'disabled'} onchange="updateRendimentoMes(${item.id},'ano',this.value)">${anoOpts}</select>
                    ${lockBadge}
                </div>
            </td>
            <td><input type="text" value="${item.banco}" ${podeEditar ? '' : 'disabled'} placeholder="Nome do banco" onchange="updateRendimentoData(${item.id}, 'banco', this.value)">${proprietarioInfo}</td>
            <td><input type="number" step="0.01" value="${item.valorRendimento}" ${podeEditar ? '' : 'disabled'} placeholder="0.00" onchange="updateRendimentoData(${item.id}, 'valorRendimento', this.value)"></td>
            <td><input type="number" step="0.01" value="${item.irRetido}" ${podeEditar ? '' : 'disabled'} placeholder="0.00" onchange="updateRendimentoData(${item.id}, 'irRetido', this.value)"></td>
            <td><input type="text" value="${item.observacoes}" ${podeEditar ? '' : 'disabled'} placeholder="Observações (opcional)" onchange="updateRendimentoData(${item.id}, 'observacoes', this.value)"></td>
            ${lockCol}
        `;
        tbody.appendChild(row);
    });
    
    updateRendimentosTotalFiltrado(dados);
    
    // Mostrar/ocultar alerta de mês trancado
    const alertaRend = document.getElementById('alerta-rendimentos-trancado');
    if (alertaRend) {
        const temTrancado = dados.some(item => item.mes && mesEstaTrancado(item.mes));
        alertaRend.style.display = temTrancado ? 'flex' : 'none';
    }
}

function updateRendimentosTotal() {
    let dados = rendimentosData;
    if (filtroRendimentos.ano) dados = dados.filter(i => i.mes && i.mes.startsWith(filtroRendimentos.ano));
    if (filtroRendimentos.mes) dados = dados.filter(i => i.mes && i.mes.split('-')[1] === filtroRendimentos.mes);
    updateRendimentosTotalFiltrado(dados);
}

function updateRendimentosTotalFiltrado(dados) {
    const totalRendimento = dados.reduce((sum, item) => sum + (item.valorRendimento || 0), 0);
    const totalIR = dados.reduce((sum, item) => sum + (item.irRetido || 0), 0);
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

function formatarCNPJExibicao(cnpj) {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Converte YYYY-MM-DD → DD/MM/AAAA
function formatarDataBR(data) {
    if (!data) return '-';
    const partes = data.split('-');
    if (partes.length !== 3) return data;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Converte YYYY-MM → MM/AAAA
function formatarMesBR(mes) {
    if (!mes) return '-';
    const partes = mes.split('-');
    if (partes.length !== 2) return mes;
    return `${partes[1]}/${partes[0]}`;
}

// Converte DD/MM/AAAA → YYYY-MM-DD (para salvar no backend)
function converterDataParaISO(data) {
    if (!data) return '';
    const partes = data.split('/');
    if (partes.length !== 3 || partes[2].length !== 4) return '';
    return `${partes[2]}-${partes[1].padStart(2,'0')}-${partes[0].padStart(2,'0')}`;
}

// Converte MM/AAAA → YYYY-MM (para salvar no backend)
function converterMesParaISO(mes) {
    if (!mes) return '';
    const partes = mes.split('/');
    if (partes.length !== 2 || partes[1].length !== 4) return '';
    return `${partes[1]}-${partes[0].padStart(2,'0')}`;
}

// Aplica máscara DD/MM/AAAA enquanto o usuário digita
function mascaraData(input) {
    let v = input.value.replace(/\D/g, '').substring(0, 8);
    if (v.length >= 5) {
        v = v.substring(0,2) + '/' + v.substring(2,4) + '/' + v.substring(4);
    } else if (v.length >= 3) {
        v = v.substring(0,2) + '/' + v.substring(2);
    }
    input.value = v;
}

// Aplica máscara MM/AAAA enquanto o usuário digita
function mascaraMes(input) {
    let v = input.value.replace(/\D/g, '').substring(0, 6);
    if (v.length >= 3) {
        v = v.substring(0,2) + '/' + v.substring(2);
    }
    input.value = v;
}

// Callback do picker nativo de data — atualiza o campo texto e salva
function selecionarData(hiddenInput) {
    const iso = hiddenInput.value; // YYYY-MM-DD
    const wrapper = hiddenInput.closest('.date-input-wrapper');
    const textInput = wrapper.querySelector('.input-data-br');
    textInput.value = formatarDataBR(iso);
    textInput.dispatchEvent(new Event('change'));
}

// Callback do picker nativo de mês — atualiza o campo texto e salva
function selecionarMes(hiddenInput) {
    const iso = hiddenInput.value; // YYYY-MM
    const wrapper = hiddenInput.closest('.date-input-wrapper');
    const textInput = wrapper.querySelector('.input-mes-br');
    textInput.value = formatarMesBR(iso);
    textInput.dispatchEvent(new Event('change'));
}

// ===== FUNÇÃO DE LIMPEZA DE DADOS =====
function clearAllData(type) {
    const userLogado = getUsuarioLogadoCompleto();
    
    if (userLogado.role === 'gerencia' && filtroAtual === 'todos') {
        alert('Por favor, selecione um sócio específico para limpar dados.');
        return;
    }
    
    const dataRef = type === 'lucros' ? lucrosData : rendimentosData;
    const campoData = type === 'lucros' ? 'data' : 'mes';
    const trancados = dataRef.filter(item => item[campoData] && mesEstaTrancado(item[campoData]));

    if (trancados.length > 0) {
        const editaveis = dataRef.length - trancados.length;
        if (editaveis === 0) {
            alert(`🔒 Todos os registros pertencem a meses trancados e não podem ser excluídos.\n\nApenas gerência pode destravar meses pelo painel de Administração.`);
            return;
        }
        if (!confirm(`🔒 ${trancados.length} registro(s) de meses trancados serão mantidos.\nApenas os ${editaveis} registro(s) do mês atual serão limpos.\n\nDeseja continuar?`)) return;
        // Limpar apenas registros editáveis
        if (type === 'lucros') {
            lucrosData = lucrosData.filter(item => item.data && mesEstaTrancado(item.data));
            renderLucrosTable();
        } else {
            rendimentosData = rendimentosData.filter(item => item.mes && mesEstaTrancado(item.mes));
            renderRendimentosTable();
        }
        salvarDadosDoUsuario();
        showSuccessMessage('Dados do mês atual limpos com sucesso!');
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

// ===== HELPER: GERAR E BAIXAR ARQUIVO CSV =====
function gerarDownloadCSV(headers, data, filename) {
    let csvContent = '\uFEFF'; // BOM para UTF-8 (compatibilidade Excel/Contimatic)
    csvContent += headers.join(';') + '\n';
    data.forEach(row => {
        csvContent += row.map(cell => `"${(cell !== undefined && cell !== null ? cell : '').toString().replace(/"/g, '""')}"`).join(';') + '\n';
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.cssText = 'position:fixed;top:-100px;left:-100px;opacity:0;';
    document.body.appendChild(link);
    // Usar evento não-borbulhante para não disparar window.onclick
    link.dispatchEvent(new MouseEvent('click', { bubbles: false, cancelable: true }));
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}

// ===== FUNÇÃO DE EXPORTAÇÃO PARA EXCEL/CSV =====
function exportToExcel(type) {
    const userLogado = getUsuarioLogadoCompleto();
    const incluirProprietario = userLogado.role === 'gerencia' && filtroAtual === 'todos';

    if (type === 'lucros') {
        if (lucrosData.length === 0) {
            alert('Não há dados de lucros para exportar!');
            return;
        }
        const headers = incluirProprietario
            ? ['Empresa', 'Data do Crédito', 'Sócio Beneficiário', 'Descrição da Operação', 'Valor (R$)', 'Observações']
            : ['Data do Crédito', 'Sócio Beneficiário', 'Descrição da Operação', 'Valor (R$)', 'Observações'];
        const data = lucrosData.map(item => {
            const proprietario = todosOsSocios.find(s => s.cpf === item.proprietarioCpf);
            const base = [
                formatarDataBR(item.data),
                getNomeSocioBeneficiario(item),
                item.descricao || '',
                item.valor.toFixed(2),
                item.observacoes || ''
            ];
            return incluirProprietario ? [proprietario ? proprietario.nome : '', ...base] : base;
        });
        const sufixo = filtroAtual !== 'todos'
            ? `_${(todosOsSocios.find(s => s.cpf === filtroAtual)?.nome || filtroAtual).replace(/\s+/g, '_')}`
            : '';
        gerarDownloadCSV(headers, data, `distribuicao_lucros${sufixo}.csv`);
        showSuccessMessage('Lucros exportados com sucesso!');
    } else {
        if (rendimentosData.length === 0) {
            alert('Não há dados de rendimentos para exportar!');
            return;
        }
        const headers = incluirProprietario
            ? ['Empresa', 'Mês do Rendimento', 'Banco', 'Valor Rendimento (R$)', 'IR Retido pelo Banco', 'Observações']
            : ['Mês do Rendimento', 'Banco', 'Valor Rendimento (R$)', 'IR Retido pelo Banco', 'Observações'];
        const data = rendimentosData.map(item => {
            const proprietario = todosOsSocios.find(s => s.cpf === item.proprietarioCpf);
            const base = [
                formatarMesBR(item.mes),
                item.banco || '',
                item.valorRendimento.toFixed(2),
                item.irRetido.toFixed(2),
                item.observacoes || ''
            ];
            return incluirProprietario ? [proprietario ? proprietario.nome : '', ...base] : base;
        });
        const sufixo = filtroAtual !== 'todos'
            ? `_${(todosOsSocios.find(s => s.cpf === filtroAtual)?.nome || filtroAtual).replace(/\s+/g, '_')}`
            : '';
        gerarDownloadCSV(headers, data, `rendimentos_financeiros${sufixo}.csv`);
        showSuccessMessage('Rendimentos exportados com sucesso!');
    }
}

// ===== EXPORTAR SOMENTE A EMPRESA SELECIONADA =====
function exportarEmpresaSelecionada() {
    if (filtroAtual === 'todos') {
        alert('Por favor, selecione uma empresa específica no filtro antes de exportar.');
        return;
    }

    const socio = todosOsSocios.find(s => s.cpf === filtroAtual);
    const nomeEmpresa = socio ? socio.nome : filtroAtual;
    const sufixoArquivo = nomeEmpresa.replace(/[\s/\\:*?"<>|]/g, '_');

    // Ler dados DIRETAMENTE do localStorage para garantir dados frescos
    const chave = `dados_${filtroAtual}`;
    const dadosSalvos = localStorage.getItem(chave);

    if (!dadosSalvos) {
        alert(`Não há dados salvos para "${nomeEmpresa}".`);
        return;
    }

    const parsed = JSON.parse(dadosSalvos);
    const lucros = parsed.lucros || [];
    const rendimentos = parsed.rendimentos || [];

    if (lucros.length === 0 && rendimentos.length === 0) {
        alert(`Não há registros para exportar de "${nomeEmpresa}".`);
        return;
    }

    const exportados = [];

    if (lucros.length > 0) {
        const headers = ['Data do Crédito', 'Sócio Beneficiário', 'Descrição da Operação', 'Valor (R$)', 'Observações'];
        const data = lucros.map(item => [
            formatarDataBR(item.data),
            item.socioBeneficiario || '',
            item.descricao || '',
            (parseFloat(item.valor) || 0).toFixed(2),
            item.observacoes || ''
        ]);
        gerarDownloadCSV(headers, data, `lucros_${sufixoArquivo}.csv`);
        exportados.push('Distribuição de Lucros');
    }

    if (rendimentos.length > 0) {
        setTimeout(() => {
            const headers = ['Mês do Rendimento', 'Banco', 'Valor Rendimento (R$)', 'IR Retido pelo Banco', 'Observações'];
            const data = rendimentos.map(item => [
                formatarMesBR(item.mes),
                item.banco || '',
                (parseFloat(item.valorRendimento) || 0).toFixed(2),
                (parseFloat(item.irRetido) || 0).toFixed(2),
                item.observacoes || ''
            ]);
            gerarDownloadCSV(headers, data, `rendimentos_${sufixoArquivo}.csv`);
        }, 300);
        exportados.push('Rendimentos Financeiros');
    }

    showSuccessMessage(`"${nomeEmpresa}" exportado: ${exportados.join(' + ')}`);
}

// Exportar todos os dados (para gerência)
function exportarTodosOsDados() {
    const userLogado = getUsuarioLogadoCompleto();

    if (userLogado.role !== 'gerencia') {
        alert('Acesso negado!');
        return;
    }

    // Coletar todos os dados de todos os sócios sem alterar o filtro atual
    let todosLucros = [];
    let todosRendimentos = [];

    todosOsSocios.forEach(socio => {
        if (socio.role === 'cliente') {
            const dados = localStorage.getItem(`dados_${socio.cpf}`);
            if (dados) {
                const parsed = JSON.parse(dados);
                (parsed.lucros || []).forEach(l => todosLucros.push({ ...l, proprietarioCpf: socio.cpf, proprietarioNome: socio.nome }));
                (parsed.rendimentos || []).forEach(r => todosRendimentos.push({ ...r, proprietarioCpf: socio.cpf, proprietarioNome: socio.nome }));
            }
        }
    });

    if (todosLucros.length === 0 && todosRendimentos.length === 0) {
        alert('Não há dados para exportar!');
        return;
    }

    if (todosLucros.length > 0) {
        const headers = ['Empresa', 'Data do Crédito', 'Sócio Beneficiário', 'Descrição da Operação', 'Valor (R$)', 'Observações'];
        const data = todosLucros.map(item => [
            item.proprietarioNome || '',
            formatarDataBR(item.data),
            getNomeSocioBeneficiario(item),
            item.descricao || '',
            item.valor.toFixed(2),
            item.observacoes || ''
        ]);
        gerarDownloadCSV(headers, data, 'todos_lucros.csv');
    }

    setTimeout(() => {
        if (todosRendimentos.length > 0) {
            const headers = ['Empresa', 'Mês do Rendimento', 'Banco', 'Valor Rendimento (R$)', 'IR Retido pelo Banco', 'Observações'];
            const data = todosRendimentos.map(item => [
                item.proprietarioNome || '',
                formatarMesBR(item.mes),
                item.banco || '',
                item.valorRendimento.toFixed(2),
                item.irRetido.toFixed(2),
                item.observacoes || ''
            ]);
            gerarDownloadCSV(headers, data, 'todos_rendimentos.csv');
        }
    }, 400);

    showSuccessMessage('Todos os dados exportados com sucesso!');
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
