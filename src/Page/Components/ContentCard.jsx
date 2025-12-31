import React from 'react';
import '../CSS/dashboard.css';

export default function ContentCard({ title, actionText, actionOnClick, children }) {
    return (
        <div className="content-card">
            <div className="card-header">
                <h2 className="card-title">{title}</h2>
                {actionText && (
                    <button className="card-action" onClick={actionOnClick}>
                        {actionText}
                    </button>
                )}
            </div>
            <div className="card-body">
                {children}
            </div>
        </div>
    );
}
