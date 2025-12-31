import React from 'react';
import '../CSS/dashboard.css';

export default function StatCard({ title, value, change, positive, icon }) {
    return (
        <div className="stat-card">
            <div className="stat-header">
                <span className="stat-icon">{icon}</span>
                <span className={`stat-change ${positive ? 'positive' : 'negative'}`}>
                    {change}
                </span>
            </div>
            <div className="stat-content">
                <h3 className="stat-value">{value}</h3>
                <p className="stat-title">{title}</p>
            </div>
        </div>
    );
}
