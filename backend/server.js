require('dotenv').config(); 

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { validateReservation } = require('./middleware/validateData');

const app = express();

app.use(cors({
    origin: ['http://localhost', 'http://localhost:80', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/public', express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '19dic2005',
    database: process.env.DB_NAME || 'base_de_datos',
    port: 3306,
    connectTimeout: 10000 
});

function handleDisconnect(connection) {
    connection.on('error', function(err) {
        console.log('Error de BD:', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('Conexión perdida. Reconectando...');
            handleDisconnect(mysql.createConnection(connection.config));
        } else {
            throw err;
        }
    });
}

handleDisconnect(db);

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Connected to MySQL Database');
});

// Configura tu transport (usa tus datos reales)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'osadiarestauranteregister@gmail.com',      // <-- tu correo real
        pass: 'yive hcta hido avdo'               // <-- tu contraseña de aplicación de Gmail
    }
});

// Rutas básicas
app.get('/', (req, res) => {
    res.json({ message: 'API funcionando correctamente' });
});

app.get('/test-db', (req, res) => {
    db.query('SELECT 1 + 1 AS solution', (err, results) => {
        if (err) {
            console.error('Error en prueba DB:', err);
            return res.status(500).json({ message: 'Error en la base de datos', error: err.message });
        }
        return res.json({ message: 'Conexión a la base de datos exitosa', data: results });
    });
});

// Reservas - CRUD
app.get('/reservations', (req, res) => {
    const { user_id, location } = req.query;

    if (!user_id || !location) {
        return res.status(400).json({ message: 'Se requiere el ID del usuario y la ubicación' });
    }

    const sql = 'SELECT * FROM reservations WHERE user_id = ? AND location = ?';
    db.query(sql, [user_id, location], (err, result) => {
        if (err) {
            console.error('Error al obtener reservas:', err);
            return res.status(500).json({ message: 'Error al obtener reservas' });
        }
        res.json(result);
    });
});

app.post('/reservations', validateReservation, (req, res) => {
    const { date, time, guests, special_requests, user_id, location } = req.body;
    const MAX_CAPACITY = 30; // Capacidad máxima por horario
    const status = 'Pendiente'; // Status inicial para todas las reservas
    
    // Primero verificar disponibilidad
    const checkSql = 'SELECT SUM(guests) as total_guests FROM reservations WHERE date = ? AND time = ? AND location = ? AND status != "Cancelada"';
    
    db.query(checkSql, [date, time, location], (err, result) => {
        if (err) {
            console.error('Error al verificar disponibilidad:', err);
            return res.status(500).json({ message: 'Error al verificar disponibilidad' });
        }
        
        const totalGuests = result[0].total_guests || 0;
        const remainingCapacity = MAX_CAPACITY - totalGuests;
        
        // Verificar si hay suficiente capacidad para la nueva reserva
        if (Number(guests) > remainingCapacity) {
            return res.status(400).json({ 
                message: `No hay suficiente capacidad para esta reserva. Solo quedan ${remainingCapacity} lugares disponibles.`,
                availableSeats: remainingCapacity
            });
        }
        
        // Si hay capacidad, proceder con la reserva
        const sql = 'INSERT INTO reservations (date, time, guests, special_requests, status, location, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.query(sql, [date, time, guests, special_requests, status, location, user_id], (err, result) => {
            if (err) {
                console.error('Error al crear reserva:', err);
                return res.status(500).json({ message: 'Error al crear la reserva' });
            }
            res.status(201).json({ id: result.insertId, message: 'Reserva creada exitosamente' });
        });
    });
});

app.put('/reservations/:id', validateReservation, (req, res) => {
    const { id } = req.params;
    const { date, time, guests, special_requests, user_id, location } = req.body;
    const MAX_CAPACITY = 30; // Capacidad máxima por horario
    
    // Primero obtener la reserva actual para comparar cambios
    db.query('SELECT * FROM reservations WHERE id = ? AND user_id = ?', [id, user_id], (err, reservations) => {
        if (err) {
            console.error('Error al obtener reserva actual:', err);
            return res.status(500).json({ message: 'Error al actualizar la reserva' });
        }
        
        if (reservations.length === 0) {
            return res.status(404).json({ message: 'Reserva no encontrada o no tienes permiso para editarla' });
        }
        
        const currentReservation = reservations[0];
        
        // Si no hay cambios en fecha, hora o invitados, actualizar directamente
        if (currentReservation.date === date && 
            currentReservation.time === time && 
            Number(currentReservation.guests) === Number(guests)) {
                
            const updateSql = 'UPDATE reservations SET special_requests = ?, location = ? WHERE id = ? AND user_id = ?';
            db.query(updateSql, [special_requests, location, id, user_id], (err, result) => {
                if (err) {
                    console.error('Error al actualizar reserva:', err);
                    return res.status(500).json({ message: 'Error al actualizar la reserva' });
                }
                return res.json({ message: 'Reserva actualizada exitosamente' });
            });
            
            return;
        }
        
        // Si hay cambios en fecha, hora o invitados, verificar disponibilidad
        const checkSql = 'SELECT SUM(guests) as total_guests FROM reservations WHERE date = ? AND time = ? AND id != ? AND status != "Cancelada"';
        
        db.query(checkSql, [date, time, id], (err, result) => {
            if (err) {
                console.error('Error al verificar disponibilidad:', err);
                return res.status(500).json({ message: 'Error al verificar disponibilidad' });
            }
            
            const totalGuests = result[0].total_guests || 0;
            const remainingCapacity = MAX_CAPACITY - totalGuests;
            
            // Verificar si hay suficiente capacidad
            if (guests > remainingCapacity) {
                return res.status(400).json({ 
                    message: 'No hay suficiente capacidad para esta modificación',
                    availableSeats: remainingCapacity
                });
            }
            
            // Si hay capacidad, proceder con la actualización
            const updateSql = 'UPDATE reservations SET date = ?, time = ?, guests = ?, special_requests = ?, location = ? WHERE id = ? AND user_id = ?';
            db.query(updateSql, [date, time, guests, special_requests, location, id, user_id], (err, result) => {
                if (err) {
                    console.error('Error al actualizar reserva:', err);
                    return res.status(500).json({ message: 'Error al actualizar la reserva' });
                }
                res.json({ message: 'Reserva actualizada exitosamente' });
            });
        });
    });
});

app.delete('/reservations/:id', (req, res) => {
    const { id } = req.params;
    const { user_id, isAdmin } = req.body;

    let sql, params;
    if (isAdmin) {
        sql = 'DELETE FROM reservations WHERE id = ?';
        params = [id];
    } else {
        sql = 'DELETE FROM reservations WHERE id = ? AND user_id = ?';
        params = [id, user_id];
    }

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Error al eliminar reserva:', err);
            return res.status(500).json({ message: 'Error al cancelar la reserva' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Reserva no encontrada o no tienes permiso para cancelarla' });
        }
        res.json({ message: 'Reserva cancelada exitosamente' });
    });
});

// Menú - Obtener platos disponibles
app.get('/menu', (req, res) => {
    const sql = 'SELECT * FROM menu_items';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error al obtener menú:', err);
            return res.status(500).json({ message: 'Error al obtener el menú' });
        }
        res.json(result);
    });
});

app.get('/menu/categories', (req, res) => {
    const sql = 'SELECT DISTINCT category FROM menu_items';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error al obtener categorías:', err);
            return res.status(500).json({ message: 'Error al obtener categorías del menú' });
        }
        res.json(result.map(item => item.category));
    });
});

// Nuevo endpoint para verificar disponibilidad
app.get('/availability', (req, res) => {
    const { date, time, location } = req.query;
    const MAX_CAPACITY = 30;

    if (!date || !time || !location) {
        return res.status(400).json({ message: 'Se requiere fecha, hora y ubicación' });
    }

    const sql = `
        SELECT SUM(guests) as total_guests 
        FROM reservations 
        WHERE date = ? AND time = ? AND location = ? AND status != "Cancelada"
    `;

    db.query(sql, [date, time, location], (err, result) => {
        if (err) {
            console.error('Error al verificar disponibilidad:', err);
            return res.status(500).json({ message: 'Error al verificar disponibilidad' });
        }

        const totalGuests = result[0].total_guests || 0;
        const availableSeats = MAX_CAPACITY - totalGuests;

        res.json({
            available: availableSeats > 0,
            availableSeats,
            totalReserved: totalGuests
        });
    });
});

// Obtener todas las reservas con usuario
app.get('/admin/reservations', (req, res) => {
    const sql = `
        SELECT r.*, u.username 
        FROM reservations r
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.date DESC, r.time DESC
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ message: 'Error al obtener reservas' });
        res.json(result);
    });
});

// Agregar comentario de admin
app.put('/admin/reservations/:id/comment', (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;
    const sql = 'UPDATE reservations SET admin_comment = ? WHERE id = ?';
    db.query(sql, [comment, id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error al guardar comentario' });
        res.json({ message: 'Comentario guardado' });
    });
});

// Crear usuario por admin
app.post('/admin/create-user', async (req, res) => {
    const { admin_id, username, password, email, role } = req.body;
    // Verifica que el admin_id sea de un admin principal
    db.query('SELECT * FROM users WHERE id = ? AND role = "admin"', [admin_id], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(403).json({ message: 'No autorizado' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
            'INSERT INTO users (username, password, email, is_verified, role) VALUES (?, ?, ?, 1, ?)',
            [username, hashedPassword, email, role || 'user'],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Error al crear usuario' });
                }
                res.status(201).json({ message: 'Usuario creado correctamente' });
            }
        );
    });
});

// Obtener todos los usuarios
app.get('/admin/users', (req, res) => {
    db.query('SELECT id, username, email, role FROM users', (err, results) => {
        if (err) return res.status(500).json({ message: 'Error al obtener usuarios' });
        res.json(results);
    });
});

// Cambiar rol de usuario
app.put('/admin/users/:id/role', (req, res) => {
    const { id } = req.params;
    const { role, admin_id } = req.body;

    // Solo el admin principal puede cambiar roles
    db.query('SELECT * FROM users WHERE id = ?', [admin_id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(403).json({ message: 'No autorizado' });
        }
        const adminUser = results[0];
        if (adminUser.username !== 'administrador') {
            return res.status(403).json({ message: 'Solo el administrador principal puede cambiar roles.' });
        }

        db.query('UPDATE users SET role = ? WHERE id = ?', [role, id], (err) => {
            if (err) return res.status(500).json({ message: 'Error al actualizar rol' });
            res.json({ message: 'Rol actualizado' });
        });
    });
});

// Crear reserva forzada por admin
app.post('/admin/force-reservation', (req, res) => {
    const { date, time, guests, special_requests, location, user_id } = req.body;
    const status = 'Pendiente';

    // Aquí NO se verifica la capacidad
    const sql = 'INSERT INTO reservations (date, time, guests, special_requests, status, location, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [date, time, guests, special_requests, status, location, user_id], (err, result) => {
        if (err) {
            console.error('Error al crear reserva forzada:', err);
            return res.status(500).json({ message: 'Error al crear la reserva forzada' });
        }
        res.status(201).json({ id: result.insertId, message: 'Reserva forzada creada exitosamente' });
    });
});

// Verificar contraseña de admin principal
app.post('/admin/verify-password', async (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err || results.length === 0) return res.status(401).json({ message: 'No autorizado' });
        const user = results[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'Contraseña incorrecta' });
        res.json({ message: 'OK' });
    });
});

// Eliminar usuario (solo admin principal)
app.delete('/admin/users/:id', (req, res) => {
    const { id } = req.params;
    // Opcional: proteger para que solo el admin principal pueda borrar
    db.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error al eliminar usuario' });
        res.json({ message: 'Usuario eliminado' });
    });
});

// Crear ticket (usuario)
app.post('/tickets', (req, res) => {
    const { user_id, subject, message } = req.body;
    const sql = 'INSERT INTO tickets (user_id, subject, message) VALUES (?, ?, ?)';
    db.query(sql, [user_id, subject, message], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error al crear ticket' });
        res.status(201).json({ message: 'Ticket enviado correctamente' });
    });
});

// Obtener tickets por usuario
app.get('/tickets', (req, res) => {
    const { user_id } = req.query;
    db.query(
        'SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC',
        [user_id],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Error al obtener tickets' });
            res.json(result);
        }
    );
});

// Obtener todos los tickets (admin)
app.get('/admin/tickets', (req, res) => {
    const sql = `
        SELECT t.*, u.username, u.email
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ message: 'Error al obtener tickets' });
        res.json(result);
    });
});

// Responder ticket (admin)
app.put('/admin/tickets/:id/respond', (req, res) => {
    const { id } = req.params;
    const { response } = req.body;
    // Concatenar la nueva respuesta al historial
    const sql = `
        UPDATE tickets 
        SET response = 
            IF(response IS NULL OR response = '', 
                CONCAT('[Admin]: ', ?), 
                CONCAT(response, '\n[Admin]: ', ?)
            ),
            status = 'Abierto'
        WHERE id = ?
    `;
    db.query(sql, [response, response, id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error al responder ticket' });
        res.json({ message: 'Respuesta enviada' });
    });
});

// Responder ticket (usuario)
app.put('/tickets/:id/reply', (req, res) => {
    const { id } = req.params;
    const { reply } = req.body;
    // Concatenar la respuesta del usuario al historial
    const sql = `
        UPDATE tickets 
        SET response = 
            IF(response IS NULL OR response = '', 
                CONCAT('[Usuario]: ', ?), 
                CONCAT(response, '\n[Usuario]: ', ?)
            ),
            status = 'Abierto'
        WHERE id = ?
    `;
    db.query(sql, [reply, reply, id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error al responder ticket' });
        res.json({ message: 'Respuesta enviada' });
    });
});

// Eliminar ticket (usuario o admin)
app.delete('/tickets/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM tickets WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error al eliminar ticket' });
        res.json({ message: 'Ticket eliminado' });
    });
});

// Autenticación - Mantener igual
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    const verification_token = uuidv4();
    const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
    const verifyUrl = `${BASE_URL}/verify?token=${verification_token}`;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        if (username === 'administrador') {
            // Crear admin sin verificación
            db.query(
                'INSERT INTO users (username, password, email, is_verified, role) VALUES (?, ?, ?, 1, "admin")',
                [username, hashedPassword, email],
                (err, result) => {
                    if (err) {
                        console.error('Error al registrar admin:', err);
                        return res.status(500).json({ message: 'Error al registrar el usuario' });
                    }
                    res.status(201).json({ message: 'Administrador creado correctamente. Ya puedes iniciar sesión.' });
                }
            );
        } else {
            // Registro normal con verificación
            db.query(
                'INSERT INTO users (username, password, email, verification_token) VALUES (?, ?, ?, ?)',
                [username, hashedPassword, email, verification_token],
                (err, result) => {
                    if (err) {
                        console.error('Error al registrar usuario:', err);
                        return res.status(500).json({ message: 'Error al registrar el usuario' });
                    }
                    // Envía el correo de verificación
                    transporter.sendMail({
                        from: 'TUCORREO@gmail.com',
                        to: email,
                        subject: 'Verifica tu correo',
                        html: `<h2>Bienvenido a Osadía</h2>
                               <p>Haz clic en el siguiente enlace para verificar tu correo:</p>
                               <a href="${verifyUrl}">${verifyUrl}</a>`
                    }, (err, info) => {
                        if (err) {
                            console.error('Error enviando correo:', err);
                            return res.status(500).json({ message: 'Error enviando correo de verificación' });
                        }
                        res.status(201).json({ message: 'Usuario registrado. Revisa tu correo para verificar tu cuenta.' });
                    });
                }
            );
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';

    db.query(sql, [username], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Error en el servidor' });
        if (results.length === 0) return res.status(401).json({ message: 'Autenticacion fallida' });

        try {
            const user = results[0];
            // Verifica si el usuario está verificado
            if (!user.is_verified) {
                return res.status(401).json({ message: 'Debes verificar tu correo antes de iniciar sesión.' });
            }
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) return res.status(401).json({ message: 'Autenticacion fallida' });

            res.json({ user_id: user.id, role: user.role, username: user.username, message: 'Autenticacion exitosa' });
        } catch (error) {
            console.error('Error al verificar contraseña:', error);
            res.status(500).json({ message: 'Error en el servidor' });
        }
    });
});

app.get('/verify', (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).send('Token inválido');
    const sql = 'UPDATE users SET is_verified = 1, verification_token = NULL WHERE verification_token = ?';
    db.query(sql, [token], (err, result) => {
        if (err || result.affectedRows === 0) {
            return res.status(400).send('Token inválido o expirado');
        }
        // Redirige al frontend para login automático
        res.redirect(`http://localhost:3000/verified?token=${token}`);
    });
});

app.get('/user-by-token', (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Token requerido' });

    const sql = 'SELECT id, username FROM users WHERE verification_token = ? OR (is_verified = 1 AND verification_token IS NULL)';
    db.query(sql, [token], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ message: 'Token inválido o usuario no encontrado' });
        }
        res.json({ user_id: results[0].id, username: results[0].username });
    });
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
    console.error('Error en el servidor:', err.stack);
    res.status(500).json({ message: 'Algo salio mal!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
