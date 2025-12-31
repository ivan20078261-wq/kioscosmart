import React from 'react';
import '../CSS/dashboard.css';

export default function ActivityList({ activities = [] }) {
    const defaultActivities = [
        { icon: '✅', text: 'Nueva venta realizada', time: 'Hace 5 minutos' },
        { icon: '📦', text: 'Producto agregado al inventario', time: 'Hace 1 hora' },
        { icon: '👤', text: 'Nuevo cliente registrado', time: 'Hace 2 horas' },
    ];

    const itemsToShow = activities.length > 0 ? activities : defaultActivities;

    return (
        <div className="activity-list">
            {itemsToShow.map((activity, index) => (
                <div key={index} className="activity-item">
                    <span className="activity-icon">{activity.icon}</span>
                    <div className="activity-content">
                        <p className="activity-text">{activity.text}</p>
                        <span className="activity-time">{activity.time}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
