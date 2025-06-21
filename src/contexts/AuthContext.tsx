import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, FIREBASE_ENABLED } from '../services/firebaseConfig';
import { authService } from '../services/authService';
import type { UserProfile } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (email: string, password: string, displayName: string, postalCode: string, listOption: 'new-list' | 'add-to-list') => Promise<UserProfile>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!FIREBASE_ENABLED) {
      // Mode offline - crear perfil per defecte
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const profile = await authService.getCurrentUserProfile();
          setUserProfile(profile);
        } catch (error) {
          console.warn('No s\'ha pogut obtenir el perfil d\'usuari:', error);
          // En cas d'error, crear un perfil temporal amb les dades disponibles
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Usuari',
            postalCode: '08001', // Valor per defecte
            listOption: 'new-list',
            createdAt: new Date()
          });
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (
    email: string, 
    password: string, 
    displayName: string, 
    postalCode: string,
    listOption: 'new-list' | 'add-to-list'
  ): Promise<UserProfile> => {
    if (!FIREBASE_ENABLED) {
      // Mode offline - crear perfil local
      const profile: UserProfile = {
        uid: 'offline-user',
        email,
        displayName,
        postalCode,
        listOption,
        createdAt: new Date()
      };
      setUserProfile(profile);
      setCurrentUser({
        uid: 'offline-user',
        email,
        displayName,
      } as User);
      return profile;
    }
    
    const profile = await authService.registerUser(email, password, displayName, postalCode, listOption);
    setUserProfile(profile);
    return profile;
  };

  const login = async (email: string, password: string): Promise<UserProfile> => {
    if (!FIREBASE_ENABLED) {
      // Mode offline - simular login
      const profile: UserProfile = {
        uid: 'offline-user',
        email,
        displayName: 'Demo User',
        postalCode: '08001',
        listOption: 'new-list',
        createdAt: new Date()
      };
      setUserProfile(profile);
      setCurrentUser({
        uid: 'offline-user',
        email,
        displayName: 'Demo User',
      } as User);
      return profile;
    }
    
    const profile = await authService.loginUser(email, password);
    setUserProfile(profile);
    return profile;
  };

  const logout = async (): Promise<void> => {
    if (!FIREBASE_ENABLED) {
      setCurrentUser(null);
      setUserProfile(null);
      return;
    }
    
    await authService.logoutUser();
    setUserProfile(null);
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};