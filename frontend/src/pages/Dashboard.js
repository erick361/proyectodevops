import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const backendUrl = 'http://localhost:5000';

const generateBaseTimes = () => {
    const times = [];
    for (let hour = 12; hour <= 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const formattedHour = hour.toString().padStart(2, '0');
            const formattedMinute = minute.toString().padStart(2, '0');
            times.push(`${formattedHour}:${formattedMinute}`);
        }
    }
    return times;
};
const availableTimes = generateBaseTimes();

function AdminPanel({ onClose }) {
    const [allReservations, setAllReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });
    const [filter, setFilter] = useState({ location: '', date: '', time: '' });
    const [adminSection, setAdminSection] = useState(''); // '', 'reservas', 'usuarios', 'crear'
    const [users, setUsers] = useState([]);
    const [selectedUserForReservation, setSelectedUserForReservation] = useState(null);
    const [forcedReservation, setForcedReservation] = useState({
        date: '',
        time: '',
        guests: 1,
        special_requests: '',
        location: ''
    });
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('');
    const userId = localStorage.getItem('user_id');
    const userRole = localStorage.getItem('role');
    const username = localStorage.getItem('username'); // Guarda el username en localStorage al hacer login

    const [showDeleteUser, setShowDeleteUser] = useState(false);
    const [deleteSequence, setDeleteSequence] = useState('');
    const [userToDelete, setUserToDelete] = useState(null);
    const [adminPasswordInput, setAdminPasswordInput] = useState('');
    const [deleteStep, setDeleteStep] = useState(0);

    const [tickets, setTickets] = useState([]);
    const [ticketToRespond, setTicketToRespond] = useState(null);
    const [ticketResponse, setTicketResponse] = useState('');

    const [forceDate, setForceDate] = useState('');
    const [forceLocation, setForceLocation] = useState('');
    const [forceAvailableTimes, setForceAvailableTimes] = useState([]);
    const [forceTime, setForceTime] = useState('');

    useEffect(() => {
        if (adminSection === 'tickets') {
            axios.get(`${backendUrl}/admin/tickets`)
                .then(res => setTickets(res.data));
        }
    }, [adminSection, backendUrl]);

    useEffect(() => {
        if (username !== 'administrador') return;
        const handleKeyDown = (e) => {
            setDeleteSequence(seq => {
                const next = (seq + e.key).slice(-11);
                if (next === 'borrar1234') {
                    setShowDeleteUser(true);
                    setTimeout(() => setDeleteSequence(''), 500);
                }
                return next;
            });
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [username]);

    // Cargar reservas solo cuando adminSection es 'reservas'
    useEffect(() => {
        if (adminSection === 'reservas') {
            setLoading(true);
            axios.get(`${backendUrl}/admin/reservations`)
                .then(res => setAllReservations(res.data))
                .finally(() => setLoading(false));
        }
    }, [adminSection]);

    // Cargar usuarios solo cuando adminSection es 'usuarios'
    useEffect(() => {
        if (adminSection === 'usuarios') {
            axios.get(`${backendUrl}/admin/users`)
                .then(res => setUsers(res.data));
        }
    }, [adminSection]);

    useEffect(() => {
        if (forceDate && forceLocation) {
            axios.get(`${backendUrl}/admin/reservations-by-date`, {
                params: { date: forceDate, location: forceLocation }
            }).then(res => {
                const occupiedTimes = res.data.map(r => r.time.slice(0, 5));
                const allTimes = generateBaseTimes();
                const available = allTimes.filter(t => !occupiedTimes.includes(t));
                setForceAvailableTimes(available);
            });
        }
    }, [forceDate, forceLocation]);

    useEffect(() => {
        if (
            selectedUserForReservation &&
            forcedReservation.date &&
            forcedReservation.location
        ) {
            const fetchAvailableTimes = async () => {
                const baseTimes = generateBaseTimes();
                const available = [];
                for (const time of baseTimes) {
                    try {
                        const res = await axios.get(`${backendUrl}/availability`, {
                            params: {
                                date: forcedReservation.date,
                                time,
                                location: forcedReservation.location,
                            },
                        });
                        if (res.data.available) {
                            available.push(time);
                        }
                    } catch (err) {
                        // Maneja el error si es necesario
                    }
                }
                setForceAvailableTimes(available);
            };
            fetchAvailableTimes();
        } else {
            setForceAvailableTimes([]); // Limpia si falta fecha o ubicación
        }
        // eslint-disable-next-line
    }, [forcedReservation.date, forcedReservation.location]);

    const handleCancel = (id) => {
        axios.delete(`${backendUrl}/reservations/${id}`, { data: { isAdmin: true } })
            .then(() => setAllReservations(allReservations.filter(r => r.id !== id)));
    };

    const handleComment = (id) => {
        axios.put(`${backendUrl}/admin/reservations/${id}/comment`, { comment })
            .then(() => {
                setAllReservations(allReservations.map(r => r.id === id ? { ...r, admin_comment: comment } : r));
                setComment('');
                setSelectedReservation(null);
            });
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        await axios.post(`${backendUrl}/admin/create-user`, {
            admin_id: userId, // El id del admin principal logueado
            ...newUser
        });
        setNewUser({ username: '', email: '', password: '', role: 'user' });
        alert('Usuario creado correctamente');
    };

    const handleChangeRole = (userIdToChange, newRole) => {
        axios.put(`${backendUrl}/admin/users/${userIdToChange}/role`, {
            role: newRole,
            admin_id: userId // El id del admin principal logueado
        })
        .then(() => {
            setUsers(users.map(u => u.id === userIdToChange ? { ...u, role: newRole } : u));
        });
    };

    const filteredReservations = allReservations.filter(r => {
        // Normaliza la fecha a YYYY-MM-DD
        const reservationDate = r.date ? r.date.slice(0, 10) : '';
        // Normaliza la hora a HH:MM
        const reservationTime = r.time ? r.time.slice(0, 5) : '';
        return (
            (!filter.location || r.location === filter.location) &&
            (!filter.date || reservationDate === filter.date) &&
            (!filter.time || reservationTime === filter.time)
        );
    });

    const filteredUsers = users.filter(u =>
        (!userRoleFilter || u.role === userRoleFilter) &&
        (
            u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearch.toLowerCase())
        )
    );

    return (
        <div className="admin-panel">
            <div style={{ marginBottom: 30 }}>
                <button onClick={() => setAdminSection('reservas')}>Ver Reservas</button>
                <button onClick={() => setAdminSection('usuarios')}>Ver Usuarios</button>
                <button onClick={() => setAdminSection('crear')}>Crear Usuario</button>
                <button onClick={() => setAdminSection('tickets')}>Tickets</button>
                <button onClick={onClose}>Cerrar Panel</button>
            </div>
            {/* Solo muestra la sección seleccionada */}
            {adminSection === 'reservas' && (
                <>
                    <div style={{ marginBottom: 20 }}>
                        <select value={filter.location} onChange={e => setFilter({ ...filter, location: e.target.value })}>
                            <option value="">Todas las ubicaciones</option>
                            <option value="San Pedro">San Pedro</option>
                            <option value="Monterrey">Monterrey</option>
                            <option value="Guadalupe">Guadalupe</option>
                        </select>
                        <input
                            type="date"
                            value={filter.date}
                            onChange={e => setFilter({ ...filter, date: e.target.value })}
                            style={{ marginLeft: 10, marginRight: 10 }}
                        />
                        <select
                            value={filter.time}
                            onChange={e => setFilter({ ...filter, time: e.target.value })}
                            style={{ marginRight: 10 }}
                        >
                            <option value="">Todas las horas</option>
                            {availableTimes.map(time => (
                                <option key={time} value={time}>{time}</option>
                            ))}
                        </select>
                    </div>
                    {loading ? <div>Cargando...</div> : (
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Usuario</th>
                                    <th>Fecha</th>
                                    <th>Hora</th>
                                    <th>Ubicación</th>
                                    <th>Estado</th>
                                    <th>Comentario Usuario</th> {/* <-- agrega esta columna */}
                                    <th>Comentario Admin</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReservations.map(r => (
                                    <tr key={r.id}>
                                        <td>{r.id}</td>
                                        <td>{r.username}</td>
                                        <td>{r.date}</td>
                                        <td>{r.time}</td>
                                        <td>{r.location}</td>
                                        <td>{r.status}</td>
                                        <td>{r.special_requests || ''}</td> {/* <-- muestra el comentario del usuario */}
                                        <td>{r.admin_comment || ''}</td>
                                        <td>
                                            <button onClick={() => handleCancel(r.id)}>Cancelar</button>
                                            <button onClick={() => setSelectedReservation(r.id)}>Comentar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {selectedReservation && (
                        <div>
                            <input
                                type="text"
                                placeholder="Comentario para el usuario"
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                            />
                            <button onClick={() => handleComment(selectedReservation)}>Guardar Comentario</button>
                            <button onClick={() => setSelectedReservation(null)}>Cancelar</button>
                        </div>
                    )}
                </>
            )}
            {adminSection === 'usuarios' && (
                <>
                    <div style={{ marginBottom: 15 }}>
                        <input
                            type="text"
                            placeholder="Buscar usuario o email"
                            value={userSearch}
                            onChange={e => setUserSearch(e.target.value)}
                            style={{ marginRight: 10, padding: '6px 10px' }}
                        />
                        <select
                            value={userRoleFilter}
                            onChange={e => setUserRoleFilter(e.target.value)}
                            style={{ padding: '6px 10px' }}
                        >
                            <option value="">Todos los roles</option>
                            <option value="user">Usuario</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => (
                                <tr key={u.id}>
                                    <td>{u.id}</td>
                                    <td>{u.username}</td>
                                    <td>{u.email}</td>
                                    <td>
                                        {username === 'administrador' ? (
                                            <>
                                                <select
                                                    value={u.role}
                                                    onChange={e => handleChangeRole(u.id, e.target.value)}
                                                    disabled={u.username === 'administrador'}
                                                >
                                                    <option value="user">Usuario</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                                <button onClick={() => setSelectedUserForReservation(u)}>Agregar reserva</button>
                                                {showDeleteUser && u.username !== 'administrador' && (
                                                    <button
                                                        style={{ background: 'red', color: 'white', marginLeft: 8 }}
                                                        onClick={() => {
                                                            setUserToDelete(u);
                                                            setDeleteStep(1);
                                                        }}
                                                    >
                                                        Borrar
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {u.role}
                                                <button onClick={() => setSelectedUserForReservation(u)}>Agregar reserva</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
            {userToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        {deleteStep === 1 && (
                            <>
                                <h3>¿Seguro que quieres borrar al usuario <b>{userToDelete.username}</b>?</h3>
                                <button onClick={() => setDeleteStep(2)}>Sí, estoy seguro</button>
                                <button onClick={() => { setUserToDelete(null); setDeleteStep(0); }}>Cancelar</button>
                            </>
                        )}
                        {deleteStep === 2 && (
                            <>
                                <h3>¿Realmente estás seguro? Esta acción no se puede deshacer.</h3>
                                <button onClick={() => setDeleteStep(3)}>Sí, continuar</button>
                                <button onClick={() => { setUserToDelete(null); setDeleteStep(0); }}>Cancelar</button>
                            </>
                        )}
                        {deleteStep === 3 && (
                            <>
                                <h3>Introduce tu contraseña de administrador para confirmar:</h3>
                                <input
                                    type="password"
                                    value={adminPasswordInput}
                                    onChange={e => setAdminPasswordInput(e.target.value)}
                                    placeholder="Contraseña de admin"
                                />
                                <button
                                    onClick={async () => {
                                        // Verifica la contraseña de admin antes de borrar
                                        try {
                                            await axios.post(`${backendUrl}/admin/verify-password`, {
                                                username: 'administrador',
                                                password: adminPasswordInput
                                            });
                                            await axios.delete(`${backendUrl}/admin/users/${userToDelete.id}`);
                                            setUsers(users.filter(u => u.id !== userToDelete.id));
                                            alert('Usuario eliminado correctamente');
                                            setUserToDelete(null);
                                            setDeleteStep(0);
                                            setAdminPasswordInput('');
                                        } catch (err) {
                                            alert('Contraseña incorrecta o error al eliminar usuario');
                                        }
                                    }}
                                >
                                    Confirmar Borrado
                                </button>
                                <button onClick={() => { setUserToDelete(null); setDeleteStep(0); setAdminPasswordInput(''); }}>Cancelar</button>
                            </>
                        )}
                    </div>
                </div>
            )}
            {selectedUserForReservation && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Agregar reserva a {selectedUserForReservation.username}</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            await axios.post(`${backendUrl}/admin/force-reservation`, {
                                ...forcedReservation,
                                user_id: selectedUserForReservation.id
                            });
                            alert('Reserva forzada creada');
                            setSelectedUserForReservation(null);
                        }}>
                            <input
                                type="date"
                                value={forcedReservation.date}
                                onChange={e => setForcedReservation({ ...forcedReservation, date: e.target.value })}
                            />
                            <select
                                value={forcedReservation.location}
                                onChange={e => setForcedReservation({ ...forcedReservation, location: e.target.value })}
                            >
                                <option value="">Ubicación</option>
                                <option value="San Pedro">San Pedro</option>
                                <option value="Monterrey">Monterrey</option>
                                <option value="Guadalupe">Guadalupe</option>
                            </select>
                            <select
                                value={forcedReservation.time}
                                onChange={e => setForcedReservation({ ...forcedReservation, time: e.target.value })}
                                required
                                disabled={!forceAvailableTimes.length}
                            >
                                <option value="">Selecciona una hora</option>
                                {forceAvailableTimes.map(time => (
                                    <option key={time} value={time}>{time}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={forcedReservation.guests}
                                min="1"
                                max="20"
                                onChange={e => setForcedReservation({ ...forcedReservation, guests: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Peticiones especiales"
                                value={forcedReservation.special_requests}
                                onChange={e => setForcedReservation({ ...forcedReservation, special_requests: e.target.value })}
                            />
                            <button type="submit">Crear reserva</button>
                            <button type="button" onClick={() => setSelectedUserForReservation(null)}>Cancelar</button>
                        </form>
                    </div>
                </div>
            )}
            {adminSection === 'crear' && (
                <form onSubmit={handleCreateUser} style={{ marginBottom: 30 }}>
                    <h3>Crear nuevo usuario</h3>
                    <input type="text" placeholder="Usuario" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} required />
                    <input type="email" placeholder="Correo" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                    <input type="password" placeholder="Contraseña" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                    <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                        <option value="user">Usuario</option>
                        <option value="admin">Administrador</option>
                    </select>
                    <button type="submit">Crear usuario</button>
                </form>
            )}
            {adminSection === 'tickets' && (
                <div>
                    <h2>Tickets de Servicio al Cliente</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Asunto</th>
                                <th>Mensaje</th>
                                <th>Respuesta</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map(ticket => (
                                <tr key={ticket.id}>
                                    <td>{ticket.id}</td>
                                    <td>{ticket.username}</td>
                                    <td>{ticket.email}</td>
                                    <td>{ticket.subject}</td>
                                    <td>{ticket.message}</td>
                                    <td>{ticket.response || ''}</td>
                                    <td>{ticket.status}</td>
                                    <td>
                                        {ticket.status === 'Abierto' && (
                                            <button onClick={() => setTicketToRespond(ticket)}>Responder</button>
                                        )}
                                        <button
                                            style={{ marginLeft: 8, background: '#b22222', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}
                                            onClick={async () => {
                                                if (window.confirm('¿Seguro que deseas eliminar este ticket?')) {
                                                    await axios.delete(`${backendUrl}/tickets/${ticket.id}`);
                                                    setTickets(tickets.filter(t => t.id !== ticket.id));
                                                }
                                            }}
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Modal para responder */}
                    {ticketToRespond && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h3>Responder Ticket #{ticketToRespond.id}</h3>
                                <textarea
                                    value={ticketResponse}
                                    onChange={e => setTicketResponse(e.target.value)}
                                    placeholder="Respuesta"
                                    rows={4}
                                />
                                <button onClick={async () => {
                                    await axios.put(`${backendUrl}/admin/tickets/${ticketToRespond.id}/respond`, {
                                        response: ticketResponse
                                    });
                                    setTicketResponse('');
                                    // NO cierres el modal aquí, solo recarga los tickets:
                                    axios.get(`${backendUrl}/admin/tickets`)
                                        .then(res => setTickets(res.data));
                                }}>Enviar Respuesta</button>
                                <button onClick={() => setTicketToRespond(null)}>Cancelar</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function Dashboard() {
    const [reservations, setReservations] = useState([]);
    const [newReservation, setNewReservation] = useState({
        date: '',
        time: '',
        guests: 1,
        special_requests: '',
        location: ''
    });
    const [editReservation, setEditReservation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [timeAvailability, setTimeAvailability] = useState({});
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [step, setStep] = useState(1); // Controlar el paso del flujo

    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [adminError, setAdminError] = useState('');
    const [showAdminPanel, setShowAdminPanel] = useState(false);

    const [showTicketModal, setShowTicketModal] = useState(false);
    const [showUserTickets, setShowUserTickets] = useState(false);
    const [userTickets, setUserTickets] = useState([]);
    const [ticketSubject, setTicketSubject] = useState('');
    const [ticketMessage, setTicketMessage] = useState('');
    const [ticketSuccess, setTicketSuccess] = useState('');
    const [ticketError, setTicketError] = useState('');
    const [replyMessage, setReplyMessage] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);

    const MAX_CAPACITY = 30;

    const username = localStorage.getItem('username');

    const [showDeleteUser, setShowDeleteUser] = useState(false);
    const [deleteSequence, setDeleteSequence] = useState('');

    useEffect(() => {
        if (username !== 'administrador') return;
        const handleKeyDown = (e) => {
            setDeleteSequence(seq => {
                const next = (seq + e.key).slice(-11);
                if (next === 'borrar1234') {
                    setShowDeleteUser(true);
                    setTimeout(() => setDeleteSequence(''), 500);
                }
                return next;
            });
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [username]);

    useEffect(() => {
        setAvailableTimes(generateBaseTimes());
        // No llames a fetchReservations aquí si no hay ubicación seleccionada
    }, []);

    useEffect(() => {
        if (selectedDate && selectedLocation) {
            checkAvailabilityForDate(selectedDate);
        }
    }, [selectedDate, selectedLocation]);

    useEffect(() => {
        if (selectedLocation) {
            fetchReservations();
        }
    }, [selectedLocation]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (
                localStorage.getItem('role') === 'admin' &&
                e.key.toLowerCase() === 's'
            ) {
                window.addEventListener('keydown', (ev) => {
                    if (ev.key.toLowerCase() === 'e') {
                        setShowAdminModal(true);
                    }
                }, { once: true });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const checkAvailabilityForDate = async (date) => {
        if (!selectedLocation) return;

        try {
            const availability = {};
            for (const time of availableTimes) {
                const response = await axios.get(`${backendUrl}/availability`, {
                    params: {
                        date,
                        time,
                        location: selectedLocation
                    }
                });
                availability[time] = response.data;
            }
            setTimeAvailability(availability);
        } catch (err) {
            console.error('Error al verificar disponibilidad:', err);
        }
    };

    const fetchReservations = async () => {
        const user_id = localStorage.getItem('user_id');
        const res = await axios.get(`${backendUrl}/reservations?user_id=${user_id}&location=${selectedLocation}`);
        setReservations(res.data);
        setLoading(false);
    };

    const fetchUserTickets = async () => {
        const user_id = localStorage.getItem('user_id');
        const res = await axios.get(`${backendUrl}/tickets?user_id=${user_id}`);
        setUserTickets(res.data);
    };

    const handleAddReservation = async (e) => {
        e.preventDefault();
        try {
            const user_id = localStorage.getItem('user_id');
            await axios.post(`${backendUrl}/reservations`, { 
                ...newReservation, 
                user_id, 
                location: selectedLocation // <-- Esto es clave
            });
            setNewReservation({ date: '', time: '', guests: 1, special_requests: '', location: '' });
            fetchReservations();
            alert('¡Reserva creada con éxito! Nuestro equipo la confirmará pronto.');
        } catch (err) {
            console.error('Error adding reservation:', err);
            if (err.response && err.response.data && err.response.status === 400) {
                setError(`${err.response.data.message}. Asientos disponibles: ${err.response.data.availableSeats}`);
            } else {
                setError('No pudimos crear la reserva. Por favor, intenta nuevamente.');
            }
        }
    };

    const handleUpdateReservation = async (e) => {
        e.preventDefault();
        try {
            const user_id = localStorage.getItem('user_id');
            await axios.put(`${backendUrl}/reservations/${editReservation.id}`, { 
                ...newReservation, 
                user_id, 
                location: selectedLocation // <-- Esto es clave
            });
            setEditReservation(null);
            setNewReservation({ date: '', time: '', guests: 1, special_requests: '', location: '' });
            fetchReservations();
            alert('Reserva actualizada correctamente');
        } catch (err) {
            console.error('Error al actualizar la reserva:', err);
            setError('No pudimos actualizar la reserva. Por favor, intenta nuevamente.');
        }
    };

    const handleCancelReservation = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
            try {
                const user_id = localStorage.getItem('user_id');
                await axios.delete(`${backendUrl}/reservations/${id}`, {
                    data: { user_id }
                });
                fetchReservations(); // Actualiza la lista de reservas
                alert('Reserva cancelada correctamente');
            } catch (err) {
                console.error('Error al cancelar la reserva:', err);
                setError('No pudimos cancelar la reserva. Por favor, intenta nuevamente.');
            }
        }
    };

    const handleLocationSelection = (location) => {
        setSelectedLocation(location);
        setNewReservation({ date: '', time: '', guests: 1, special_requests: '', location: '' });
        setStep(2);
    };

    const handleDateChange = (e) => {
        const dateValue = e.target.value;
        setNewReservation({ ...newReservation, date: dateValue });
        setSelectedDate(dateValue);
    };

    const getFilteredTimes = () => {
        if (!selectedDate || Object.keys(timeAvailability).length === 0) {
            return availableTimes;
        }

        return availableTimes.filter((time) => {
            const availability = timeAvailability[time];

            const availableSeats = availability.availableSeats;
            return availableSeats > 0;
        });
    };

    const handleBackToLocationSelection = () => {
        setStep(1); // Regresar al paso de selección de ubicación
        setSelectedLocation(''); // Limpiar la ubicación seleccionada
    };

    const handleEditReservation = (reservation) => {
        setEditReservation(reservation);
        setNewReservation({
            date: reservation.date,
            time: reservation.time,
            guests: reservation.guests,
            special_requests: reservation.special_requests,
            location: reservation.location
        });
        setSelectedDate(reservation.date); // Para habilitar el select de hora
        setSelectedLocation(reservation.location); // Para que la ubicación se muestre seleccionada
        setStep(2);
    };

    const handleSendTicket = async (e) => {
        e.preventDefault();
        setTicketError('');
        setTicketSuccess('');
        try {
            const user_id = localStorage.getItem('user_id');
            await axios.post(`${backendUrl}/tickets`, {
                user_id,
                subject: ticketSubject,
                message: ticketMessage
            });
            setTicketSuccess('¡Ticket enviado! Pronto recibirás respuesta.');
            setTicketSubject('');
            setTicketMessage('');
        } catch (err) {
            setTicketError('No se pudo enviar el ticket. Intenta de nuevo.');
        }
    };

    return (
        <div className="restaurant-container container">
            <div className="restaurant-header">
                <h1>Restaurante Osadía</h1>
                <div className="restaurant-actions">
                    <button onClick={() => window.location.href = '/menu'}>Ver Menú</button>
                    <button onClick={() => {
                        localStorage.removeItem('user_id');
                        window.location.href = '/login';
                    }} className="btn-danger">Cerrar Sesión</button>
                </div>
            </div>

            {/* SOLO muestra el footer institucional cuando step === 1 */}
            {step === 1 && (
                <>
                    <div className="location-selection">
                        <h2>Selecciona tu ubicación</h2>
                        <div className="location-buttons">
                            <button onClick={() => handleLocationSelection('San Pedro')}>San Pedro</button>
                            <button onClick={() => handleLocationSelection('Monterrey')}>Monterrey</button>
                            <button onClick={() => handleLocationSelection('Guadalupe')}>Guadalupe</button>
                        </div>
                    </div>
                    {/* Footer institucional SOLO visible en step 1 */}
                    <footer
                        style={{
                            background: '#D2B48C',
                            color: '#333',
                            padding: '40px 0 20px 0',
                            borderTop: '3px solid #8B4513',
                            width: '100%',
                            position: 'fixed',
                            left: 0,
                            bottom: 0,
                            zIndex: 999,
                        }}
                    >
                        <div style={{
                            maxWidth: 1200,
                            margin: '0 auto',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 30
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                <img src="/logo.png" alt="Restaurante Osadía" style={{ width: 60, height: 60, borderRadius: 12, background: '#fff', padding: 6 }} />
                                <div>
                                    <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontWeight: 700 }}>Restaurante Osadía</h3>
                                    <div style={{ fontSize: 14, color: '#555' }}>Sabor, tradición y elegancia</div>
                                </div>
                            </div>
                            <div style={{ fontSize: 15, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <a href="/quienes-somos" style={{ color: '#333', textDecoration: 'none' }}>Quiénes somos</a>
                                <a href="/politicas" style={{ color: '#333', textDecoration: 'none' }}>Políticas de privacidad</a>
                                <a href="/contacto" style={{ color: '#333', textDecoration: 'none' }}>Contacto</a>
                            </div>
                            <div style={{ fontSize: 13, color: '#555', marginTop: 10 }}>
                                © {new Date().getFullYear()} Restaurante Osadía. Todos los derechos reservados.
                            </div>
                        </div>
                    </footer>
                </>
            )}

            {step === 2 && (
                <div className="restaurant-content">
                    <div className="restaurant-form">
                        <h2>{editReservation ? 'Editar Reserva' : 'Realizar Nueva Reserva'}</h2>
                        <form onSubmit={editReservation ? handleUpdateReservation : handleAddReservation}>
                            <div className="form-group">
                                <label>Fecha</label>
                                <input
                                    type="date"
                                    value={newReservation.date}
                                    onChange={handleDateChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Hora</label>
                                <select
                                    value={newReservation.time}
                                    onChange={(e) => setNewReservation({ ...newReservation, time: e.target.value })}
                                    required
                                    disabled={!selectedDate}
                                >
                                    <option value="">Seleccione una hora</option>
                                    {getFilteredTimes().map((time) => (
                                        <option key={time} value={time}>
                                            {time}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Ubicación</label>
                                <div style={{ fontWeight: 'bold', marginTop: 8 }}>{selectedLocation}</div>
                            </div>
                            <div className="form-group">
                                <label>Número de personas</label>
                                <input
                                    type="number"
                                    value={newReservation.guests}
                                    onChange={(e) => setNewReservation({ ...newReservation, guests: e.target.value })}
                                    min="1"
                                    max="20"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Peticiones especiales</label>
                                <textarea
                                    value={newReservation.special_requests}
                                    onChange={(e) => setNewReservation({ ...newReservation, special_requests: e.target.value })}
                                    placeholder="Celebraciones, alergias, preferencias de mesa, etc."
                                    rows="3"
                                />
                            </div>
                            <button type="submit" className="btn-primary">
                                {editReservation ? 'Guardar Cambios' : 'Confirmar Reserva'}
                            </button>
                            {editReservation && (
                                <button 
                                    type="button" 
                                    onClick={() => setEditReservation(null)} 
                                    className="btn-cancel"
                                    style={{ marginTop: '10px' }}
                                >
                                    Cancelar Edición
                                </button>
                            )}
                        </form>
                        <button
                            onClick={handleBackToLocationSelection}
                            className="btn-cancel"
                            style={{ marginTop: '15px' }}
                        >
                            Cambiar Ubicación
                        </button>
                    </div>

                    <div className="reservations-list">
                        <h2>Mis Reservas</h2>
                        
                        {loading ? (
                            <div className="loading">
                                <div className="loading-spinner"></div>
                                <p>Cargando reservas...</p>
                            </div>
                        ) : reservations.length === 0 ? (
                            <div className="message">
                                No tienes reservaciones. ¡Crea tu primera reserva ahora!
                            </div>
                        ) : (
                            <div className="reservations-grid">
                                {reservations.map(reservation => (
                                    <div 
                                        className={`reservation-card ${
                                            new Date(reservation.date) < new Date() ? 'past-reservation' : ''
                                        }`} 
                                        key={reservation.id}
                                    >
                                        <div className="reservation-header">
                                            <span className={`reservation-status ${reservation.status.toLowerCase()}`}>
                                                {reservation.status}
                                            </span>
                                            <span className="reservation-date">
                                                {format(new Date(reservation.date), 'PPP', { locale: es })}
                                            </span>
                                        </div>
                                        <div className="reservation-details">
                                            <div className="reservation-location">
                                                <i className="fas fa-map-marker-alt"></i> {reservation.location}
                                            </div>
                                            <div className="reservation-time">
                                                <i className="far fa-clock"></i> {reservation.time}h
                                            </div>
                                            <div className="reservation-guests">
                                                <i className="fas fa-user-friends"></i> {reservation.guests} {reservation.guests === 1 ? 'persona' : 'personas'}
                                            </div>
                                            {reservation.special_requests && (
                                                <div className="reservation-requests">
                                                    <strong>Peticiones especiales:</strong>
                                                    <p>{reservation.special_requests}</p>
                                                </div>
                                            )}
                                            {reservation.admin_comment && (
                                                <div className="reservation-requests">
                                                    <strong>Comentario del administrador:</strong>
                                                    <p>{reservation.admin_comment}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="reservation-actions">
                                            <button 
                                                onClick={() => handleEditReservation(reservation)} 
                                                className="btn-primary"
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                onClick={() => handleCancelReservation(reservation.id)} 
                                                className="btn-danger"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showAdminModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Panel de Administrador</h2>
                        <input
                            type="password"
                            placeholder="Contraseña de administrador"
                            value={adminPassword}
                            onChange={e => setAdminPassword(e.target.value)}
                        />
                        <button
                            onClick={() => {
                                if (adminPassword === '1234') {
                                    setShowAdminPanel(true);
                                    setShowAdminModal(false);
                                    setAdminPassword('');
                                    setAdminError('');
                                } else {
                                    setAdminError('Contraseña incorrecta');
                                }
                            }}
                        >
                            Entrar
                        </button>
                        {adminError && <div className="error-message">{adminError}</div>}
                        <button onClick={() => setShowAdminModal(false)}>Cancelar</button>
                    </div>
                </div>
            )}

            {showAdminPanel && (
                <AdminPanel onClose={() => setShowAdminPanel(false)} backendUrl={backendUrl} />
            )}

            {showTicketModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ position: 'relative' }}>
                        {/* Botón X para cerrar */}
                        <button
                            onClick={() => setShowTicketModal(false)}
                            style={{
                                position: 'absolute',
                                top: 10,
                                right: 15,
                                background: 'none',
                                border: 'none',
                                fontSize: 24,
                                color: '#8B4513',
                                cursor: 'pointer',
                                zIndex: 2
                            }}
                            aria-label="Cerrar"
                        >
                            &times;
                        </button>
                        <h2>Servicio al Cliente</h2>
                        {!showUserTickets ? (
                            <>
                                <form onSubmit={handleSendTicket}>
                                    <input
                                        type="text"
                                        placeholder="Asunto"
                                        value={ticketSubject}
                                        onChange={e => setTicketSubject(e.target.value)}
                                        required
                                    />
                                    <textarea
                                        placeholder="Describe tu problema o pregunta"
                                        value={ticketMessage}
                                        onChange={e => setTicketMessage(e.target.value)}
                                        required
                                        rows={4}
                                    />
                                    <button type="submit">Enviar Ticket</button>
                                </form>
                                <button
                                    type="button"
                                    style={{ marginTop: 10 }}
                                    onClick={() => {
                                        fetchUserTickets();
                                        setShowUserTickets(true);
                                    }}
                                >
                                    Ver mis tickets
                                </button>
                            </>
                        ) : (
                            <div>
                                <button onClick={() => setShowUserTickets(false)}>← Volver</button>
                                <h3>Mis Tickets</h3>
                                {userTickets.length === 0 ? (
                                    <div>No tienes tickets enviados.</div>
                                ) : (
                                    userTickets.map(ticket => (
                                        <div key={ticket.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                                            <div><b>Asunto:</b> {ticket.subject}</div>
                                            <div><b>Mensaje:</b> {ticket.message}</div>
                                            <div>
                                                <b>Conversación:</b>
                                                {ticket.response
                                                    ? ticket.response.split('\n').map((line, idx) => <div key={idx}>{line}</div>)
                                                    : <div>Sin mensajes aún</div>
                                                }
                                            </div>
                                            {ticket.response && (
                                                <div>
                                                    <textarea
                                                        placeholder="Responder al admin"
                                                        value={selectedTicket === ticket.id ? replyMessage : ''}
                                                        onChange={e => {
                                                            setSelectedTicket(ticket.id);
                                                            setReplyMessage(e.target.value);
                                                        }}
                                                        rows={2}
                                                        style={{ width: '100%', marginTop: 8 }}
                                                    />
                                                    <button
                                                        onClick={async () => {
                                                            await axios.put(`${backendUrl}/tickets/${ticket.id}/reply`, { reply: replyMessage });
                                                            setReplyMessage('');
                                                            setSelectedTicket(null);
                                                            fetchUserTickets();
                                                        }}
                                                        style={{ marginTop: 5 }}
                                                    >
                                                        Enviar respuesta
                                                    </button>
                                                </div>
                                            )}
                                            <button
                                                style={{ marginTop: 8, background: '#b22222', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}
                                                onClick={async () => {
                                                    if (window.confirm('¿Seguro que deseas cerrar este ticket? Esta acción no se puede deshacer.')) {
                                                        await axios.delete(`${backendUrl}/tickets/${ticket.id}`);
                                                        fetchUserTickets();
                                                    }
                                                }}
                                            >
                                                Cerrar Ticket
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        {ticketSuccess && <div className="message success-message">{ticketSuccess}</div>}
                        {ticketError && <div className="message error-message">{ticketError}</div>}
                    </div>
                </div>
            )}

            {/* Botón flotante de servicio al cliente */}
            <div
              style={{
                position: 'fixed',
                bottom: 175, // Ahora el doble de arriba (antes 100, ahora 200)
                right: 30,
                zIndex: 1000,
                background: '#8B4513',
                borderRadius: '50%',
                width: 60,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px #0003',
                cursor: 'pointer'
              }}
              onClick={() => setShowTicketModal(true)}
              title="Servicio al Cliente"
            >
              <i className="fas fa-headset" style={{ color: 'white', fontSize: 28 }}></i>
            </div>
        </div>
    );
}

export default Dashboard;