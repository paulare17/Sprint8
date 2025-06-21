import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, disableNetwork, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Variable per controlar si Firebase està actiu
export const FIREBASE_ENABLED = false; // Temporalment desactivat

// Inicialitza Firebase
const app = initializeApp(firebaseConfig);

// Inicialitza serveis
export const auth = getAuth(app);
export const db = getFirestore(app);

// Deshabilitar xarxa per evitar connexions automàtiques
if (!FIREBASE_ENABLED) {
  disableNetwork(db).catch(() => {
    // Ignora errors si ja està deshabilitada
  });
}

// Gestió de la connectivitat de xarxa
export const enableFirebaseNetwork = () => {
  if (FIREBASE_ENABLED) {
    // enableNetwork(db) - desactivat temporalment
    console.log('Firebase network would be enabled');
  }
};
export const disableFirebaseNetwork = () => disableNetwork(db);

// Funció per verificar si Firebase està configurat correctament
export const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );
};

export default app;