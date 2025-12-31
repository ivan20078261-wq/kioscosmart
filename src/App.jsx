// App.jsx (Ejemplo de cómo deben verse tus rutas)
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Page/Login'; // Asegúrate de que esta ruta sea correcta
import Dashboard from './Page/Dashboard'; // Asume que tienes este componente
import Productos from './Page/Productos';
import ProductCreate from './Page/ProductCreate';
import ProductEdit from './Page/ProductEdit';
import SalesPoint from './Page/SalesPoint';
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta para el Login */}
        <Route path="/" element={<Login />} />

        {/* Ruta protegida principal de la aplicación */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/productos/create" element={<ProductCreate />} />
        <Route path="/productos/:id/edit" element={<ProductEdit />} />
        <Route path="/ventas" element={<SalesPoint />} />
        {/* Puedes añadir más rutas aquí, como /products, /sales, etc. */}
      </Routes>
    </BrowserRouter>
  );
};

export default App;