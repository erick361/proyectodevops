import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../App.css';

function Menu() {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadedImages, setLoadedImages] = useState({});
    
    const backendUrl = 'http://localhost:5000';

    // Usar useCallback para evitar re-creación de funciones
    const fetchMenu = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${backendUrl}/menu`);
            setMenuItems(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching menu:', err);
            setError('No pudimos cargar el menú. Por favor, intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    }, [backendUrl]);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await axios.get(`${backendUrl}/menu/categories`);
            setCategories(['Todos', ...response.data]);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    }, [backendUrl]);

    useEffect(() => {
        fetchMenu();
        fetchCategories();
    }, [fetchMenu, fetchCategories]);

    const handleBackToDashboard = () => {
        window.location.href = '/dashboard';
    };

    // Memorizar los elementos filtrados para evitar re-cálculos innecesarios
    const filteredMenuItems = React.useMemo(() => {
        return selectedCategory === 'Todos' 
            ? menuItems 
            : menuItems.filter(item => item.category === selectedCategory);
    }, [selectedCategory, menuItems]);

    // Manejador de cambio de categoría con prevención de re-renders innecesarios
    const handleCategoryChange = useCallback((category) => {
        if (category !== selectedCategory) {
            setSelectedCategory(category);
        }
    }, [selectedCategory]);

    return (
        <div className="restaurant-menu-container container">
            <div className="restaurant-header">
                <h1>Menú de Osadía</h1>
                <button onClick={handleBackToDashboard}>Volver a Reservas</button>
            </div>
            
            <div className="menu-categories">
                {categories.map(category => (
                    <button 
                        key={category}
                        className={selectedCategory === category ? 'active' : ''}
                        onClick={() => handleCategoryChange(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>
            
            {loading ? (
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Cargando menú...</p>
                </div>
            ) : error ? (
                <div className="message error-message">{error}</div>
            ) : filteredMenuItems.length === 0 ? (
                <div className="message">
                    No hay platos disponibles en esta categoría.
                </div>
            ) : (
                <div className="menu-grid">
                    {filteredMenuItems.map(item => (
                        <div className="menu-item-card" key={item.id}>
                            <div className="menu-item-details">
                                <div className="menu-item-category">{item.category}</div>
                                <h3 className="menu-item-title">{item.name}</h3>
                                <p className="menu-item-description">{item.description}</p>
                                <div className="menu-item-price">
                                    ${typeof item.price === 'number' 
                                        ? item.price.toFixed(2) 
                                        : parseFloat(item.price).toFixed(2) || '0.00'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default React.memo(Menu);