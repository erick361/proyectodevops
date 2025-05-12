import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Verified() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const backendUrl = 'http://localhost:5000';

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (!token) {
            setError('Token inválido');
            setLoading(false);
            return;
        }
        // Llama al backend para obtener el usuario y loguearlo
        axios.get(`${backendUrl}/user-by-token`, { params: { token } })
            .then(res => {
                localStorage.setItem('user_id', res.data.user_id);
                window.location.href = '/dashboard';
            })
            .catch(() => {
                setError('No se pudo verificar el usuario.');
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="message">Verificando tu cuenta...</div>;
    if (error) return <div className="message error-message">{error}</div>;
    return null;
}

export default Verified;