require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function getClient() {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    return new Client({
      connectionString,
      ssl: connectionString.includes('sslmode=') || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    });
  }

  // Fallback para desenvolvimento local caso não haja DATABASE_URL
  return new Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'exam_engine',
  });
}

async function runSqlFile(client, filePath) {
  const fileName = path.basename(filePath);
  console.log(`📄 A executar: ${fileName}...`);
  const sql = fs.readFileSync(filePath, 'utf8');
  await client.query(sql);
  console.log(`✅ ${fileName} executado com sucesso!`);
}

async function bootstrap() {
  const client = await getClient();

  try {
    await client.connect();
    console.log('⚡ Ligado à base de dados com sucesso.');

    // 1. Executa o schema base
    // Verifica se está dentro de scripts/ ou na raiz
    let baseSqlPath = path.join(__dirname, 'database.sql');
    if (!fs.existsSync(baseSqlPath)) {
      baseSqlPath = path.join(__dirname, '..', 'database.sql');
    }

    if (fs.existsSync(baseSqlPath)) {
      await runSqlFile(client, baseSqlPath);
    } else {
      console.warn('⚠️  database.sql não encontrado.');
    }

    // 2. Executa as migrações em ordem alfabética/cronológica
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        const fullPath = path.join(migrationsDir, file);
        await runSqlFile(client, fullPath);
      }
    }

    console.log('✨ Poesia pura: Estrutura e migrações aplicadas com maestria!');
  } catch (err) {
    console.error('❌ Erro durante o bootstrap da base de dados:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

bootstrap().catch((error) => {
  console.error('❌ Erro fatal:', error.message);
  process.exitCode = 1;
});