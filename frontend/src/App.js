import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Menu from './pages/Menu'; // Renombrado de Purchase a Menu
import Verified from './pages/Verified';
import QuienesSomos from './pages/QuienesSomos';
import Politicas from './pages/Politicas';
import Contacto from './pages/Contacto';
import './App.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/menu" element={<Menu />} /> {/* Actualizado nombre de ruta */}
                <Route path="/verified" element={<Verified />} />
                <Route path="/quienes-somos" element={<QuienesSomos />} />
                <Route path="/politicas" element={<Politicas />} />
                <Route path="/contacto" element={<Contacto />} />
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;


