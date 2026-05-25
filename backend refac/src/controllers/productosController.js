const { pool } = require('../config/db');

const obtenerTodos = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const crear = async (req, res) => {
    const { nombre, descripcion, precio, imagen_url, stock } = req.body;
    try {
        await pool.query(
            'INSERT INTO productos (nombre, descripcion, precio, imagen_url, stock) VALUES ($1, $2, $3, $4, $5)',
            [nombre, descripcion, precio, imagen_url, stock]
        );
        res.status(201).json({ success: true, message: 'Creado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const editar = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen_url, stock } = req.body;
    try {
        await pool.query(
            'UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, imagen_url = $4, stock = $5 WHERE id = $6',
            [nombre, descripcion, precio, imagen_url, stock, id]
        );
        res.json({ success: true, message: 'Editado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const eliminar = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM productos WHERE id = $1', [id]);
        res.json({ success: true, message: 'Eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const actualizarStock = async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;
    try {
        await pool.query(
            'UPDATE productos SET stock = $1 WHERE id = $2',
            [stock, id]
        );
        res.json({ success: true, message: 'Stock actualizado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    obtenerTodos,
    crear,
    editar,
    eliminar,
    actualizarStock
};