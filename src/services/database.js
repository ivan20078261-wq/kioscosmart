// Archivo: ../services/database.js (MODIFICACIÓN TEMPORAL)

import PocketBase from 'pocketbase';

// 🛑 FUERZA la URL al valor que sabes que está usando PocketBase
const forcedUrl = 'http://127.0.0.1:8090'; 
const pb = new PocketBase(forcedUrl);

// Mantiene la conexión activa para el usuario autenticado
pb.authStore.onChange((token, model) => {
    console.log('Usuario o token cambiado:', model);
});

export default pb;