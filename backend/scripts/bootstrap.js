require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// A tua base de dados alvo
const dbName = process.env.DB_NAME || 'exam_engine';

// 1. Configuração base (ligação obrigatória à BD padrão 'postgres' para tarefas administrativas)
const baseConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', 
};

async function bootstrap() {
  if (!baseConfig.password) {
    throw new Error('DB_PASSWORD is required to run the database bootstrap script.');
  }

  if (dbName.length > 63 || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(dbName)) {
    throw new Error('DB_NAME must be at most 63 characters and contain only letters, numbers, and underscores, without starting with a number.');
  }

  const client = new Client(baseConfig);
  
  try {
    await client.connect();
    console.log('🔌 Ligação estabelecida à matriz do PostgreSQL.');

    // Verifica se a base de dados do projeto já existe
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    
    if (res.rowCount === 0) {
      console.log(`🌱 A base de dados "${dbName}" não existe. A criar...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Base de dados "${dbName}" criada com muito estilo!`);
    } else {
      console.log(`🌊 A base de dados "${dbName}" já flui perfeitamente. Continuando...`);
    }
  } catch (err) {
    console.error('❌ Erro a verificar ou criar a BD:', err);
    process.exit(1);
  } finally {
    await client.end();
  }

  // 2. Agora, ligamos diretamente à BD do projeto para injetar o schema
  const targetConfig = { ...baseConfig, database: dbName };
  const targetClient = new Client(targetConfig);

  try {
    await targetClient.connect();
    console.log(`📦 Ligados à "${dbName}". A ler o teu database.sql...`);

    // Aponta para o ficheiro SQL raiz que tens no projeto
    const sqlPath = path.join(__dirname, '..', 'database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await targetClient.query(sql);
    console.log('✨ Poesia pura: Tabelas e estrutura inicializadas com sucesso!');
  } catch (err) {
    console.error('❌ Erro a processar o database.sql:', err);
    process.exit(1);
  } finally {
    await targetClient.end();
  }
}

bootstrap().catch((error) => {
  console.error('❌ Erro ao inicializar a base de dados:', error.message);
  process.exitCode = 1;
});