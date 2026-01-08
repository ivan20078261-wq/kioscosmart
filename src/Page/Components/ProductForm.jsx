import React, { useState, useEffect, useRef } from 'react';

// Asegúrate de que los campos 'name' y 'price' están siendo enviados al formulario
// con los nombres que usamos en el ProductModal: nombre, precio, stock, etc.
// Por simplicidad, aquí usaré nombres en inglés (name, price) que luego mapearemos.

export default function ProductForm({ initialValues, onSubmit, submitLabel, submitting }) {

  // --- STATE ---
  const [name, setName] = useState(initialValues.nombre || initialValues.name || '');
  const [cost, setCost] = useState(initialValues.costo || initialValues.cost || ''); // 👈 NUEVO ESTADO: costo
  const [price, setPrice] = useState(initialValues.precio || initialValues.price || '');
  const [stock, setStock] = useState(initialValues.stock || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [barcode, setBarcode] = useState(initialValues.codigo_de_barras || initialValues.barcode || '');

  const barcodeRef = useRef(null);

  // --- EFECTO para inicializar ---
  useEffect(() => {
    // ... (Tu lógica de useEffect para sincronizar el estado inicial)
    if (initialValues) {
      setName(initialValues.nombre || initialValues.name || '');
      setCost(initialValues.costo || initialValues.cost || ''); // 👈 NUEVO
      setPrice(initialValues.precio || initialValues.price || '');
      setStock(initialValues.stock || '');
      setDescription(initialValues.description || '');
      setBarcode(initialValues.codigo_de_barras || initialValues.barcode || '');
    }
  }, [initialValues]);

  // --- HANDLER DE ENVÍO ---
  const handleSubmit = (e) => {
    e.preventDefault();

    // 🚨 Construir el payload que se envía a ProductModal
    const payload = {
      // Usamos los nombres en inglés aquí, que el Modal mapeará a español (nombre, precio, etc.)
      name: name,
      cost: cost, // 👈 NUEVO CAMPO en el payload del formulario
      price: price,
      stock: stock,
      description: description,
      barcode: barcode,
      // ID es necesario para el modo "update"
      id: initialValues.id,
    };

    onSubmit(payload);
  };

  // --- RENDER ---
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <label>Nombre</label>
        <input
          style={{ marginLeft: "20px" }}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del producto"
          required
        />
      </div>

      {/* 👈 NUEVO INPUT: Costo */}
      <div className="form-row">
        <label>Costo</label>
        <input
          style={{ marginLeft: "20px" }}
          type="number"
          step="0.01"
          value={cost} // Usar el estado 'cost'
          onChange={(e) => setCost(e.target.value)} // Actualizar 'cost'
          placeholder="Costo de adquisición"
          required // Suele ser requerido para gestión
        />
      </div>

      <div className="form-row barcode-row">
        <label>Código de barras</label>
        <input
          style={{ marginLeft: "20px" }}
          ref={barcodeRef}
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Escanea o ingresa el código"
          autoComplete="off"
        />
      </div>

      <div className="form-row">
        <label>Precio de Venta</label> {/* Cambiado el label para más claridad */}
        <input style={{ marginLeft: "20px" }}
          type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
      </div>

      <div className="form-row">
        <label>Stock</label>
        <input style={{ marginLeft: "20px" }}
          type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
      </div>

      <div className="form-row">
        <label>Descripción</label>
        <input style={{ marginLeft: "20px" }}
          type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción" />
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={submitting} aria-label={submitLabel}>{submitLabel}</button>
      </div>
    </form>
  );
}
