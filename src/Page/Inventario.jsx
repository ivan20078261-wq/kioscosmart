import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Asumo que estos componentes existen y se usan para el layout
import Sidebar from './Components/Sidebar';
import Header from './Components/Header';
import ContentCard from './Components/ContentCard';
// Puedes crear un modal para CargaStockModal si es necesario
// import CargaStockModal from './Components/CargaStockModal'; 
import pb from '../services/database';
import "./CSS/inventario.css"; // Se necesita un nuevo archivo CSS

export default function Inventario() {
  const navigate = useNavigate();

  // =========================
  // STATE
  // =========================
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [inventory, setInventory] = useState([]); // Usamos 'inventory' para no confundir con 'products'
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false); // Para el modal de Carga de Stock

  // =========================
  // AUTH CHECK
  // =========================
  useEffect(() => {
    if (!pb.authStore.isValid) {
      navigate('/');
      return;
    }
    setCurrentUser(pb.authStore.model);
  }, [navigate]);

  // =========================
  // FETCH INVENTORY
  // =========================
  const didFetch = useRef(false);

  useEffect(() => {
    if (!pb.authStore.isValid) return;
    if (didFetch.current) return;
    didFetch.current = true;

    const fetchInventory = async () => {
      try {
        setLoadingInventory(true);
        // Traemos los mismos productos, pero el foco de la tabla es el stock
        const res = await pb.collection('productos').getList(1, 100);
        setInventory(res.items || []);
      } catch (err) {
        console.error(err);
        setError('Error al cargar el inventario');
      } finally {
        setLoadingInventory(false);
      }
    };

    fetchInventory();
  }, []);

  // =========================
  // HANDLERS
  // =========================
  const openCargaStockModal = () => setModalOpen(true);
  const closeCargaStockModal = () => setModalOpen(false);

  // NOTA: handleStockUpdate manejaría la lógica de sumar/restar stock en el backend
  const handleStockUpdate = (updatedProduct) => {
    setInventory(prev => {
      const i = prev.findIndex(p => p.id === updatedProduct.id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = updatedProduct; // Reemplaza el producto con el stock actualizado
        return copy;
      }
      return prev;
    });
  };

  // =========================
  // TABLE COMPONENT (Inventario)
  // =========================
  const InventoryTable = ({ items, onAdjustStock }) => {
    const isLowStock = (stock) => stock !== null && stock < 12; // Ejemplo de alerta de stock bajo

    return (
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>SKU/Código</th>
              <th>Stock Actual</th>
              <th>Precio Venta</th>
              <th>Acciones Stock</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((p) => (
                <tr key={p.id} className={isLowStock(p.stock) ? 'low-stock' : ''}>
                  <td>{p.nombre || p.name}</td>
                  <td>{p.codigo_de_barras}</td>
                  <td className="stock-cell">
                    <strong>{p.stock ?? 0}</strong>
                    {isLowStock(p.stock) && <span className="badge badge-warning">¡Bajo!</span>}
                  </td>
                  <td>{p.precio ?? p.price ?? '-'}</td>
                  <td className="actions-cell">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => onAdjustStock(p)}
                      title="Ajustar stock manualmente (ej: por rotura)"
                    >
                      Ajustar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No hay productos registrados en el inventario.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="dashboard-container">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="dashboard-main">
        <Header
          title="Inventario"
          subtitle="Control de existencias y carga de mercadería"
          user={currentUser}
        />

        <section className="content-section">
          <ContentCard title="Estado del Stock">
            {/* Aquí podrías añadir filtros por Categoría o por Stock Bajo */}
            {error && (
              <div className="alert alert-error">{error}</div>
            )}

            {loadingInventory ? (
              <p className="loading-state">Cargando inventario…</p>
            ) : (
              <InventoryTable
                items={inventory}
                onAdjustStock={openCargaStockModal} // Reusa el modal para ajustes
              />
            )}
          </ContentCard>

          <ContentCard title="Gestión de Stock">
            <div className="actions-grid">
              <button
                className="btn btn-primary"
                onClick={openCargaStockModal}
              >
                Cargar Nuevo Ingreso
              </button>
              <button
                className="btn btn-secondary"
                // Esta función navegaría a una vista para el conteo de inventario físico
                onClick={() => console.log('Iniciar Conteo Físico')}
              >
                Conteo Físico
              </button>
            </div>
          </ContentCard>
        </section>
      </main>

      {/* {modalOpen && (
        <CargaStockModal 
          onClose={closeCargaStockModal} 
          onSave={handleStockUpdate} 
        />
      )} */}
    </div>
  );
}
