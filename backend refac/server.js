const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./src/routes/auth');
const productosRoutes = require('./src/routes/productos');
const ventasRoutes = require('./src/routes/ventasRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint no encontrado.' });
});

// Solo escucha en local (Vercel maneja esto automáticamente en producción)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Servidor ejecutándose en: http://localhost:${PORT}`);
    });
}

module.exports = app;