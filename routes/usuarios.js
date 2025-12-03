const router = require('express').Router();
const pool = require('../config/connectionDb');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');


//clave token archivo .env
const JWT_SECRET = process.env.JWT_SECRET || 'Up_mh25_$12657';

//middelware verificacion del rol admin
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado'
        });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. '
            });
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Requiere ser administrador'
        });
    }
}
//endpoint para obtener la tabal de usuarios
router.get('/', verifyAdmin ,async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM usuarios');
        return res.status(200).json(rows);
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
});

router.get('/:id', verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(
            'SELECT id_usuario, nombre, apellidos, correo, direccion, referencia, num_telefono, rol FROM usuarios WHERE id_usuario = $1',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado." });
        }
        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error al obtener usuario por ID:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
});

//Funcion para comprobar el login
const loginUsuario = async (req, res) => {
    const { correo, password } = req.body;
    try {
        const userResult = await pool.query(
            'SELECT id_usuario, correo, contra, rol FROM usuarios WHERE correo = $1',
            [correo]
        );
        if (userResult.rows.length === 0) {
            return res.status(401).json({ success: false, message: "Correo o contraseña incorrecta" });
        }
        const user = userResult.rows[0];
        const match = await bcryptjs.compare(password, user.contra);

        if (!match) {
            return res.status(401).json({ success: false, message: 'Correo o contraseña incorrecta' });
        }

        const token = jwt.sign({
            id: user.id_usuario,
            email: user.correo,
            rol: user.rol
        },
        JWT_SECRET,
        {expiresIn: '1h'}
        );

        return res.status(200).json({
            success: true,
            message: "Inicio de sesión exitoso.",
            token: token
        });
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
};

//endponits post para login y registro 
router.post('/login', loginUsuario);

router.post('/', async (req, res) => {
    try {
        const { nombre, apellidos, correo, direccion, referencia, numero, password, rol } = req.body;
        if ( !nombre || !apellidos || !correo || !password || !direccion || !numero ) {
            res.status(400).send({ status: 'Error', message: 'Los campos estan incorrectos' });
        }

        const rolAInsertar = rol || 'cliente';

        const salt = await bcryptjs.genSalt(10);
        const hashPassword = await bcryptjs.hash(password, salt);

        const postResult = await pool.query(
            `INSERT INTO usuarios (nombre, apellidos, correo, direccion, referencia, num_telefono, contra, rol)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [nombre, apellidos, correo, direccion, referencia, numero, hashPassword, rolAInsertar]
        );
        return res.status(201).json({
            data: postResult.rows[0],
            message: "Formulario enviado exitosamente"
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ success: false, message: 'El correo electrónico ya está registrado.' });
        }
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Error al enviar el formulario"
        });
    }
});

//endpoint eliminar usuarios
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const result = await pool.query(
            'DELETE FROM usuarios WHERE id_usuario = $1 RETURNING *', [ id ]
        );

        if(result.rowCount === 0){
            return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
            
        }

        return res.json({
            data: result.rows[0],
            message: 'Usuario eliminado correctamente'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error al eliminar el usuario'
        });
    }
});

//endpont para actualizar usuarios
router.put('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const { nombre, apellidos, direccion, referencia, numero, rol } = req.body
        if(!nombre || !apellidos || !direccion || !referencia || !numero || !rol){
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos'
            });
        }
        const putResult = await pool.query(
            `UPDATE usuarios 
            SET nombre = $1, apellidos = $2, direccion = $3, referencia = $4, num_telefono = $5, rol = $6
            WHERE id_usuario = $7
            RETURNING *`,
            [nombre, apellidos, direccion, referencia, numero, rol, id]
        );
        if( putResult.rows.length === 0 ){
            return res.status(404).json({
                success: false,
                message: 'El usuario no fue encontrado'
            });
        }
        return res.status(200).json({
            success: true,
            message: 'El usuario fue actualizado correctamente',
            data: putResult.rows[0]
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar el usuario',
            error: error.message
        });
    }
});

module.exports = router;
