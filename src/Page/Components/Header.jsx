// Header.js
import React, { useEffect, useState } from 'react';
import '../CSS/header.css'; // Mantenemos el mismo CSS
import pb from '../../services/database';

/**
 * Componente de encabezado reutilizable para el dashboard.
 * Este componente es autosuficiente y carga la información del usuario
 * directamente desde el authStore de PocketBase.
 * * @param {object} props
 * @param {string} props.title - Título principal de la página (ej: "Dashboard").
 * @param {string} props.subtitle - Subtítulo o mensaje de bienvenida (ej: "Bienvenido").
 * @returns {JSX.Element}
 */
export default function Header({ title }) {
    const [currentUser, setCurrentUser] = useState(null);

    // Lógica de autenticación movida al Header
    useEffect(() => {
        let isMounted = true;

        const readUser = async () => {
            if (!pb.authStore.isValid || !pb.authStore.model) {
                // Si no es válido, establecemos el usuario como nulo
                if (isMounted) setCurrentUser(null);
                return;
            }

            const authenticatedModel = pb.authStore.model;
            if (isMounted) setCurrentUser(authenticatedModel); // Usar el modelo básico de la tienda

            try {
                // Intenta obtener los datos completos del usuario
                const userData = await pb.collection('users').getOne(authenticatedModel.id, {
                    '$autoCancel': false // Buena práctica de cancelación de peticiones
                });
                if (isMounted) setCurrentUser(userData);
            } catch (error) {
                // Si falla la carga (ej. sin conexión), usamos el modelo básico que está en el store
                if (error.status !== 0 && isMounted && authenticatedModel) {
                    console.error('Error al obtener datos de usuario actualizados:', error);
                    setCurrentUser(authenticatedModel);
                }
            }
        };

        // Un pequeño retraso para asegurar que el store se haya cargado (similar a tu Dashboard original)
        const timer = setTimeout(() => {
            readUser();
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, []);
    
    // --- Funciones de Renderizado ---
    
    // Función auxiliar para obtener las iniciales del nombre
    const getInitials = (firstName, lastName) => {
        const first = firstName ? firstName[0] : '';
        // Asumiendo que 'apellido' es el campo para el apellido
        const last = lastName ? lastName[0] : '';
        return (first + last).toUpperCase();
    };

    const userName = currentUser?.name || currentUser?.username || 'Usuario Invitado';
    const userRole = currentUser?.role || 'Administrador'; // Asume un campo 'role' o default

    return (
        <header className="dashboard-header">
            <div className="header-left">
                <h1 className="page-title">{title}</h1>
            </div>

            <div className="header-right">
                {/* Botón de Notificaciones/Configuración (ejemplo) */}
                <button className="header-btn" title="Notificaciones">
                    🔔
                </button>
                
                {/* Perfil del Usuario */}
                <div className="user-profile">
                    <div className="user-avatar">
                        {/* Muestra las iniciales si hay usuario, sino un icono por defecto */}
                        {currentUser ? getInitials(currentUser.name, currentUser.apellido) : '👤'}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{userName}</span>
                        <span className="user-role">{userRole}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}