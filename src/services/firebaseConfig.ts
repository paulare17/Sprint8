import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore';

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

// Logging de configuració
console.log('Firebase Config Check:', {
  enabled: FIREBASE_ENABLED,
  configured: isFirebaseConfigured(),
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

if (isFirebaseConfigured()) {
  console.log('✅ Firebase configuration loaded successfully');
} else {
  console.error('❌ Firebase configuration incomplete');
}

// Inicialitzar Firebase
const app = initializeApp(firebaseConfig);

// Inicialitzar serveis
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configurar Firestore amb millor gestió d'errors
if (FIREBASE_ENABLED && isFirebaseConfigured()) {
  // Configurar listeners d'errors globals per Firestore
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Detectar errors específics de Firestore
    const errorMessage = args.join(' ');
    
    if (errorMessage.includes('400') && errorMessage.includes('firestore.googleapis.com')) {
      console.warn('🔥 Firestore 400 Error detected - This is usually due to:');
      console.warn('1. Firestore security rules being too restrictive');
      console.warn('2. Project configuration issues');
      console.warn('3. Database not properly initialized');
      console.warn('4. Network connectivity problems');
      console.warn('💡 The app will continue working with local data');
    }
    
    if (errorMessage.includes('firestore') && errorMessage.includes('offline')) {
      console.warn('🔥 Firestore offline mode activated');
    }
    
    // Cridar el console.error original
    originalConsoleError.apply(console, args);
  };

  // Intentar habilitar la xarxa de Firestore
  try {
    enableNetwork(db).catch((error) => {
      console.warn('⚠️ Could not enable Firestore network:', error.message);
    });
  } catch (error) {
    console.warn('⚠️ Firestore network configuration failed:', error);
  }
}

// Funcions d'utilitat per gestionar la xarxa de Firestore
export const enableFirebaseNetwork = async (): Promise<boolean> => {
  try {
    await enableNetwork(db);
    console.log('✅ Firestore network enabled');
    return true;
  } catch (error) {
    console.error('❌ Failed to enable Firestore network:', error);
    return false;
  }
};

export const disableFirebaseNetwork = async (): Promise<boolean> => {
  try {
    await disableNetwork(db);
    console.log('✅ Firestore network disabled (offline mode)');
    return true;
  } catch (error) {
    console.error('❌ Failed to disable Firestore network:', error);
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
  } catch (error) {
    console.warn('Firestore connection check failed:', error);
    return 'error';
  }
};

export default app;