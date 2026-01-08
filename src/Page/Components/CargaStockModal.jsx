import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal'; // Componente Modal base
// Asumo que tienes una función para buscar el producto, o la haces aquí.

export default function CargaStockModal({ onClose, onSave }) {
  const [incomingItems, setIncomingItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [batchCodes, setBatchCodes] = useState('');
  const [mode, setMode] = useState('scan'); // 'scan' o 'batch'
  const searchRef = useRef(null);
  const batchRef = useRef(null);
  const [provider, setProvider] = useState('Proveedor A');

  // Enfocar el campo de entrada al cambiar de modo/abrir modal
  useEffect(() => {
    const ref = mode === 'scan' ? searchRef : batchRef;
    if (ref.current) {
      ref.current.focus();
    }
  }, [mode, onClose]); // Agregamos onClose para re-enfocar al abrir

  // Simulación de búsqueda (ADAPTAR A TU BACKEND)
  const findProduct = (code) => {
    const dummyProducts = [
      { id: 'p001', nombre: 'Coca Cola 500ml', barcode: '7790010001001', precioCosto: 500, stock: 10 },
      { id: 'p002', nombre: 'Masticable Frizze', barcode: '7790020002002', precioCosto: 20, stock: 50 },
      { id: 'p003', nombre: 'Chicle Bazooka', barcode: '7790030003003', precioCosto: 15, stock: 100 },
    ];
    return dummyProducts.find(p => p.barcode === code || p.nombre.toLowerCase().includes(code.toLowerCase()));
  };

  // Añade o incrementa un producto a la lista de carga
  const addOrIncrementProduct = (foundProduct, quantity = 1) => {
    if (!foundProduct) return alert(`Producto no encontrado.`);

    setIncomingItems(prev => {
      const existsIndex = prev.findIndex(item => item.id === foundProduct.id);

      if (existsIndex !== -1) {
        const copy = [...prev];
        copy[existsIndex] = { ...copy[existsIndex], quantity: copy[existsIndex].quantity + quantity };
        return copy;
      } else {
        return [
          ...prev,
          {
            id: foundProduct.id,
            nombre: foundProduct.nombre,
            barcode: foundProduct.barcode,
            costo: foundProduct.precioCosto,
            quantity: quantity
          }
        ];
      }
    });
  }

  // HANDLER para ESCANEO RÁPIDO
  const handleSearch = (e) => {
    e.preventDefault();
    const code = searchTerm.trim();
    if (!code) return;

    const foundProduct = findProduct(code);
    addOrIncrementProduct(foundProduct, 1);

    setSearchTerm(''); // Limpiar para el siguiente escaneo
  };

  // HANDLER para CARGA POR LOTE
  const handleProcessBatch = (e) => {
    e.preventDefault();
    const codes = batchCodes.split('\n').map(c => c.trim()).filter(c => c.length > 0);

    codes.forEach(code => {
      const foundProduct = findProduct(code);
      addOrIncrementProduct(foundProduct, 1);
    });

    alert(`Se procesaron ${codes.length} códigos. Revise la tabla.`);
    setBatchCodes(''); // Limpiar el área de texto
  };

  // Handlers de edición de cantidades/costos
  const handleQuantityChange = (id, newQuantity) => {
    setIncomingItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, parseInt(newQuantity) || 1) } : item
    ));
  };

  const handleCostChange = (id, newCost) => {
    setIncomingItems(prev => prev.map(item =>
      item.id === id ? { ...item, costo: parseFloat(newCost) || 0 } : item
    ));
  };

  const removeItem = (id) => {
    setIncomingItems(prev => prev.filter(item => item.id !== id));
  };

  const handleFinalSave = () => {
    if (incomingItems.length === 0) {
      alert('No hay productos para ingresar.');
      return;
    }

    // Aquí es donde llamas a tu API para: 1. Sumar Stock. 2. Actualizar Precio Costo.
    console.log("Datos de Ingreso final a enviar al backend:", {
      proveedor: provider,
      fecha: new Date().toISOString(),
      items: incomingItems
    });

    onSave(incomingItems); // Notifica a Inventario.jsx para que se refresque
    onClose();
  };

  const totalCost = incomingItems.reduce((acc, item) => acc + item.costo * item.quantity, 0);

  return (
    <Modal title="Cargar Nuevo Ingreso de Stock" onClose={onClose}>

      <div className="input-group-row">
        <select className="input-select" value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="Proveedor A">Proveedor A</option>
          <option value="Proveedor B">Proveedor B</option>
          <option value="Otro">Otro</option>
        </select>
        <input type="text" value={`Fecha: ${new Date().toLocaleDateString()}`} readOnly className="input-readonly" />
      </div>

      <div className="mode-selector">
        <button
          className={`btn btn-sm ${mode === 'scan' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('scan')}
        >
          Modo Escaneo Rápido (1x1)
        </button>
        <button
          className={`btn btn-sm ${mode === 'batch' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('batch')}
        >
          Modo Carga por Lote (Masivo)
        </button>
      </div>

      {mode === 'scan' ? (
        <form onSubmit={handleSearch} className="search-and-add-form">
          <input
            type="text"
            placeholder="Escanear (ENTER) o buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            ref={searchRef}
            className="input-search-large"
          />
          <button type="submit" className="btn btn-sm btn-secondary">Añadir</button>
        </form>
      ) : (
        <form onSubmit={handleProcessBatch} className="batch-entry-form">
          <textarea
            ref={batchRef}
            placeholder="Pega aquí una lista de Códigos de Barras (uno por línea)..."
            value={batchCodes}
            onChange={(e) => setBatchCodes(e.target.value)}
            rows="5"
            className="input-textarea"
          />
          <button type="submit" className="btn btn-primary">
            Procesar Códigos
          </button>
        </form>
      )}

      <h3>Productos a Ingresar ({incomingItems.length})</h3>
      <div className="table-wrapper-modal">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Producto</th>
              <th style={{ width: '20%' }}>Costo Unitario</th>
              <th style={{ width: '20%' }}>Cantidad</th>
              <th style={{ width: '10%' }}>Total</th>
              <th style={{ width: '10%' }}></th>
            </tr>
          </thead>
          <tbody>
            {incomingItems.map((item) => (
              <tr key={item.id}>
                <td>{item.nombre}</td>
                <td>
                  <input type="number" min="0" value={item.costo} onChange={(e) => handleCostChange(item.id, e.target.value)} className="input-small" />
                </td>
                <td>
                  <input type="number" min="1" value={item.quantity} onChange={(e) => handleQuantityChange(item.id, e.target.value)} className="input-small" />
                </td>
                <td>${(item.costo * item.quantity).toFixed(2)}</td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => removeItem(item.id)}>X</button>
                </td>
              </tr>
            ))}
            {incomingItems.length === 0 && (
              <tr><td colSpan="5" className="text-center-muted">Escanee o busque productos para empezar a cargar.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleFinalSave}>
          Guardar Ingreso Total: **${totalCost.toFixed(2)}**
        </button>
      </div>
    </Modal>
  );
}
