const mysql = require('mysql2/promise');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const db = require('./db'); // Asumiendo que tienes un módulo para manejar la conexión a la base de datos
const validateReservation = require('./middlewares/validateReservation'); // Middleware para validar reservas

app.use(bodyParser.json());

async function setupDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '19dic2005',
    });

    // Crear base de datos si no existe
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'base_de_datos'}`);
    
    // Usar la base de datos
    await connection.query(`USE ${process.env.DB_NAME || 'base_de_datos'}`);
    
    // Mantener la tabla de usuarios
    await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            is_verified TINYINT(1) DEFAULT 0,
            verification_token VARCHAR(255) DEFAULT NULL
        )
    `);
    
    // Nueva tabla para reservas
    await connection.query(`
        CREATE TABLE IF NOT EXISTS reservations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            date DATE NOT NULL,
            time TIME NOT NULL,
            guests INT NOT NULL,
            special_requests TEXT,
            status VARCHAR(50) NOT NULL,
            location ENUM('San Pedro', 'Monterrey', 'Guadalupe') NOT NULL,
            user_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);
    
    // Nueva tabla para menú
    await connection.query(`
        CREATE TABLE IF NOT EXISTS menu_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10, 2) NOT NULL,
            image VARCHAR(255),
            category VARCHAR(100) NOT NULL
        )
    `);
    
    // Insertar datos de prueba en el menú
    const menuExists = await connection.query('SELECT COUNT(*) as count FROM menu_items');
    if (menuExists[0][0].count === 0) {
        await connection.query(`
            INSERT INTO menu_items (name, description, price, image, category) VALUES 
            ('Carpaccio de Res', 'Finas láminas de res con aceite de oliva, limón y parmesano', 18.50, '/public/carpaccio.jpg', 'Entradas'),
            ('Risotto de Hongos', 'Arroz arborio con variedad de hongos silvestres y trufa', 22.00, '/public/risotto.jpg', 'Platos Principales'),
            ('Salmón a la Parrilla', 'Filete de salmón con salsa de eneldo y limón', 26.00, '/public/salmon.jpg', 'Platos Principales'),
            ('Tiramisú', 'Clásico postre italiano con café y mascarpone', 12.00, '/public/tiramisu.jpg', 'Postres'),
            ('Ensalada César', 'Lechuga romana, crutones, parmesano y aderezo césar', 14.00, '/public/ensalada.jpg', 'Entradas'),
            ('Filete Mignon', 'Corte premium de res con salsa de vino tinto', 32.00, '/public/filete.jpg', 'Platos Principales'),
            ('Pasta Carbonara', 'Espagueti con salsa cremosa, panceta y huevo', 19.50, '/public/carbonara.jpg', 'Platos Principales'),
            ('Crème Brûlée', 'Postre francés con crema y azúcar caramelizado', 10.00, '/public/cremebrulee.jpg', 'Postres')
        `);
    }
    
    console.log('Base de datos inicializada correctamente');
    connection.end();
}

app.post('/reservations', validateReservation, (req, res) => {
    const { date, time, guests, special_requests, location, user_id } = req.body;
    const MAX_CAPACITY = 30; // Capacidad máxima por horario y ubicación
    const status = 'Pendiente'; // Status inicial para todas las reservas

    // Verificar disponibilidad por ubicación
    const checkSql = `
        SELECT SUM(guests) as total_guests 
        FROM reservations 
        WHERE date = ? AND time = ? AND location = ? AND status != "Cancelada"
    `;

    db.query(checkSql, [date, time, location], (err, result) => {
        if (err) {
            console.error('Error al verificar disponibilidad:', err);
            return res.status(500).json({ message: 'Error al verificar disponibilidad' });
        }

        const totalGuests = result[0].total_guests || 0;
        const remainingCapacity = MAX_CAPACITY - totalGuests;

        if (Number(guests) > remainingCapacity) {
            return res.status(400).json({
                message: `No hay suficiente capacidad para esta reserva en ${location}. Solo quedan ${remainingCapacity} lugares disponibles.`,
                availableSeats: remainingCapacity
            });
        }

        // Crear la reserva
        const sql = `
            INSERT INTO reservations (date, time, guests, special_requests, status, location, user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [date, time, guests, special_requests, status, location, user_id], (err, result) => {
            if (err) {
                console.error('Error al crear reserva:', err);
                return res.status(500).json({ message: 'Error al crear la reserva' });
            }
            res.status(201).json({ id: result.insertId, message: 'Reserva creada exitosamente' });
        });
    });
});

app.get('/availability', (req, res) => {
    const { date, time, location } = req.query;
    const MAX_CAPACITY = 30; // Capacidad máxima por horario y ubicación

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

setupDatabase().catch(console.error);

app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});