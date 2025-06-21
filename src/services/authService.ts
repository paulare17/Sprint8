import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    updateProfile
  } from 'firebase/auth';
  import { doc, setDoc, getDoc } from 'firebase/firestore';
  import type { DocumentSnapshot, DocumentData } from 'firebase/firestore';
  import { auth, db, FIREBASE_ENABLED } from './firebaseConfig';
  
  export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    postalCode: string;
    listOption: 'new-list' | 'add-to-list';
    createdAt: Date;
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
        // Crear usuari amb Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
  
        // Actualitzar perfil amb nom
        await updateProfile(user, {
          displayName: displayName
        });
  
        // Crear perfil a Firestore
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          displayName: displayName,
          postalCode: postalCode,
          listOption: listOption,
          createdAt: new Date()
        };
  
        await setDoc(doc(db, 'users', user.uid), userProfile);
  
        return userProfile;
      } catch (error: any) {
        console.error('Error registering user:', error);
        throw new Error(this.getErrorMessage(error.code));
      }
    }
  
      async loginUser(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Obtenir perfil de Firestore amb retry logic
      const userDoc = await this.getDocumentWithRetry('users', user.uid);
      
      if (!userDoc.exists()) {
        throw new Error('Perfil d\'usuari no trobat');
      }

      return userDoc.data() as UserProfile;
    } catch (error: any) {
      console.error('Error logging in:', error);
      
      // Si és un error de connectivitat, proporcionar un fallback
      if (this.isNetworkError(error)) {
        throw new Error('Error de connexió. Comprova la teva connexió a internet i torna-ho a intentar.');
      }
      
      throw new Error(this.getErrorMessage(error.code));
    }
  }
  
    async logoutUser(): Promise<void> {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Error logging out:', error);
        throw new Error('Error en tancar sessió');
      }
    }
  
      async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;

      const userDoc = await this.getDocumentWithRetry('users', user.uid);
      return userDoc.exists() ? userDoc.data() as UserProfile : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Mètode helper per obtenir documents amb retry logic
  private async getDocumentWithRetry(collection: string, docId: string, maxRetries: number = 3): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const docRef = doc(db, collection, docId);
        return await getDoc(docRef);
      } catch (error: any) {
        console.warn(`Intent ${i + 1} fallit per obtenir document:`, error.message);
        
        if (i === maxRetries - 1) {
          throw error;
        }
        
        // Esperar abans del següent intent (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  // Mètode per detectar errors de xarxa
  private isNetworkError(error: any): boolean {
    const networkErrorCodes = [
      'unavailable',
      'deadline-exceeded',
      'failed-precondition'
    ];
    
    return (
      error?.code && networkErrorCodes.includes(error.code) ||
      error?.message?.includes('offline') ||
      error?.message?.includes('network') ||
      error?.message?.includes('Failed to get document because the client is offline')
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
        default:
          return 'Error d\'autenticació';
      }
    }
  }
  
  export const authService = new AuthService();