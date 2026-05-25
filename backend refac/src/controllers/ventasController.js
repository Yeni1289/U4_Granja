const { pool } = require('../config/db');
const { enviarNotaRemision } = require('../services/emailService');

exports.completarVenta = async (req, res) => {
    const { items } = req.body;
    const usuarioId = req.usuario.id;
    const usuarioCorreo = req.usuario.correo;

    const subtotal = items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const iva = subtotal * 0.16;
    const totalFinal = subtotal + iva;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Insertar venta
        const ventaResult = await client.query(
            'INSERT INTO ventas (usuario_id, total, fecha) VALUES ($1, $2, NOW()) RETURNING id',
            [usuarioId, totalFinal]
        );
        const ventaId = ventaResult.rows[0].id;

        // 2. Procesar cada artículo
        for (const item of items) {
            const productData = await client.query(
                'SELECT stock, nombre FROM productos WHERE id = $1',
                [item.id]
            );

            if (productData.rows.length === 0) {
                throw new Error(`El producto con ID ${item.id} no existe.`);
            }

            const currentStock = productData.rows[0].stock;
            const nombreProducto = productData.rows[0].nombre;

            if (currentStock < item.cantidad) {
                throw new Error(`Stock insuficiente para "${nombreProducto}". Disponibles: ${currentStock}.`);
            }

            // Restar stock
            await client.query(
                'UPDATE productos SET stock = stock - $1 WHERE id = $2',
                [item.cantidad, item.id]
            );

            // Registrar detalle
            await client.query(
                'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4)',
                [ventaId, item.id, item.cantidad, item.precio]
            );

            item.nombre = nombreProducto;
        }

        await client.query('COMMIT');

        try {
            await enviarNotaRemision(usuarioCorreo, ventaId, items, { subtotal, iva, totalFinal });
        } catch (mailErr) {
            console.error("Alerta: Venta guardada pero falló el envío de correo:", mailErr.message);
        }

        res.json({ success: true, message: 'Transacción completada.', ventaId, total: totalFinal });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(400).json({ success: false, message: error.message });
    } finally {
        client.release();
    }
};

exports.obtenerHistorial = async (req, res) => {
    const usuarioId = req.usuario.id;
    try {
        const result = await pool.query(`
            SELECT v.id AS "ventaId", v.total, v.fecha,
                   dv.cantidad, dv.precio_unitario, p.nombre AS "productoNombre"
            FROM ventas v
            JOIN detalle_ventas dv ON v.id = dv.venta_id
            JOIN productos p ON dv.producto_id = p.id
            WHERE v.usuario_id = $1
            ORDER BY v.fecha DESC
        `, [usuarioId]);

        const historialAgrupado = [];
        result.rows.forEach(row => {
            let venta = historialAgrupado.find(v => v.ventaId === row.ventaId);
            if (!venta) {
                venta = { ventaId: row.ventaId, total: row.total, fecha: row.fecha, items: [] };
                historialAgrupado.push(venta);
            }
            venta.items.push({ productoNombre: row.productoNombre, cantidad: row.cantidad, precio_unitario: row.precio_unitario });
        });

        res.json({ success: true, data: historialAgrupado });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};