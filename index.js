require("dotenv").config({ path: './config/.env' });
const cors = require('cors');
const express = require('express');
const app = express();
const pool = require('./config/connectionDb.js');
const routerUsuarios = require('./routes/usuarios.js');
const routerLibros = require('./routes/libros.js');
const routerRentas = require('./routes/rentas.js')

const allowedOrigins = [
  "https://bibliotech-backend-s2i9.onrender.com", // tu front
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

app.use(
  require("cors")({
    origin: function (origin, callback) {
      // permitir peticiones sin origin (curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origen no permitido por CORS: " + origin));
    },
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Authorization"
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/public/'));

//Configuracion
app.use('/api/usuarios', routerUsuarios);
app.use('/api/libros', routerLibros);
app.use('/api/prestamos', routerRentas);


//Rutas 
app.get('/login', (req, res) => res.sendFile(__dirname + '/public/pages/login.html'));
app.get('/bibliotech', (req, res) => res.sendFile(__dirname + '/public/pages/dashboard.html'));
app.get('/prestamos', (req, res) => res.sendFile(__dirname + '/public/pages/prestamos.html'));
app.get('/admin', (req, res) => res.sendFile(__dirname + '/public/pages/admin.html'));

pool.connect((err) => {
    if (err) {
        console.log('Error de conexion a la base de datos', err.stack)
    } else {
        console.log('Base de datos conectada');
    }
});

//server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
