import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db-wrapper';

/**
 * API para corrigir estrutura das tabelas no banco de dados
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Fix Tables] Iniciando correção de tabelas...');
    
    const fixes = [];
    
    // 1. Verificar se a tabela user_logs existe
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_logs'
      );
    `);
    
    if (tableExists[0].exists) {
      // Verificar se a coluna user_name existe
      const columnExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'user_logs' 
          AND column_name = 'user_name'
        );
      `);
      
      if (!columnExists[0].exists) {
        // Adicionar a coluna user_name se não existir
        await query(`
          ALTER TABLE user_logs 
          ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);
        `);
        fixes.push('Adicionada coluna user_name na tabela user_logs');
      }
    } else {
      // Criar a tabela com a estrutura correta
      await query(`
        CREATE TABLE user_logs (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255),
          user_name VARCHAR(255),
          action VARCHAR(255) NOT NULL,
          details JSONB DEFAULT '{}',
          module VARCHAR(100) NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          ip VARCHAR(45),
          user_agent TEXT,
          session_id VARCHAR(255),
          screen_resolution VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      // Criar índices
      await query(`
        CREATE INDEX IF NOT EXISTS idx_user_logs_timestamp ON user_logs(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_user_logs_user_id ON user_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_logs_module ON user_logs(module);
        CREATE INDEX IF NOT EXISTS idx_user_logs_action ON user_logs(action);
      `);
      
      fixes.push('Criada tabela user_logs com estrutura correta');
    }
    
    // 2. Garantir outras tabelas essenciais
    await query(`
      -- Tabela sync_control
      CREATE TABLE IF NOT EXISTS sync_control (
        id SERIAL PRIMARY KEY,
        entity VARCHAR(100) UNIQUE NOT NULL,
        last_sync_date TIMESTAMP WITH TIME ZONE,
        last_record_date TIMESTAMP WITH TIME ZONE,
        record_count INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        last_error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Índices
      CREATE INDEX IF NOT EXISTS idx_sync_control_entity ON sync_control(entity);
      CREATE INDEX IF NOT EXISTS idx_sync_control_status ON sync_control(status);
    `);
    fixes.push('Garantida estrutura da tabela sync_control');
    
    return NextResponse.json({
      success: true,
      message: 'Tabelas verificadas e corrigidas',
      fixes,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Fix Tables] Erro:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      hint: 'Execute este endpoint no Railway para corrigir a estrutura das tabelas'
    }, { status: 500 });
  }
}