import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../App.css';

function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // URL base del backend
    const backendUrl = 'http://localhost:5000';

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await axios.post(`${backendUrl}/register`, { username, password, email });
            alert('Usuario registrado. Revisa tu correo para verificar tu cuenta.');
            window.location.href = '/login';
        } catch (error) {
            if (error.response && error.response.data) {
                setError(error.response.data.message);
            } else {
                setError('Error al registrar el usuario. Intente nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="auth-card">
                {/* Agrega tu logo aquí */}
                <div className="auth-logo">
                    <img src="/logo.png" alt="Restaurante Osadía" />
                </div>
                
                <h1>Restaurante Osadía</h1>
                <h2>Crea tu cuenta</h2>
                
                {error && <div className="message error-message">{error}</div>}
                
                <form onSubmit={handleRegister}>
                    <input 
                        type="text"
                        placeholder="Nombre de usuario"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input 
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input 
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <input 
                        type="password"
                        placeholder="Confirmar contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Procesando...' : 'Registrarme'}
                    </button>
                </form>
                <div className="auth-link">
                    ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;