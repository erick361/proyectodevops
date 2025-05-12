import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../App.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const backendUrl = 'http://localhost:5000';

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post(`${backendUrl}/login`, { username, password });
            if (response.status === 200) {
                localStorage.setItem('user_id', response.data.user_id);
                localStorage.setItem('role', response.data.role);
                localStorage.setItem('username', response.data.username);
                window.location.href = '/dashboard';
            }
        } catch (error) {
            if (error.response && error.response.data) {
                setError(error.response.data.message);
            } else {
                setError('Error al iniciar sesión. Intente nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <img src="/logo.png" alt="Restaurante Osadía" />
                </div>
                
                <h1>Restaurante Osadía</h1>
                <h2>Inicia sesión en tu cuenta</h2>
                
                {error && <div className="message error-message">{error}</div>}
                
                <form onSubmit={handleLogin}>
                    <input 
                        type="text"
                        placeholder="Nombre de usuario"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input 
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Procesando...' : 'Iniciar Sesión'}
                    </button>
                </form>
                <div className="auth-link">
                    ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;
