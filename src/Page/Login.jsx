import React, { useState } from 'react';
import './CSS/login.css'; // Importamos el archivo CSS puro
import { useNavigate } from 'react-router-dom';
import pb from '../services/database';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authData = await pb.collection('users').authWithPassword(
        email,
        password,
      );

      // Si la autenticación es exitosa, PocketBase guarda automáticamente el token.
      console.log('Usuario logeado:', authData.record);

      // Redirección exitosa
      navigate('/dashboard');

    } catch (error) {
      // PocketBase lanza errores si las credenciales son incorrectas
      console.error('Error de autenticación:', error);
      setError('Credenciales inválidas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Encabezado y Logo */}
        <div className="header">

          <h2 className="title">
            Bienvenido a KioskoSmart
          </h2>
          <p className="subtitle">
            Accede a tu Panel de Gestión
          </p>
        </div>

        <form className="form-group-container" onSubmit={handleSubmit}>

          {/* Campo Email/Usuario */}
          <InputField label="Email o Usuario" id="email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />

          {/* Campo Contraseña */}
          <InputField label="Contraseña" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />

          {/* Manejo de Errores */}
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          {/* Opciones Adicionales */}
          <div className="options-container">
            <div className="checkbox-group">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="checkbox-input"
              />
              <label htmlFor="remember-me" className="checkbox-label">
                Recordar en este dispositivo
              </label>
            </div>
          </div>

          {/* Botón de Submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
            >
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente auxiliar para inputs
const InputField = ({ label, id, type, value, onChange, disabled }) => (
  <div className="form-group">
    <label htmlFor={id} className="input-label">
      {label}
    </label>
    <div className="input-wrap">
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        required
        className="input-field"
        disabled={disabled}
      />
    </div>
  </div>
);

export default Login;
