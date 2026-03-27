#!/usr/bin/env node
/**
 * Sincroniza roles dos usuários do Firestore para Custom Claims no Firebase Auth.
 * 
 * Uso: node sync-roles.js
 * 
 * Requer: GOOGLE_APPLICATION_CREDENTIALS ou `firebase login` via CLI
 * 
 * O que faz:
 * 1. Lê todos os usuários de Firestore (sistema/usuarios)
 * 2. Para cada usuário, define custom claim { role: 'gerencia' | 'cliente' }
 * 3. As Firestore Rules verificam request.auth.token.role
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Tentar carregar service account do diretório do projeto
const credPath = path.join(__dirname, 'service-account.json');

if (fs.existsSync(credPath)) {
    const serviceAccount = require(credPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
    });
    console.log('🔑 Usando service-account.json\n');
} else {
    console.log('❌ Arquivo service-account.json não encontrado em:', credPath);
    console.log('   Baixe em: Firebase Console → Configurações → Contas de serviço → Gerar nova chave privada');
    process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

async function syncRoles() {
    console.log('🔄 Sincronizando roles...\n');

    // Ler usuários do Firestore
    const usuariosDoc = await db.collection('sistema').doc('usuarios').get();
    if (!usuariosDoc.exists) {
        console.log('❌ Documento sistema/usuarios não encontrado');
        return;
    }

    const usuarios = usuariosDoc.data().lista || [];
    console.log(`📋 ${usuarios.length} usuários encontrados\n`);

    let ok = 0;
    let skip = 0;
    let err = 0;

    for (const user of usuarios) {
        const email = `${user.cpf}@t7system.local`;
        const role = user.role || 'cliente';

        try {
            // Buscar usuário no Firebase Auth
            let firebaseUser;
            try {
                firebaseUser = await auth.getUserByEmail(email);
            } catch (e) {
                if (e.code === 'auth/user-not-found') {
                    // Criar usuário no Auth
                    firebaseUser = await auth.createUser({
                        email: email,
                        password: user.senha || user.senhaHash || 'temp123456',
                        displayName: user.nome,
                        disabled: false
                    });
                    console.log(`  ➕ Criado: ${user.nome} (${user.cpf})`);
                } else {
                    throw e;
                }
            }

            // Verificar se a role mudou
            const currentClaims = firebaseUser.customClaims || {};
            if (currentClaims.role === role) {
                skip++;
                continue;
            }

            // Definir custom claims
            await auth.setCustomUserClaims(firebaseUser.uid, {
                role: role,
                cpf: user.cpf
            });

            console.log(`  ✅ ${user.nome} (${user.cpf}) → ${role}`);
            ok++;
        } catch (e) {
            console.log(`  ❌ ${user.nome} (${user.cpf}): ${e.message}`);
            err++;
        }
    }

    console.log(`\n📊 Resultado: ${ok} atualizados, ${skip} sem mudanças, ${err} erros`);
}

syncRoles().then(() => process.exit(0)).catch(e => {
    console.error('Erro:', e.message);
    process.exit(1);
});
