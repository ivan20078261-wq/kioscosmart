import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Components/Sidebar';
import Header from './Components/Header';
import ContentCard from './Components/ContentCard';
import ProductModal from './Components/ProductModal';
import pb from '../services/database';
import "./CSS/productos.css";

export default function Productos() {
  const navigate = useNavigate();

  // =========================
  // STATE
  // =========================
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState(null);
  const [modalProduct, setModalProduct] = useState(null);

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
  // FETCH PRODUCTS
  // =========================
  const didFetch = useRef(false);

  useEffect(() => {
    if (!pb.authStore.isValid) return;
    if (didFetch.current) return;
    didFetch.current = true;

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        // **********************************************
        // NOTA: Se asume que 'productos' tiene campos para el costo
        // El precio de costo es vital para el catálogo.
        // **********************************************
        const res = await pb.collection('productos').getList(1, 100);
        setProducts(res.items || []);
      } catch (err) {
        console.error(err);
        setError('Error al cargar productos');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // =========================
  // HANDLERS
  // =========================
  const openCreateModal = () => setModalProduct({});
  const closeModal = () => setModalProduct(null);

  const handleSave = (saved) => {
    setProducts((prev) => {
      const i = prev.findIndex(p => p.id === saved.id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
  };

  const handleEdit = (product) => setModalProduct(product);

  const handleDelete = async (product) => {
    if (!window.confirm(`¿Eliminar "${product.nombre || product.name}"? Esto lo eliminará permanentemente del catálogo.`)) return;
    try {
      await pb.collection('productos').delete(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
    } catch (err) {
      console.error(err);
      setError('No se pudo eliminar el producto');
    }
  };

  // =========================
  // TABLE COMPONENT (Solo Catálogo)
  // =========================
  const ProductTable = ({ items, onEdit, onDelete }) => {
    return (
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio Venta</th>
              <th>Precio Costo</th> {/* Añadido para gestionar la ganancia */}
              {/* <th>Stock</th> <-- ELIMINADO para mover al Inventario */}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombre || p.name}</td>
                  <td>{p.precio ?? p.price ?? '-'}</td>
                  {/* Se asume que el campo de costo se llama 'precioCosto' o 'costo' */}
                  <td>{p.precioCosto ?? p.costo ?? '-'}</td>
                  {/* <td className="stock-cell">{p.stock ?? '-'}</td> <-- ELIMINADO */}
                  <td className="actions-cell">
                    <button
                      className="btn btn-sm"
                      onClick={() => onEdit(p)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => onDelete(p)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>No hay productos en el catálogo</td>
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
          title="Productos"
          subtitle="Gestión de catálogo, precios y categorías" // Subtítulo ajustado
          user={currentUser}
        />

        <section className="content-section">
          <ContentCard title="Catálogo de Productos"> {/* Título ajustado */}
            {error && (
              <div className="alert alert-error">{error}</div>
            )}

            {loadingProducts ? (
              <p className="loading-state">Cargando catálogo…</p>
            ) : (
              <ProductTable
                items={products}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </ContentCard>

          <ContentCard title="Acciones Rápidas">
            <div className="actions-grid">
              <button
                className="btn btn-primary"
                onClick={openCreateModal}
              >
                Nuevo Producto
              </button>

              {/* ELIMINADO: Se asume que aquí estaba el botón de imprimir inventario, que ahora va a Inventario. */}
              {/* Puedes añadir un botón para 'Exportar Catálogo a CSV' aquí si lo deseas. */}
            </div>
          </ContentCard>
        </section>
      </main>

      {modalProduct && (
        <ProductModal
          product={modalProduct}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
