const { pool } = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

exports.registrar = async (req, res) => {
    const { nombre, correo, password } = req.body;
    try {
        // 1. Validar si el correo ya existe
        const userCheck = await pool.query(
            'SELECT id FROM usuarios WHERE correo = $1',
            [correo]
        );

        if (userCheck.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'El correo ya se encuentra registrado.' });
        }

        // 2. Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // 3. Insertar nuevo usuario y recuperarlo en una sola query
        const newUser = await pool.query(
            'INSERT INTO usuarios (nombre, correo, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, correo, rol',
            [nombre, correo, hashedPassword, 'cliente']
        );

        const usuario = newUser.rows[0];
        const token = jwt.sign(
            { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(201).json({ success: true, token, usuario });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.login = async (req, res) => {
    const { correo, password } = req.body;
    try {
        // 1. Buscar al usuario por correo
        const result = await pool.query(
            'SELECT id, nombre, correo, password, rol FROM usuarios WHERE correo = $1',
            [correo]
        );

        // 2. Si el usuario no existe
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        const usuario = result.rows[0];

        // 3. Comparar contraseña con el hash
        const passwordCorrecto = await bcrypt.compare(password, usuario.password);

        if (!passwordCorrecto) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

        // 4. Emitir token
        const token = jwt.sign(
            { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            token,
            usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};