const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function initializeDatabase() {
  try {
    console.log('🔄 A ler o ficheiro database.sql...');
    const sqlPath = path.join(__dirname, 'database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('⚡ A criar tabelas, enums e índices na base de dados exam_engine...');
    await pool.query(sql);
    console.log('✅ Esquema criado com sucesso!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar a base de dados:', error.message);
    process.exit(1);
  }
}

initializeDatabase();