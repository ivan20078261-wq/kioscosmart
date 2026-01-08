import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../CSS/dashboard.css';

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Aquí iría la lógica de logout
    navigate('/');
  };

  const menuItems = [
    { name: "Venta", icon: "💸", path: "/ventas" },
    { name: 'Dashboard', icon: '📊', path: '/dashboard' },
    { name: 'Productos', icon: '📦', path: '/productos' },
    { name: 'Inventario', icon: '📋', path: '/inventario' },
    { name: 'Reportes', icon: '📈', path: '/reportes' },
    { name: 'Configuración', icon: '⚙️', path: '/configuracion' },
  ];

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-logo">KioskSmart</h2>
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {sidebarOpen && <span className="nav-text">{item.name}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          {sidebarOpen && <span className="nav-text">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
