import React, { useState, useEffect } from 'react';
import { isFirebaseConfigured, FIREBASE_ENABLED } from '../services/firebaseConfig';

interface FirebaseErrorHandlerProps {
  children: React.ReactNode;
}

const FirebaseErrorHandler: React.FC<FirebaseErrorHandlerProps> = ({ children }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Si Firebase està desactivat, mostrar banner informatiu
    if (!FIREBASE_ENABLED) {
      setShowError(true);
      return;
    }

    // Verificar si Firebase està configurat
    const checkFirebaseConfig = () => {
      if (!isFirebaseConfigured()) {
        setShowError(true);
        return;
      }
    };

    // Detectar estat de connectivitat
    const handleOnline = () => {
      setIsOffline(false);
      setShowError(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowError(true);
    };

    checkFirebaseConfig();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showError) {
    return (
      <div className="firebase-error-container">
        <div className="firebase-error-banner">
          <div className="error-content">
            {!FIREBASE_ENABLED ? (
              <>
                <h3>🔧 Mode desenvolupament</h3>
                <p>Firebase està temporalment desactivat per evitar errors de connexió. L'app funciona amb dades locals.</p>
                <button 
                  onClick={() => setShowError(false)} 
                  className="continue-offline-btn"
                >
                  Continuar en mode offline
                </button>
              </>
            ) : isOffline ? (
              <>
                <h3>🌐 Sense connexió a internet</h3>
                <p>No tens connexió a internet. Algunes funcionalitats poden no estar disponibles.</p>
                <button 
                  onClick={() => setShowError(false)} 
                  className="continue-offline-btn"
                >
                  Continuar sense connexió
                </button>
              </>
            ) : (
              <>
                <h3>⚠️ Error de configuració</h3>
                <p>Hi ha hagut un problema amb la configuració de Firebase. Comprova el fitxer .env.</p>
                <button 
                  onClick={() => setShowError(false)} 
                  className="continue-offline-btn"
                >
                  Continuar en mode desenvolupament
                </button>
              </>
            )}
          </div>
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
};

export default FirebaseErrorHandler; 