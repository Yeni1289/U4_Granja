const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000
});

pool.connect()
    .then(client => {
        console.log('✅ Conectado a PostgreSQL (Neon) con éxito');
        client.release();
    })
    .catch(err => {
        console.error('❌ Fallo crítico en la conexión a la base de datos:', err.message);
        process.exit(1);
    });

module.exports = { pool };