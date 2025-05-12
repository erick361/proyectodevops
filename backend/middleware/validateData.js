const { body, validationResult } = require('express-validator');

const validateReservation = [
    body('date').isDate().withMessage('Se requiere una fecha válida'),
    body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora inválido (HH:MM)'),
    body('guests').isInt({ min: 1, max: 20 }).withMessage('El número de invitados debe ser entre 1 y 20'),
    body('special_requests').optional(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const validateVehicle = [
    body('name').notEmpty().withMessage('Name is required'),
    body('year').isInt({ min: 1886 }).withMessage('Year must be a valid number'),
    body('type').isIn(['SUV', 'Sedan']).withMessage('Type must be either SUV or Sedan'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = { validateReservation, validateVehicle };