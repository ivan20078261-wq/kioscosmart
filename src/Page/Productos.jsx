import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar para redirección fluida
import './CSS/dashboard.css';
import './CSS/productos.css';
import Sidebar from './Components/Sidebar';
import Header from './Components/Header';
import ContentCard from './Components/ContentCard';
import ProductModal from './Components/ProductModal';
import pb from '../services/database';

export default function Productos() {
    // Hooks de control de interfaz y datos
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [error, setError] = useState(null);
    const [modalProduct, setModalProduct] = useState(null); // null | {} (create) | product (edit)

    // ======================================
    // 1. LÓGICA DE AUTENTICACIÓN Y REDIRECCIÓN
    // ======================================
    useEffect(() => {
        // Usamos una bandera para prevenir race conditions si el componente se desmonta
        let isMounted = true; 

        const readUserAndRedirect = async () => {
            if (!pb.authStore.isValid || !pb.authStore.model) {
                console.warn('⚠️ Sesión expirada o no iniciada. Redirigiendo...');
                navigate('/'); // Redirección fluida con useNavigate
                return;
            }

            const authenticatedModel = pb.authStore.model;
            if (isMounted) setCurrentUser(authenticatedModel);

            try {
                // Obtener datos frescos del usuario (sin AbortController por simplicidad en este ejemplo)
                const userData = await pb.collection('users').getOne(authenticatedModel.id);
                if (isMounted) setCurrentUser(userData);
            } catch (error) {
                if (error.status === 404 && isMounted) {
                    console.error('Usuario no encontrado. Cerrando sesión.');
                    pb.authStore.clear();
                    navigate('/');
                }
            }
        };

        readUserAndRedirect();

        return () => {
            isMounted = false;
        };
    }, [navigate]); // navigate como dependencia es la buena práctica

    // ======================================
    // 2. LÓGICA DE CARGA DE PRODUCTOS (READ)
    // ======================================
    // Evita dobles llamadas en StrictMode (dev): marcamos cuando ya hicimos el fetch inicial
    const didFetchRef = useRef(false);
    useEffect(() => {
        // No cargar productos si no hay usuario válido
        if (!pb.authStore.isValid) return;

        // Evitar doble ejecución en React StrictMode durante desarrollo
        if (didFetchRef.current) return;
        didFetchRef.current = true;

        const fetchProducts = async () => {
            setLoadingProducts(true);
            setError(null);
            try {
                // Usar paginado explícito para evitar problemas con parámetros muy grandes
                // Ajusta `perPage` según necesites (ej. 50, 100)
                const page = 1;
                const perPage = 100;

                try {
                    const response = await pb.collection('productos').getList(page, perPage, {
                        sort: '-created',
                        // expand: 'category',
                    });
                    setProducts(response.items || []);
                } catch (innerErr) {
                    // Log completo para diagnóstico
                    console.error('Primer intento getList falló:', innerErr, {
                        status: innerErr?.status,
                        message: innerErr?.message,
                        data: innerErr?.data || innerErr?.response?.data,
                    });

                    // Ignorar autocancelaciones/AbortError (SDK + StrictMode)
                    const innerMsg = String(innerErr?.message || '');
                    if (innerMsg.toLowerCase().includes('autocancel') || innerErr?.name === 'AbortError') {
                        console.warn('Petición cancelada automáticamente por el SDK/React StrictMode — ignorando.');
                        return;
                    }

                    // Si es 400, reintentar sin parámetros avanzados (sin sort/expand)
                    if (innerErr?.status === 400) {
                        console.warn('Reintentando getList sin parámetros avanzados (debido a 400).');
                        try {
                            const fallback = await pb.collection('productos').getList(page, perPage);
                            setProducts(fallback.items || []);
                        } catch (fallbackErr) {
                            console.error('Reintento fallido:', fallbackErr, {
                                status: fallbackErr?.status,
                                message: fallbackErr?.message,
                                data: fallbackErr?.data || fallbackErr?.response?.data,
                            });
                            throw fallbackErr; // para que el outer catch lo maneje
                        }
                    } else {
                        throw innerErr; // no es 400 — dejar que el outer catch lo maneje
                    }
                }
            } catch (err) {
                // Mejor logging para depuración
                console.error('Error al obtener la lista de productos (detalle):', err);
                // Ignorar cancelaciones automáticas del SDK/AbortError (ocurre en StrictMode)
                const msg = String(err?.message || '');
                if (msg.toLowerCase().includes('autocancel') || err?.name === 'AbortError') {
                    console.warn('Petición cancelada automáticamente por el SDK/React StrictMode — ignorando.');
                    return;
                }
                // Si PocketBase devuelve status 400, es probable que el request tenga parámetros inválidos
                if (err?.status === 403) {
                    setError("Acceso denegado. Verifica las reglas de lectura de la colección 'productos'.");
                } else if (err?.status === 400) {
                    // Mostrar información más útil al desarrollador
                    setError("Solicitud inválida (400). Revisa la configuración de la colección 'productos' y los parámetros de la petición. Mira la consola del servidor para más detalles.");
                } else {
                    setError("Error al cargar productos: " + (err?.message || String(err)));
                }
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchProducts();
    }, [currentUser]); // Recargar si el usuario cambia (aunque en este caso no debería)

    // ======================================
    // 3. FUNCIONES CRUD DE ACCIÓN
    // ======================================
    const handleOpenCreateModal = () => setModalProduct({});
    const handleCloseCreateModal = () => setModalProduct(null);

    // Aquí: handlers para crear/editar/eliminar
    const handleSavedProduct = (saved) => {
        if (!saved) return;
        setProducts((prev) => {
            const idx = prev.findIndex((p) => p.id === saved.id);
            if (idx >= 0) {
                const copy = [...prev]; copy[idx] = saved; return copy;
            }
            return [saved, ...prev];
        });
    };

    const handleEdit = (product) => {
        setModalProduct(product);
    };

    const handleDelete = async (product) => {
        try {
            if (!window.confirm(`¿Eliminar producto "${product.name || product.nombre || product.id}"?`)) return;
            await pb.collection('productos').delete(product.id);
            setProducts((prev) => prev.filter((p) => p.id !== product.id));
        } catch (err) {
            console.error('Error eliminando producto:', err);
            setError('No se pudo eliminar el producto: ' + (err?.message || String(err)));
        }
    };

    // ======================================
    // 4. ESTRUCTURA VISUAL (JSX)
    // ======================================
    // Componente minimalista de tabla para evitar error `ProductTable is not defined`
    function ProductTable({ products, totalItems, onEdit, onDelete }) {
        const [query, setQuery] = React.useState('');
        const [page, setPage] = React.useState(1);
        const [perPage, setPerPage] = React.useState(10);

        const normalized = (s) => String(s ?? '').toLowerCase();
        const filtered = (products || []).filter((p) => {
            const name = normalized(p.name || p.nombre || p.title || '');
            const desc = normalized(p.description || p.descripcion || '');
            const q = normalized(query);
            return q === '' || name.includes(q) || desc.includes(q);
        });

        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        const pageIndex = Math.min(Math.max(1, page), totalPages);
        const start = (pageIndex - 1) * perPage;
        const visible = filtered.slice(start, start + perPage);

        React.useEffect(() => {
            // Ensure current page is valid when filter or perPage changes
            setPage(1);
        }, [query, perPage]);

        return (
            <div className="product-table">
                <div className="table-controls">
                    <div className="search-group">
                        <input
                            className="input input-search"
                            placeholder="Buscar por nombre o descripción..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <select className="select-perpage" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <div className="summary">Mostrando {visible.length} de {total} productos</div>
                </div>

                <div className="table-wrapper">
                    <table className="table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.length > 0 ? (
                            visible.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.name || p.nombre || '(sin nombre)'}</td>
                                    <td>{p.price ?? p.precio ?? '-'}</td>
                                    <td>{p.stock ?? '-'}</td>
                                    <td className="actions-cell">
                                        <button className="btn btn-sm" onClick={() => onEdit(p)}>Editar</button>
                                        <button className="btn btn-sm btn-danger" onClick={() => onDelete(p)}>Eliminar</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4}>No hay productos para mostrar.</td>
                            </tr>
                        )}
                    </tbody>
                    </table>
                </div>

                <div className="pagination">
                    <button className="btn btn-sm" disabled={pageIndex <= 1} onClick={() => setPage(pageIndex - 1)}>‹ Prev</button>
                    <span className="page-info">Página {pageIndex} / {totalPages}</span>
                    <button className="btn btn-sm" disabled={pageIndex >= totalPages} onClick={() => setPage(pageIndex + 1)}>Next ›</button>
                </div>
            </div>
        );
    }
    return (
        <div className="dashboard-container">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className="dashboard-main">
                <Header 
                    title="Productos" 
                    subtitle="Gestión de catálogo y precios" 
                    user={currentUser} 
                />

                <section className="content-section">
                    {/* Tarjeta 1: Lista e Interacción (Columna principal) */}
                    <ContentCard title="Catálogo e Inventario">
                        {error && <div className="alert alert-error">{error}</div>}
                        
                            {loadingProducts ? (
                            <p className="loading-state">Cargando productos, por favor espere...</p>
                        ) : (
                            <ProductTable 
                                products={products} 
                                // Pasar el total de productos para una mejor experiencia de usuario
                                totalItems={products.length} 
                                onEdit={handleEdit} 
                                onDelete={handleDelete}
                            />
                        )}
                    </ContentCard>

                    {/* Tarjeta 2: Acciones Rápidas (Columna lateral) */}
                    <ContentCard title="Acciones Rápidas">
                        <div className="actions-grid">
                            <button
                                className="btn btn-primary"
                                type="button"
                                onClick={handleOpenCreateModal}
                                aria-label="Crear Nuevo Producto"
                            >Nuevo Producto
                            </button>
                            <button
                                className="btn btn-secondary"
                                type="button"
                                onClick={() => console.log('Importar CSV')}
                                aria-label="Importar CSV"
                            >
                                📤 Importar CSV
                            </button>
                            <button
                                className="btn btn-secondary"
                                type="button"
                                onClick={() => window.print()}
                                aria-label="Imprimir Inventario"
                            >
                                🖨️ Imprimir Inventario
                            </button>
                        </div>
                    </ContentCard>
                </section>
                
                {/* Modal de Creación / Edición usando ProductModal */}
                {modalProduct && (
                    <ProductModal
                        mode={modalProduct?.id ? 'edit' : 'create'}
                        product={modalProduct?.id ? modalProduct : null}
                        onClose={() => setModalProduct(null)}
                        onSaved={handleSavedProduct}
                    />
                )}
            </main>
        </div>
    );
}