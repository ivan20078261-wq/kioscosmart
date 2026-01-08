import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import ProductForm from './ProductForm';
import pb from '../../services/database';
import '../CSS/productModal.css';

export default function ProductModal({
  mode = 'create',
  product = null,
  onClose,
  onSaved,
}) {
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // ProductModal.jsx

  // ... (imports y estado) ...

  const handleSubmit = async (formData) => {
    setSaving(true);
    setError(null);

    try {
      let result;

      // 🚀 PASO 1: CONSTRUIR EL PAYLOAD Y CONVERTIR TIPOS
      const payload = {
        // Asumiendo que PocketBase usa 'nombre', 'precio', 'stock'
        nombre: formData.name || formData.nombre || '',

        // CONVERSIÓN VITAL: Convertir las cadenas de texto a números
        precio: Number(formData.price || formData.precio),
        stock: Number(formData.stock),

        description: formData.description || '',
        codigo_de_barras: formData.barcode || '',
        // Incluir otros campos aquí...
      };

      if (mode === 'create') {
        // 🚨 PASO 2: INYECTAR EL DUEÑO (OWNER)
        if (!pb.authStore.isValid || !pb.authStore.model?.id) {
          throw new Error("No hay un usuario autenticado para la creación.");
        }
        payload.owner = pb.authStore.model.id;

        console.log("Payload FINAL y CORRECTO:", payload);

        result = await pb.collection('productos').create(payload);
      } else {
        if (!product?.id) throw new Error('Producto inválido');
        result = await pb.collection('productos').update(product.id, payload);
      }

      onSaved?.(result);
      onClose?.();
    } catch (err) {
      // Mejorar el mensaje de error para mostrar campos fallidos
      const errorData = err?.response?.data?.data;
      let errorMsg = 'Error al guardar.';

      if (errorData) {
        const fieldsFailed = Object.keys(errorData).join(', ');
        errorMsg = `Error de validación en los campos: ${fieldsFailed}.`;
      }

      setError(errorMsg);
      console.error('Error completo del servidor:', err);
    } finally {
      setSaving(false);
    }
  };

  // ... (resto del componente) ...
  return createPortal(
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="creation-form-mock">
        <div className="modal-header">
          <h3>{mode === 'create' ? 'Nuevo producto' : 'Editar producto'}</h3>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={saving}
          >
            ✕
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <ProductForm
          initialValues={product || {}}
          onSubmit={handleSubmit}
          submitLabel={saving ? 'Guardando...' : 'Guardar'}
        />
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}

