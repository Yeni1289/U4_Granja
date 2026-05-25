const { pool } = require('./src/config/db');
const bcrypt = require('bcrypt');

async function crearAdmin() {
    try {
        const correoAdmin = 'novaexplorer99@gmail.com';
        const clavePlana = 'Admin123*';

        console.log('⏳ Generando hash seguro para la contraseña...');
        const hashedPassword = await bcrypt.hash(clavePlana, 10);

        await pool.query('DELETE FROM usuarios WHERE correo = $1', [correoAdmin]);

        await pool.query(
            'INSERT INTO usuarios (nombre, correo, password, rol) VALUES ($1, $2, $3, $4)',
            ['Juan Carlos Admin', correoAdmin, hashedPassword, 'admin']
        );

        console.log('\n======================================================');
        console.log('✅ ¡ADMINISTRADOR CREADO/ACTUALIZADO CON ÉXITO EN POSTGRESQL!');
        console.log(`📧 Correo: ${correoAdmin}`);
        console.log(`🔑 Contraseña: ${clavePlana}`);
        console.log(`🔒 Hash guardado: ${hashedPassword}`);
        console.log('======================================================');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error inyectando el administrador:', error.message);
        try {
            await pool.end();
        } catch (_) {
            // ignore
        }
        process.exit(1);
    }
}

crearAdmin();