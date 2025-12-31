import React, { useState } from 'react';
import ProductForm from './ProductForm'; // Asegúrate de que esta ruta sea correcta
import pb from '../../services/database'; // Asegúrate de que esta ruta sea correcta
import '../CSS/productModal.css';

export default function ProductModal({ mode = 'create', product = null, onClose, onSaved }) {
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (payload, isFormData) => {
    setSaving(true);
    setError(null);
    console.log("PAYLOAD ENVIADO:", payload); // <-- NUEVA LÍNEA CLAVE
    try {
      let result;
      // La lógica del isFormData está duplicada porque el payload ya está formateado.
      // Simplificamos la llamada a la API de PocketBase:
      if (mode === 'create') {
        // CREAR: La colección se llama 'productos'
        result = await pb.collection('productos').create(payload);
      } else {
        // EDITAR/ACTUALIZAR: Se requiere el ID del producto
        if (!product || !product.id) throw new Error('Producto inválido para editar');
        result = await pb.collection('productos').update(product.id, payload);
      }

      // Si todo sale bien:
      onSaved && onSaved(result); // Llama a la función de guardado (ej. para actualizar la tabla)
      onClose && onClose();     // Cierra el modal
    } catch (err) {
      console.error('Error saving product:', err);
      // Muestra un error más amigable si es posible
      setError(err.data?.message || err?.message || 'Error desconocido al guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
      <div className="creation-form-mock">
        <div className="modal-header">
          <h3 id="product-modal-title">{mode === 'create' ? 'Crear producto' : 'Editar producto'}</h3>
          <button className="modal-close" aria-label="Cerrar" onClick={onClose}>✕</button>
        </div>

        {/* Mensaje de error visible si existe */}
        {error && <div className="alert alert-error">{error}</div>}

        <ProductForm
          initialValues={product || {}}
          onSubmit={handleSubmit}
          // El label cambia dinámicamente según el estado de guardado
          submitLabel={saving ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Guardar'}
        />

        <div className="form-actions">
          {/* Este botón ya está dentro del formulario en ProductForm, pero lo dejo por si lo necesitas */}
          {/* <button className="btn btn-secondary" onClick={onClose} type="button">Cerrar</button> */}
        </div>
      </div>
    </div>
  );
}
