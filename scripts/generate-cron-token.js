#!/usr/bin/env node

/**
 * Script para gerar um token JWT para uso em cron jobs
 * 
 * Uso:
 * node scripts/generate-cron-token.js
 * 
 * Ou com variáveis customizadas:
 * JWT_SECRET=seu-secret node scripts/generate-cron-token.js
 */

const { SignJWT } = require('jose');
const crypto = require('crypto');

async function generateCronToken() {
  try {
    // Usar JWT_SECRET do ambiente ou um padrão
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const secret = new TextEncoder().encode(jwtSecret);

    // Criar um usuário "cron" especial
    const cronUser = {
      id: 'cron-job',
      name: 'Sistema Cron',
      email: 'cron@system.local',
      role: 'admin' // Precisa ser admin para sincronizar
    };

    // Gerar token com validade de 1 ano
    const token = await new SignJWT({ ...cronUser })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('365d')
      .sign(secret);

    console.log('\n=== TOKEN JWT PARA CRON JOB ===\n');
    console.log('Token gerado com sucesso!');
    console.log('Validade: 1 ano\n');
    console.log('Use este token no cookie ao chamar o endpoint:');
    console.log('----------------------------------------------');
    console.log(token);
    console.log('----------------------------------------------\n');
    console.log('Exemplo de uso com cURL:');
    console.log('curl -H "Cookie: veplim-auth-token=' + token + '" \\');
    console.log('     https://seu-app.railway.app/api/sync/cron\n');
    console.log('Exemplo de uso com fetch:');
    console.log('fetch("https://seu-app.railway.app/api/sync/cron", {');
    console.log('  headers: {');
    console.log('    "Cookie": "veplim-auth-token=' + token + '"');
    console.log('  }');
    console.log('});\n');

  } catch (error) {
    console.error('Erro ao gerar token:', error.message);
    process.exit(1);
  }
}

// Executar
generateCronToken();