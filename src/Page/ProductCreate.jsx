import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm from './Components/ProductForm';
import pb from '../services/database';

export default function ProductCreate() {
  const navigate = useNavigate();

  const handleCreate = async (payload, isFormData) => {
    try {
      if (isFormData) {
        await pb.collection('productos').create(payload);
      } else {
        await pb.collection('productos').create(payload);
      }
      alert('Producto creado correctamente');
      navigate('/productos');
    } catch (err) {
      console.error('Error creando producto:', err);
      alert('Error al crear producto: ' + (err?.message || err));
      throw err;
    }
  };

  return (
    <div className="page product-create">
      <h2>Crear Producto</h2>
      <div className="card">
        <ProductForm onSubmit={handleCreate} submitLabel="Crear" />
      </div>
    </div>
  );
}
