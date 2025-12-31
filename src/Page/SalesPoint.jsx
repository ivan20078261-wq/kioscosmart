import React, { useState, useEffect, useRef, useCallback } from 'react';
import './CSS/salesPoint.css';
import './CSS/dashboard.css';
import Header from './Components/Header';
import Sidebar from './Components/Sidebar';
import pb from '../services/database';

export default function SalesPoint() {
  // -------------------- 📦 ESTADOS Y REFERENCIAS --------------------
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [barcode, setBarcode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isManualSearching, setIsManualSearching] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productsCache, setProductsCache] = useState([]);

  const barcodeRef = useRef(null);

  // -------------------- 🛠️ CARGAR PRODUCTOS --------------------

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8090/api/collections/productos/records?perPage=200', {
          headers: {
            'Authorization': pb.authStore.token || '',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setProductsCache(data.items);

      } catch (error) {
        console.error("Error cargando productos:", error);
        // Datos de prueba (manteniendo tu fallback)
        setProductsCache([
          { id: '1', codigo_de_barras: '12345', nombre: 'Coca Cola 600ml', precio: 15.50, stock: 10 },
          { id: '2', codigo_de_barras: '67890', nombre: 'Sabritas 45g', precio: 12.00, stock: 5 },
        ]);
      }
    };

    if (pb.authStore.isValid) {
      loadProducts();
    }
  }, []);

  // -------------------- 🛠️ BÚSQUEDA --------------------

  const findProduct = useCallback(async (query, isExactCode = true) => {
    if (!query || query.trim() === '') return null;

    const cleanQuery = query.trim().toLowerCase();
    console.log(`Buscando: "${cleanQuery}"`);

    const foundProduct = productsCache.find(item => {
      if (item.codigo_de_barras && item.codigo_de_barras.toString().toLowerCase() === cleanQuery) {
        return true;
      }

      if (!isExactCode && item.nombre && item.nombre.toLowerCase().includes(cleanQuery)) {
        return true;
      }

      return false;
    });

    if (foundProduct) {
      console.log("✅ Producto encontrado:", foundProduct.nombre);

      let precioNumerico = 0;
      if (foundProduct.precio !== undefined && foundProduct.precio !== null) {
        precioNumerico = parseFloat(foundProduct.precio);
        if (isNaN(precioNumerico)) {
          console.warn("Precio no es un número válido:", foundProduct.precio);
          precioNumerico = 0;
        }
      }

      return {
        id: foundProduct.id,
        name: foundProduct.nombre || 'Producto sin nombre',
        price: precioNumerico,
        codigo: foundProduct.codigo_de_barras || '',
        stock: foundProduct.stock || 0
      };
    }

    console.log("❌ Producto no encontrado");
    return null;
  }, [productsCache]); // Depende de productsCache

  // -------------------- 🛠️ VERIFICAR STOCK --------------------

  const checkProductStock = useCallback(async (productCode, quantityToAdd = 1) => {
    try {
      const result = await pb.collection('productos').getList(1, 1, {
        filter: `codigo_de_barras = "${productCode}"`
      });

      if (result.items.length === 0) {
        throw new Error('Producto no encontrado');
      }

      const product = result.items[0];
      const currentStock = product.stock || 0;

      const itemInCart = cart.find(item => item.codigo === productCode);
      const cartQuantity = itemInCart ? itemInCart.quantity : 0;

      const totalNeeded = cartQuantity + quantityToAdd;

      return {
        available: currentStock >= totalNeeded,
        currentStock,
        needed: totalNeeded,
        message:
          currentStock >= totalNeeded
            ? `Stock disponible: ${currentStock}`
            : `❌ Stock insuficiente. Disponible: ${currentStock}, Necesario: ${totalNeeded}`
      };

    } catch (error) {
      console.error("Error verificando stock:", error);
      return {
        available: false,
        message: 'Error al verificar stock.'
      };
    }
  }, [cart]);

  // -------------------- 🛠️ CARRITO --------------------

  const generateSuggestion = (product) => {
    if (!product || !product.name) {
      setSuggestion('Producto añadido al carrito.');
      return;
    }

    let text = `El cliente añadió **${product.name}**. `;
    if (product.name.toLowerCase().includes('coca')) {
      text += '¡Sugerir **Papas Fritas** (alto margen)!';
    } else if (product.name.toLowerCase().includes('snack') || product.name.toLowerCase().includes('papas')) {
      text += '¿Alguna **Bebida** para acompañar?';
    } else {
      text = '¡Genial! ¿Hay algo más que necesite el cliente?';
    }
    setSuggestion(text);
  };

  const addToCart = useCallback(async (productData) => {
    if (!productData || !productData.id) {
      setSearchError('Producto inválido.');
      return;
    }

    // Verificar stock antes de añadir
    const stockCheck = await checkProductStock(productData.codigo, 1);

    if (!stockCheck.available) {
      setSearchError(stockCheck.message);
      return;
    }

    setSearchError('');

    const existingItemIndex = cart.findIndex(item => item.id === productData.id);

    if (existingItemIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + 1
      };
      setCart(updatedCart);
      generateSuggestion(productData);
    } else {
      const newItem = {
        id: productData.id,
        name: productData.name || 'Producto sin nombre',
        price: productData.price || 0,
        codigo: productData.codigo || '',
        quantity: 1,
      };
      console.log("Nuevo item en carrito:", newItem);
      setCart(prev => [...prev, newItem]);
      generateSuggestion(newItem);
    }
  }, [cart, checkProductStock]); // Depende de cart y checkProductStock

  const handleManualAdd = async () => {
    if (!searchTerm) return;

    setIsManualSearching(true);
    const foundProduct = await findProduct(searchTerm, false);
    setIsManualSearching(false);

    if (foundProduct) {
      await addToCart(foundProduct);
      setSearchTerm('');
      setSearchError('');
    } else {
      setSearchError(`No se encontró producto con: "${searchTerm}"`);
    }
    barcodeRef.current?.focus();
  };

  const handleQuantityChange = (id, newQuantity) => {
    const quantity = parseInt(newQuantity, 10);

    if (isNaN(quantity) || quantity <= 0) {
      removeProductFromCart(id);
      return;
    }

    const updatedCart = cart.map(item =>
      item.id === id ? { ...item, quantity: quantity } : item
    );
    setCart(updatedCart);
  };

  const removeProductFromCart = (id) => {
    setCart(prev => prev.filter(product => product.id !== id));
  };

  // -------------------- 🛠️ ACTUALIZAR STOCK --------------------

  const actualizarStock = async (productCode, quantityToAdd = 1) => {
    try {
      console.log(`Verificando stock para código: ${productCode}`);

      // Buscar producto por código de barras
      const result = await pb.collection('productos').getList(1, 1, {
        filter: `codigo_de_barras = "${productCode}"`
      });

      if (result.items.length === 0) {
        throw new Error(`Producto con código ${productCode} no encontrado`);
      }

      // ✅ CORREGIDO: Eliminada la línea 'console.log("PAYLOAD ENVIADO:", payload);' que causaba ReferenceError
      const product = result.items[0];
      const currentStock = product.stock || 0;
      const newStock = currentStock - quantityToAdd

      // Si ya hiciste el chequeo de stock, solo resta
      if (newStock < 0) {
        throw new Error(`Stock insuficiente. Disponible: ${currentStock}, Necesario: ${quantityToAdd}`);
      }

      const updateData = {
        stock: newStock
      };
      await pb.collection('productos').update(product.id, updateData);

      return {
        success: true,
        currentStock: newStock,
        productId: product.id,
        message: `Stock actualizado a: ${newStock}`
      };

    } catch (error) {
      console.error("Error actualizando stock:", error);
      return { success: false, error: error.message, message: `❌ Error al actualizar stock: ${error.message}` };
    }
  };

  // -------------------- 🛠️ FINALIZAR VENTA CON STOCK --------------------

  const handleFinalizeSale = useCallback(async () => {
    if (cart.length === 0) return;

    if (!window.confirm(`¿Finalizar venta por $${total.toFixed(2)}?\nSe actualizará el stock de ${cart.length} productos.`)) {
      return;
    }

    let successCount = 0;
    const results = [];

    try {
      // 1. Verificación final de stock (opcional, pero buena práctica) y actualización
      for (const item of cart) {
        if (!item.codigo) {
          console.error(`Item ${item.name} no tiene código`);
          results.push({ item: item.name, success: false, error: 'Sin código' });
          continue;
        }

        // Asumiendo que actualizarStock maneja la lógica de resta y validación
        const result = await actualizarStock(item.codigo, item.quantity);
        results.push({ item: item.name, ...result });

        if (result.success) {
          successCount++;
        }
      }

      console.log("Resultados de actualización:", results);

      if (successCount === cart.length) {
        // Éxito total
        setCart([]);
        setTotal(0);
        setSuggestion('✅ Venta completada. Stock actualizado correctamente.');

        // Actualizar cache de productos (mejor solo actualizar los afectados o recargar)
        const updatedProducts = await pb.collection('productos').getFullList();
        setProductsCache(updatedProducts);

        alert(`✅ Venta finalizada exitosamente!\nStock actualizado para ${successCount} productos.`);
      } else if (successCount > 0) {
        // Éxito parcial
        const failedItems = results.filter(r => !r.success).map(r => r.item);
        alert(`⚠️ Venta parcialmente completada.\nActualizados: ${successCount}/${cart.length} productos.\nFallaron: ${failedItems.join(', ')}`);

        // Limpiar carrito de todos modos
        setCart([]);
        setTotal(0);
      } else {
        // Todo falló
        alert(`No se pudo actualizar el stock de ningún producto. Por favor, revise los errores en consola.`);
      }

    } catch (error) {
      console.error("Error general en venta:", error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      barcodeRef.current?.focus();
    }
  }, [cart, total, actualizarStock, setCart, setTotal, setSuggestion, setProductsCache, barcodeRef, pb]);

  const handleCancelSale = useCallback(() => {
    if (cart.length === 0) return;
    if (window.confirm('¿Cancelar la venta?')) {
      setCart([]);
      setTotal(0);
      setSearchError('');
      setSuggestion('Venta cancelada.');
      barcodeRef.current?.focus();
    }
  }, [cart.length, setCart, setTotal, setSearchError, setSuggestion, barcodeRef]);

  // -------------------- 🚀 EFECTOS --------------------

  // Autenticación
  useEffect(() => {
    let isMounted = true;

    const readUserAndAuthenticate = async () => {
      if (!pb.authStore.isValid || !pb.authStore.model) {
        if (isMounted) window.location.href = '/';
        return;
      }

      const authenticatedModel = pb.authStore.model;
      if (isMounted) setCurrentUser(authenticatedModel);
      if (isMounted) setIsLoading(false);
    };

    const timer = setTimeout(readUserAndAuthenticate, 100);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Enfocar input
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      barcodeRef.current?.focus();
    }, 10);
    return () => clearTimeout(focusTimer);
  }, []);

  // Procesar código de barras
  useEffect(() => {
    const processBarcode = async () => {
      if (!barcode) return;
      setIsSearching(true);

      const productData = await findProduct(barcode, true);

      if (productData) {
        await addToCart(productData);
        setSearchError('');
      } else {
        setSearchError(`Código "${barcode}" no encontrado.`);
      }
      setIsSearching(false);
      setBarcode('');
      barcodeRef.current?.focus();
    };
    processBarcode();
  }, [barcode, findProduct, addToCart]); // Añadido addToCart como dependencia

  // Calcular total
  useEffect(() => {
    const newTotal = cart.reduce((acc, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return acc + (price * quantity);
    }, 0);
    setTotal(newTotal);
  }, [cart]);

  // Atajos de teclado
  useEffect(() => {
    const handleHotkeys = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (cart.length > 0) {
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          handleFinalizeSale();
        } else if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          handleCancelSale();
        }
      }
    };

    document.addEventListener('keydown', handleHotkeys);
    return () => document.removeEventListener('keydown', handleHotkeys);
  }, [cart.length, handleFinalizeSale, handleCancelSale]); // Usar las funciones estables

  // -------------------- 🧱 RENDER --------------------

  if (isLoading) {
    return <div className="full-screen-loader">Cargando Punto de Venta...</div>;
  }
  return (
    <div className="dashboard-container">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="dashboard-main">
        <Header
          title="Punto de Venta"
          subtitle={`Bienvenido ${currentUser?.name || currentUser?.username || 'Usuario'}`}
        />

        <main className="sales-point-container">
          <section className="top-section">
            {/* IZQUIERDA */}
            <div className="top-suggestion">
              <span className="suggestion-label">Sugerencia:</span>
              <span
                className="suggestion-text"
                dangerouslySetInnerHTML={{
                  __html: suggestion || 'Añada productos para ver sugerencias.'
                }}
              />
            </div>

            {/* CENTRO */}
            <div className="total-display">
              <span className="total-label">TOTAL A PAGAR</span>
              <span className="total-amount">${total.toFixed(2)}</span>
            </div>

            {/* DERECHA (placeholder visual) */}
            <div className="top-right-spacer"></div>
          </section>



          <div className="sales-content">
            <div className="product-input-section">
              <div className="form-row">
                <label htmlFor="barcode-input">Escanear Código</label>
                <input
                  id="barcode-input"
                  ref={barcodeRef}
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Escanee aquí..."
                  disabled={isSearching}
                />
                {isSearching && <p className="loading-message">Procesando...</p>}
              </div>

              <div className="form-row">
                <label htmlFor="search-product-input">Búsqueda Manual</label>
                <div className="input-group">
                  <input
                    id="search-product-input"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nombre o código (Enter)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleManualAdd();
                    }}
                  />
                  <button
                    className="btn btn-primary btn-hotkey"
                    onClick={handleManualAdd}
                    disabled={isManualSearching}
                  >
                    <span className="hotkey-letter">A</span>gregar
                  </button>
                </div>
                {searchError && <p className="error-busqueda">{searchError}</p>}
              </div>
            </div>

            <div className="cart-section">
              <h2>Carrito ({cart.length} productos)</h2>
              {cart.length === 0 ? (
                <p className="empty-cart-message">🛒 Carrito vacío</p>
              ) : (
                <>
                  <div className="product-list-header">
                    <span className="col-name">Producto</span>
                    <span>Cant.</span>
                    <span>P. Unit.</span>
                    <span>Subtotal</span>
                    <span></span>
                  </div>

                  <ul className="product-list">
                    {cart.map(product => (
                      <li key={product.id}>
                        <span className="product-name-col" title={product.name}>
                          {product.name}
                        </span>
                        <div className="qty-control">
                          <button
                            className="qty-btn"
                            onClick={() => handleQuantityChange(product.id, (product.quantity || 1) - 1)}
                          >
                            −
                          </button>

                          <span className="qty-value">
                            {product.quantity || 1}
                          </span>

                          <button
                            className="qty-btn"
                            onClick={() => handleQuantityChange(product.id, (product.quantity || 1) + 1)}
                          >
                            +
                          </button>
                        </div>

                        <span className="price-col">
                          ${(product.price || 0).toFixed(2)}
                        </span>
                        <span className="subtotal-col">
                          ${((product.price || 0) * (product.quantity || 1)).toFixed(2)}
                        </span>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => removeProductFromCart(product.id)}
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="sales-footer">
            <button
              className="btn btn-danger btn-hotkey"
              onClick={handleCancelSale}
              disabled={cart.length === 0}
              title="Atajo: C"
            >
              <span className="hotkey-letter">C</span>ancelar
            </button>
            <button
              className="btn btn-success btn-large btn-hotkey"
              onClick={handleFinalizeSale}
              disabled={cart.length === 0}
              title="Atajo: F"
            >
              <span className="hotkey-letter">F</span>inalizar (${total.toFixed(2)})
            </button>
          </div>
        </main>
      </div>
    </div>
  ); // ✅ Corregido el paréntesis extra aquí
}