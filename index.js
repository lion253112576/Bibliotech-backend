require("dotenv").config({ path: './config/.env' });
const cors = require('cors');
const express = require('express');
const app = express();
const pool = require('./config/connectionDb.js');
const routerUsuarios = require('./routes/usuarios.js');
const routerLibros = require('./routes/libros.js');
const routerRentas = require('./routes/rentas.js')

app.use(cors({
    origin: [
        'http://localhost:5500',   // o tu puerto local
        'http://localhost:3000',
        'https://TU-FRONTEND.onrender.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

//server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

pool.connect((err) => {
    if (err) {
        console.log('Error de conexion a la base de datos', err.stack)
    } else {
        console.log('Base de datos conectada');
    }
});


//Configuracion
app.use(express.json());
app.use(express.static(__dirname + '/public/'));
app.use('/api/usuarios', routerUsuarios);
app.use('/api/libros', routerLibros);
app.use('/api/prestamos', routerRentas);


//Rutas 
app.get('/login', (req, res) => res.sendFile(__dirname + '/public/pages/login.html'));
app.get('/bibliotech', (req, res) => res.sendFile(__dirname + '/public/pages/dashboard.html'));
app.get('/prestamos', (req, res) => res.sendFile(__dirname + '/public/pages/prestamos.html'));
app.get('/admin', (req, res) => res.sendFile(__dirname + '/public/pages/admin.html'));


