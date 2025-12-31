import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProductForm from './Components/ProductForm';
import pb from '../services/database';

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const rec = await pb.collection('productos').getOne(id);
        if (mounted) setInitial(rec);
      } catch (err) {
        console.error('Error cargando producto:', err);
        alert('No se pudo cargar el producto');
        navigate('/productos');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id, navigate]);

  const handleUpdate = async (payload, isFormData) => {
    try {
      if (isFormData) {
        await pb.collection('productos').update(id, payload);
      } else {
        await pb.collection('productos').update(id, payload);
      }
      alert('Producto actualizado');
      navigate('/productos');
    } catch (err) {
      console.error('Error actualizando producto:', err);
      alert('Error al actualizar: ' + (err?.message || err));
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
    try {
      await pb.collection('productos').delete(id);
      alert('Producto eliminado');
      navigate('/productos');
    } catch (err) {
      console.error('Error eliminando producto:', err);
      alert('Error al eliminar: ' + (err?.message || err));
    }
  };

  if (loading) return <p>Cargando...</p>;
  return (
    <div className="page product-edit">
      <h2>Editar Producto</h2>
      <div className="card">
        <ProductForm initialValues={initial} onSubmit={handleUpdate} submitLabel="Actualizar" />
        <div style={{ marginTop: 10 }}>
          <button className="btn btn-danger" onClick={handleDelete}>Eliminar producto</button>
        </div>
      </div>
    </div>
  );
}
