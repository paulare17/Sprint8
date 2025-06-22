import React, { useState, useEffect } from 'react';
import { auth, db, checkFirestoreConnection } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface FirebaseStatus {
  auth: 'connected' | 'disconnected' | 'error';
  firestore: 'connected' | 'disconnected' | 'error';
  lastError?: string;
  lastErrorTime?: Date;
  errorDetails?: string;
}

const FirebaseErrorHandler: React.FC = () => {
  const [status, setStatus] = useState<FirebaseStatus>({
    auth: 'disconnected',
    firestore: 'disconnected'
  });
  const [isVisible, setIsVisible] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Interceptar errors de consola per detectar l'error 400
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      
      if (errorMessage.includes('400') && errorMessage.includes('firestore.googleapis.com')) {
        if (mounted) {
          setStatus(prev => ({
            ...prev,
            firestore: 'error',
            lastError: 'Error 400 de Firestore: Problema de configuració o permisos',
            errorDetails: 'Aquest error sol passar per regles de seguretat restrictives o problemes de configuració del projecte Firebase.',
            lastErrorTime: new Date()
          }));
          setIsVisible(true);
        }
      }
      
      // Cridar el console.error original
      originalConsoleError.apply(console, args);
    };

    const checkFirebaseStatus = async () => {
      try {
        // Verificar Auth
        const authPromise = new Promise<'connected' | 'error'>((resolve) => {
          const unsubscribe = onAuthStateChanged(auth, 
            (user) => {
              console.log('Firebase Auth connection established successfully');
              unsubscribe();
              resolve('connected');
            },
            (error) => {
              console.error('Firebase Auth error:', error);
              unsubscribe();
              resolve('error');
            }
          );
        });

        // Verificar Firestore amb timeout més curt
        const firestorePromise = new Promise<'connected' | 'error'>((resolve) => {
          const timeout = setTimeout(() => {
            resolve('error');
          }, 3000); // 3 segons timeout

          // Intentar una operació simple a Firestore
          const testDoc = doc(db, 'test', 'connection');
          getDoc(testDoc)
            .then(() => {
              clearTimeout(timeout);
              console.log('✅ Firestore connection successful');
              resolve('connected');
            })
            .catch((error) => {
              clearTimeout(timeout);
              console.warn('⚠️ Firestore connection failed:', error);
              
              // Detectar error 400 específicament
              if (error.message.includes('400') || error.code === 'failed-precondition') {
                resolve('error');
              } else {
                resolve('error');
              }
            });
        });

        const [authStatus, firestoreStatus] = await Promise.all([
          authPromise,
          firestorePromise
        ]);

        if (mounted) {
          const newStatus: FirebaseStatus = {
            auth: authStatus,
            firestore: firestoreStatus
          };

          // Si hi ha errors, mostrar banner
          if (authStatus === 'error' || firestoreStatus === 'error') {
            if (firestoreStatus === 'error') {
              newStatus.lastError = 'Firestore no disponible. L\'aplicació funcionarà amb dades locals.';
              newStatus.errorDetails = 'Això pot ser degut a regles de seguretat restrictives o problemes de configuració.';
            } else {
              newStatus.lastError = 'Error de connexió amb Firebase Auth.';
            }
            newStatus.lastErrorTime = new Date();
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }

          setStatus(newStatus);
        }
      } catch (error) {
        console.error('Error checking Firebase status:', error);
        if (mounted) {
          setStatus({
            auth: 'error',
            firestore: 'error',
            lastError: 'Error general de connexió amb Firebase',
            lastErrorTime: new Date()
          });
          setIsVisible(true);
        }
      }
    };

    checkFirebaseStatus();

    // Verificar cada 30 segons si hi ha errors
    const interval = setInterval(() => {
      if (status.auth === 'error' || status.firestore === 'error') {
        checkFirebaseStatus();
      }
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
      // Restaurar console.error original
      console.error = originalConsoleError;
    };
  }, [status.auth, status.firestore]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setStatus({
      auth: 'disconnected',
      firestore: 'disconnected'
    });
    
    // Forçar una nova verificació
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const toggleDiagnostic = () => {
    setShowDiagnostic(!showDiagnostic);
  };

  if (!isVisible) return null;

  const getStatusColor = () => {
    if (status.auth === 'error' || status.firestore === 'error') {
      return 'error';
    }
    return 'warning';
  };

  const getStatusMessage = () => {
    if (status.firestore === 'error' && status.auth === 'connected') {
      return 'Firestore no disponible. L\'aplicació funciona amb dades locals.';
    }
    if (status.auth === 'error') {
      return 'Error de connexió amb Firebase. Comprova la teva connexió a internet.';
    }
    return status.lastError || 'Error de connexió amb Firebase';
  };

  return (
    <div className={`firebase-error-banner ${getStatusColor()}`}>
      <div className="firebase-error-content">
        <div className="firebase-error-icon">
          {status.firestore === 'error' && status.auth === 'connected' ? '⚠️' : '❌'}
        </div>
        <div className="firebase-error-message">
          <strong>{getStatusMessage()}</strong>
          {status.errorDetails && (
            <div className="firebase-error-details">
              {status.errorDetails}
            </div>
          )}
          {status.lastErrorTime && (
            <div className="firebase-error-time">
              Última actualització: {status.lastErrorTime.toLocaleTimeString()}
            </div>
          )}
          {retryCount > 0 && (
            <div className="firebase-retry-count">
              Intents de reconnexió: {retryCount}
            </div>
          )}
          {showDiagnostic && (
            <div className="firebase-diagnostic">
              <h4>Informació de diagnòstic:</h4>
              <ul>
                <li><strong>Auth Status:</strong> {status.auth}</li>
                <li><strong>Firestore Status:</strong> {status.firestore}</li>
                <li><strong>Error comú:</strong> Error 400 sol indicar regles de seguretat restrictives</li>
                <li><strong>Solució:</strong> Comprova les regles de Firestore al Firebase Console</li>
                <li><strong>Regla recomanada:</strong> <code>allow read, write: if true;</code> per testing</li>
              </ul>
            </div>
          )}
        </div>
        <div className="firebase-error-actions">
          <button 
            onClick={toggleDiagnostic}
            className="firebase-diagnostic-button"
          >
            {showDiagnostic ? 'Amagar' : 'Diagnòstic'}
          </button>
          <button 
            onClick={handleRetry}
            className="firebase-retry-button"
            disabled={retryCount >= 3}
          >
            {retryCount >= 3 ? 'Massa intents' : 'Tornar a intentar'}
          </button>
          <button 
            onClick={handleDismiss}
            className="firebase-dismiss-button"
          >
            Tancar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirebaseErrorHandler; 