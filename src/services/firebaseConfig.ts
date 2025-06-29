import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork } from 'firebase/firestore';

// Configuració Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Control de Firebase
export const FIREBASE_ENABLED = true;

// Verificar configuració
export const isFirebaseConfigured = (): boolean => {
  const requiredFields = [
    'apiKey', 'authDomain', 'projectId', 
    'storageBucket', 'messagingSenderId', 'appId'
  ];
  
  return requiredFields.every(field => {
    const value = firebaseConfig[field as keyof typeof firebaseConfig];
    return value && value.trim() !== '';
  });
};



// Inicialitzar Firebase
const app = initializeApp(firebaseConfig);

// Inicialitzar serveis
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configurar Firestore amb millor gestió d'errors
if (FIREBASE_ENABLED && isFirebaseConfigured()) {
  // Intentar habilitar la xarxa de Firestore
  enableNetwork(db).catch(() => {
    // Ignorar errors de xarxa
  });
}

// Funcions d'utilitat per gestionar la xarxa de Firestore
export const enableFirebaseNetwork = async (): Promise<boolean> => {
  try {
    await enableNetwork(db);
    return true;
  } catch {
    return false;
  }
};



// Detectar estat de la xarxa
export const checkFirestoreConnection = async (): Promise<'online' | 'offline' | 'error'> => {
  try {
    // Intentar una operació simple per verificar la connexió
    const testPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      // Simular una verificació de connexió
      fetch('https://firestore.googleapis.com/v1/projects/' + firebaseConfig.projectId, {
        method: 'HEAD',
        mode: 'no-cors'
      })
      .then(() => {
        clearTimeout(timeout);
        resolve('online');
      })
      .catch(() => {
        clearTimeout(timeout);
        resolve('offline');
      });
    });

    const result = await testPromise;
    return result as 'online' | 'offline';
  } catch {
    return 'error';
  }
};

export default app;