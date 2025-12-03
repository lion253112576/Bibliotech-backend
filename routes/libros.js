const router = require('express').Router();
const pool = require('../config/connectionDb');

router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM libros');
        return res.status(200).json(rows);
    } catch (error) {
        return res.status(400).json({ error: error.message })
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(
            'SELECT * FROM libros WHERE id_libro = $1',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Libro no encontrado." });
        }
        return res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error al obtener libro por ID:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor." });
    }
});

router.post('/', async (req, res) => {
    const { nombreLibro, fechaPubliccion, estado, editorial, autor } = req.body;
    if (!nombreLibro || !fechaPubliccion || !estado || !editorial || !autor ) {
        res.status(400).send({ status: 'Error', message: 'Los campos estan incorrectos' });
    }

    try {
        const postResult = await pool.query(
            `INSERT INTO libros (nombre_libro, fecha_publicacion, estado, editorial, autor)
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [ nombreLibro, fechaPubliccion, estado, editorial, autor]
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

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombreLibro, fechaPubliccion, estado, editorial, autor } = req.body;
    if (!nombreLibro || !fechaPubliccion || !estado || !editorial || !autor ) {
        res.status(400).send({ status: 'Error', message: 'Los campos estan incorrectos' });
    }

    try {
        const putResult = await pool.query(
            `UPDATE libros
            SET nombre_libro = $1, fecha_publicacion = $2, estado = $3, editorial = $4, autor = $5  
            WHERE id_libro = $6
            RETURNING *`,
            [ nombreLibro, fechaPubliccion, estado, editorial, autor, id]
        );
        if (putResult.rows.length === 0) {
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

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteResult = await pool.query(
            'DELETE FROM libros WHERE id_libro = $1 RETURNING *', [id]
        );

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });

        }
        return res.status(200).json({
            data: deleteResult.rows[0],
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

module.exports = router;