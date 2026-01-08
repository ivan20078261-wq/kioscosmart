// Archivo: ../services/database.js (VERSIÓN SOLO POCKETHOST)

import PocketBase from 'pocketbase';

// 🚀 REEMPLAZA ESTO: Pon la URL de tu instancia de PocketHost aquí
const POCKETHOST_URL = 'http://127.0.0.1:8090/';

// Importante: Asegúrate de que la URL empiece con https://
const pb = new PocketBase(POCKETHOST_URL);

// Mantiene la conexión activa para el usuario autenticado
pb.authStore.onChange((token, model) => {
  console.log('Usuario o token cambiado:', model);
});

export default pb;
