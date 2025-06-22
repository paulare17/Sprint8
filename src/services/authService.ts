import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    updateProfile
  } from 'firebase/auth';
  import { doc, setDoc, getDoc } from 'firebase/firestore';
  import { auth, db } from './firebaseConfig';
  
  export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    postalCode: string;
    listOption: 'new-list' | 'add-to-list';
    createdAt: Date;
    currentListId?: string; // ID de la llista activa
    joinedLists?: string[]; // IDs de les llistes a les quals pertany
  }
  
  class AuthService {
    
    async registerUser(
      email: string, 
      password: string, 
      displayName: string, 
      postalCode: string,
      listOption: 'new-list' | 'add-to-list'
    ): Promise<UserProfile> {
      try {
        console.log('🔥 Starting user registration...', { email, displayName });
        
        // Crear usuari amb Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('✅ User created in Auth:', user.uid);
  
        // Actualitzar perfil amb nom
        await updateProfile(user, {
          displayName: displayName
        });
        console.log('✅ Profile updated with display name');
  
        // Crear perfil a Firestore
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          displayName: displayName,
          postalCode: postalCode,
          listOption: listOption,
          createdAt: new Date()
        };

        try {
          await setDoc(doc(db, 'users', user.uid), userProfile);
          console.log('✅ User profile saved to Firestore');
        } catch (firestoreError) {
          console.warn('⚠️ Failed to save to Firestore, but user created in Auth:', firestoreError);
          
          // Si Firestore falla, continuar amb el perfil local
          // L'usuari pot seguir utilitzant l'app amb les dades d'Auth
        }
  
        return userProfile;
      } catch (error: unknown) {
        console.error('❌ Error registering user:', error);
        const firebaseError = error as { code?: string };
        throw new Error(this.getErrorMessage(firebaseError.code || 'unknown'));
      }
    }
  
    async loginUser(email: string, password: string): Promise<UserProfile> {
      try {
        console.log('🔥 Starting user login...', { email });
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('✅ User authenticated:', user.uid);

        // Intentar obtenir perfil de Firestore amb fallback
        try {
          const userDoc = await this.getDocumentWithRetry('users', user.uid);
          
          if (userDoc && userDoc.exists()) {
            console.log('✅ User profile loaded from Firestore');
            return userDoc.data() as UserProfile;
          }
        } catch (firestoreError) {
          console.warn('⚠️ Failed to load from Firestore, using Auth data:', firestoreError);
        }

        // Fallback: crear perfil temporal amb dades d'Auth
        const fallbackProfile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || 'Usuari',
          postalCode: '08001', // Valor per defecte
          listOption: 'new-list',
          createdAt: new Date()
        };
        
        console.log('✅ Using fallback profile');
        return fallbackProfile;
        
      } catch (error: unknown) {
        console.error('❌ Error logging in:', error);
        
        // Si és un error de connectivitat, proporcionar un fallback
        if (this.isNetworkError(error)) {
          throw new Error('Error de connexió. Comprova la teva connexió a internet i torna-ho a intentar.');
        }
        
        const firebaseError = error as { code?: string };
        throw new Error(this.getErrorMessage(firebaseError.code || 'unknown'));
      }
    }
  
    async logoutUser(): Promise<void> {
      try {
        await signOut(auth);
        console.log('✅ User logged out successfully');
      } catch (error) {
        console.error('❌ Error logging out:', error);
        throw new Error('Error en tancar sessió');
      }
    }
  
    async getCurrentUserProfile(): Promise<UserProfile | null> {
      try {
        const user = auth.currentUser;
        if (!user) return null;

        try {
          const userDoc = await this.getDocumentWithRetry('users', user.uid);
          if (userDoc && userDoc.exists()) {
            return userDoc.data() as UserProfile;
          }
        } catch {
          console.warn('⚠️ Firestore unavailable, using Auth data');
        }

        // Fallback amb dades d'Auth
        return {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || 'Usuari',
          postalCode: '08001',
          listOption: 'new-list',
          createdAt: new Date()
        };
        
      } catch (error) {
        console.error('❌ Error getting user profile:', error);
        return null;
      }
    }

    // Mètode helper per obtenir documents amb retry logic
    private async getDocumentWithRetry(collection: string, docId: string, maxRetries: number = 2) {
      for (let i = 0; i < maxRetries; i++) {
        try {
          const docRef = doc(db, collection, docId);
          return await getDoc(docRef);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`⚠️ Firestore attempt ${i + 1} failed:`, errorMessage);
          
          if (i === maxRetries - 1) {
            throw error;
          }
          
          // Esperar abans del següent intent
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }

    // Mètode per detectar errors de xarxa
    private isNetworkError(error: unknown): boolean {
      const networkErrorCodes = [
        'unavailable',
        'deadline-exceeded',
        'failed-precondition',
        'network-request-failed'
      ];
      
      const firebaseError = error as { code?: string; message?: string };
      
      return Boolean(
        (firebaseError?.code && networkErrorCodes.includes(firebaseError.code)) ||
        (firebaseError?.message?.includes('offline')) ||
        (firebaseError?.message?.includes('network')) ||
        (firebaseError?.message?.includes('Failed to get document because the client is offline')) ||
        (firebaseError?.message?.includes('400'))
      );
    }
  
    private getErrorMessage(errorCode: string): string {
      switch (errorCode) {
        case 'auth/email-already-in-use':
          return 'Aquest email ja està en ús';
        case 'auth/weak-password':
          return 'La contrasenya és massa feble';
        case 'auth/invalid-email':
          return 'Email no vàlid';
        case 'auth/user-not-found':
          return 'Usuari no trobat';
        case 'auth/wrong-password':
          return 'Contrasenya incorrecta';
        case 'auth/network-request-failed':
          return 'Error de connexió. Comprova la teva connexió a internet';
        default:
          return 'Error d\'autenticació';
      }
    }
  }
  
  export const authService = new AuthService();