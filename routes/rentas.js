const router = require('express').Router();
const pool = require('../config/connectionDb');
const jwt = require('jsonwebtoken');

//clave token
const JWT_SECRET = process.env.JWT_SECRET || 'Up_mh25_$12657';

//Middlewere para verificar las rentas de cada usuario
const verifyCliente = (req, res, next) => {
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
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Token inválido o expirado.'
        });
    }
}

const verifyAdminRent = (req, res, next) => {
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

//endpoint Get
router.get('/', async (req, res) => {
    const query = `
    SELECT
        r.id_renta,
        r.fecha_vencimiento,
        r.estado,
        r.fecha_prestamo,
        r.usuario_id,
        u.nombre AS nombre_usuario,
        u.apellidos AS apellidos_usuario,
        r.libro_id,
        l.nombre_libro,
        l.autor
    FROM rentas r
    JOIN usuarios u ON r.usuario_id = u.id_usuario
    JOIN libros l ON r.libro_id = l.id_libro
    ORDER BY r.fecha_prestamo DESC`;
    try {
        const { rows } = await pool.query(query);
        return res.status(200).json(rows)
    } catch (error) {
        console.error('Error al obtener la tabal rentas: ', error);
        return res.status(500).json({ message: 'Error interno del servidor al obtener las rentas.' })
    }
});

router.get('/mis_rentas', verifyCliente,async (req, res) => {
    const userId = req.user.id;
    
    if (!userId) {
        return res.status(403).json({ message: 'No se pudo obtener el ID de usuario del token.' });
    }

    const query = `
    SELECT
        r.id_renta,
        r.fecha_vencimiento,
        r.estado,
        r.fecha_prestamo,
        r.usuario_id,
        u.nombre AS nombre_usuario,
        u.apellidos AS apellidos_usuario,
        r.libro_id,
        l.nombre_libro,
        l.autor
    FROM rentas r
    JOIN usuarios u ON r.usuario_id = u.id_usuario
    JOIN libros l ON r.libro_id = l.id_libro
    WHERE r.usuario_id = $1
    ORDER BY r.fecha_prestamo DESC`;
    try {
        const { rows } = await pool.query(query, [userId]);
        return res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener la tabal rentas: ', error);
        return res.status(500).json({ message: 'Error interno del servidor al obtener las rentas.' })
    }
});

//endpoint Get para solo un parametro
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(
            'SELECT * FROM rentas WHERE id_renta = $1', [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Prestamo no encontrado." });
        }
        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error al obtener el prestamo por ID:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
});


//endpoint Post admin
router.post('/admin', verifyAdminRent, async (req, res) => {
    const { usuarioId, libroId, fechaVencimiento, estado, fechaPrestamo } = req.body;
    if (!usuarioId || !libroId || !fechaVencimiento || !fechaPrestamo || !estado) {
        return res.status(400).json({ message: 'Faltan campos obligatorios para crear la renta.' });
    }
    try {
        const postResult = await pool.query(`
            INSERT INTO rentas (usuario_id, libro_id, fecha_vencimiento, estado, fecha_prestamo)
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [usuarioId, libroId, fechaVencimiento, estado, fechaPrestamo]
        );
        return res.status(201).json({
            data: postResult.rows[0],
            message: "Formulario enviado exitosamente"
        });

    } catch (error) {

        console.error('Error al crear renta:', error);

        if (error.code === '23503') {
            return res.status(400).json({
                message: 'Error de llave foránea: El ID de usuario o libro proporcionado no existe.',
                detail: error.detail
            });
        }
        if (error.code === '23502') {
            return res.status(400).json({
                message: 'Datos incompletos: Asegúrese de enviar todos los campos requeridos.',
            });
        }

        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

//Post Usuarios
router.post('/', verifyCliente, async (req, res) => {
    const usuarioId = req.user.id; 

    const { libroId, fechaPrestamo } = req.body; 

    // Adaptar la validación para los campos que vienen en el body
    if ( !libroId || !fechaPrestamo ) {
        return res.status(400).json({ message: 'Faltan campos obligatorios para crear la renta.' });
    }
    try {
        const postResult = await pool.query(`
            INSERT INTO rentas (usuario_id, libro_id, fecha_prestamo)
            VALUES ($1, $2, $3) RETURNING *`,
            [usuarioId, libroId, fechaPrestamo] // Usamos usuarioId del token
        );
        return res.status(201).json({
            data: postResult.rows[0],
            message: "Formulario enviado exitosamente"
        });

    } catch (error) {

        console.error('Error al crear renta:', error);

        if (error.code === '23503') {
            return res.status(400).json({
                message: 'Error de llave foránea: El ID de libro proporcionado no existe.',
                detail: error.detail
            });
        }
        if (error.code === '23502') {
            return res.status(400).json({
                message: 'Datos incompletos: Asegúrese de enviar todos los campos requeridos.',
            });
        }

        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

//endpoint put
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { fechaVencimiento, estado } = req.body;

    try {
        const putResult = await pool.query(`
            UPDATE rentas
            SET fecha_vencimiento = $1, estado = $2
            WHERE id_renta = $3
            RETURNING *`,
            [fechaVencimiento, estado, id]
        );

        if (putResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El prestamo no fue encontrado'
            });
        }
        return res.status(200).json({
            success: true,
            message: 'El prestamo fue actualizado correctamente',
            data: putResult.rows[0]
        })
    } catch (error) {
        console.error('Error al actualizar renta:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar la renta.' });
    }
});

//endpoint delete
router.delete('/:id', async (req, res) => {
    const { id } = req.params
    try {
        const resultDelete = await pool.query(
            'DELETE FROM rentas WHERE id_renta = $1', [id]
        );

        if (resultDelete.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Prestamo no encontrado'
            });
        }
        return res.status(200).json({
            data: resultDelete.rows[0],
            message: 'Prestamo eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar renta:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar la renta.' });
    }
});

module.exports = router