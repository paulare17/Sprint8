import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ShoppingList, ToDoItem } from '../components/types';
import { useAuth } from './AuthContext';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  onSnapshot, 
  arrayUnion,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { db, FIREBASE_ENABLED } from '../services/firebaseConfig';

interface ShoppingListContextType {
  currentList: ShoppingList | null;
  userLists: ShoppingList[];
  isLoading: boolean;
  createNewList: (name: string, postalCode: string) => Promise<string>;
  joinList: (listId: string) => Promise<boolean>;
  switchToList: (listId: string) => void;
  addItemToCurrentList: (item: Omit<ToDoItem, 'id' | 'addedBy' | 'addedAt'>) => void;
  toggleItemInCurrentList: (itemId: string) => void;
  deleteItemFromCurrentList: (itemId: string) => void;
  updateCurrentList: (updates: Partial<ShoppingList>) => void;
  leaveList: (listId: string) => Promise<void>;
  deleteList: (listId: string) => Promise<boolean>;
  generateListId: () => string;
}

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

interface ShoppingListProviderProps {
  children: ReactNode;
}



export const ShoppingListProvider: React.FC<ShoppingListProviderProps> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [userLists, setUserLists] = useState<ShoppingList[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generar ID únic per a les llistes
  const generateListId = (): string => {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  // Carregar llistes de l'usuari des de Firestore amb listener en temps real
  useEffect(() => {
    if (!currentUser || !userProfile) {
      setUserLists([]);
      setCurrentList(null);
      // Netejar la llista seleccionada del localStorage quan no hi ha usuari
      localStorage.removeItem('selectedListId');
      return;
    }

    console.log('🔥 Setting up Firestore listener for user lists...');
    
    let unsubscribe: (() => void) | null = null;

    const setupFirestoreListener = async () => {
      try {
        // Query per llistes on l'usuari és membre
        const listsQuery = query(
          collection(db, 'shoppingLists'),
          where('members', 'array-contains', userProfile.email)
        );

        // Listener en temps real
        unsubscribe = onSnapshot(listsQuery, 
          (snapshot) => {
            const lists: ShoppingList[] = [];
            
            snapshot.forEach((doc) => {
              const data = doc.data();
              const list: ShoppingList = {
                id: doc.id,
                name: data.name,
                postalCode: data.postalCode,
                createdBy: data.createdBy,
                createdAt: data.createdAt?.toDate() || new Date(),
                items: data.items || [],
                members: data.members || [],
                isActive: data.isActive ?? true
              };
              lists.push(list);
            });

            console.log(`✅ Loaded ${lists.length} lists from Firestore`);
            setUserLists(lists);

            // Restaurar la llista seleccionada si existeix al localStorage
            const savedSelectedListId = localStorage.getItem('selectedListId');
            
            // Mantenir la llista activa si encara existeix
            setCurrentList(prevCurrentList => {
              if (prevCurrentList) {
                const updatedCurrentList = lists.find(list => list.id === prevCurrentList.id);
                return updatedCurrentList || null;
              }
              
              // Si no hi ha llista seleccionada però hi ha una guardada al localStorage, restaurar-la
              if (savedSelectedListId) {
                const savedList = lists.find(list => list.id === savedSelectedListId);
                if (savedList) {
                  console.log(`🔄 Restaurant llista seleccionada: ${savedList.name}`);
                  return savedList;
                }
              }
              
              return prevCurrentList;
            });
          },
          (error) => {
            console.error('❌ Error in Firestore listener:', error);
            // Fallback a localStorage si Firestore falla
            loadUserListsFromLocalStorage();
          }
        );
      } catch (error) {
        console.error('❌ Error setting up Firestore listener:', error);
        // Fallback a localStorage si Firestore falla
        loadUserListsFromLocalStorage();
      }
    };

    const loadUserListsFromLocalStorage = () => {
      console.log('⚠️ Falling back to localStorage...');
      try {
        const savedLists = localStorage.getItem('shoppingLists');
        const allLists: ShoppingList[] = savedLists ? JSON.parse(savedLists) : [];
        
        const userAccessibleLists = allLists.filter(list => 
          list.members.includes(userProfile.email) || list.createdBy === userProfile.email
        );
        
        setUserLists(userAccessibleLists);
        
        // Restaurar la llista seleccionada si existeix al localStorage
        const savedSelectedListId = localStorage.getItem('selectedListId');
        if (savedSelectedListId) {
          const savedList = userAccessibleLists.find(list => list.id === savedSelectedListId);
          if (savedList) {
            console.log(`🔄 Restaurant llista seleccionada (localStorage): ${savedList.name}`);
            setCurrentList(savedList);
          }
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        setUserLists([]);
      }
    };

    setupFirestoreListener();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        console.log('🔄 Cleaning up Firestore listener...');
        unsubscribe();
      }
    };
  }, [currentUser, userProfile]);

  // Guardar llistes al localStorage
  const saveListsToStorage = (lists: ShoppingList[]) => {
    try {
      const savedLists = localStorage.getItem('shoppingLists');
      const allLists: ShoppingList[] = savedLists ? JSON.parse(savedLists) : [];
      
      // Actualitzar o afegir les llistes modificades
      lists.forEach(updatedList => {
        const index = allLists.findIndex(list => list.id === updatedList.id);
        if (index >= 0) {
          allLists[index] = updatedList;
        } else {
          allLists.push(updatedList);
        }
      });
      
      localStorage.setItem('shoppingLists', JSON.stringify(allLists));
    } catch (error) {
      console.error('Error saving lists to storage:', error);
    }
  };

  // Crear nova llista
  const createNewList = async (name: string, postalCode: string): Promise<string> => {
    if (!currentUser || !userProfile) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    try {
      const listId = generateListId();
      const newListData = {
        name: name.trim(),
        postalCode: postalCode.trim(),
        createdBy: userProfile.email,
        createdAt: Timestamp.now(),
        items: [],
        members: [userProfile.email],
        isActive: true
      };

      console.log('🔥 Creating new list in Firestore:', listId);
      
      // Guardar a Firestore amb ID específic
      await setDoc(doc(db, 'shoppingLists', listId), newListData);
      
      console.log('✅ List created successfully in Firestore');
      
      // El listener automàticament actualitzarà userLists
      // Però podem crear l'objecte local per seleccionar-lo immediatament
      const newList: ShoppingList = {
        id: listId,
        ...newListData,
        createdAt: new Date()
      };
      
      setCurrentList(newList);
      // Guardar la nova llista com a seleccionada al localStorage
      localStorage.setItem('selectedListId', listId);
      console.log(`💾 Nova llista creada i seleccionada: ${newList.name} (${listId})`);
      
      return listId;
    } catch (error) {
      console.error('❌ Error creating new list:', error);
      
      // Fallback a localStorage si Firestore falla
      try {
        const newList: ShoppingList = {
          id: generateListId(),
          name: name.trim(),
          postalCode: postalCode.trim(),
          createdBy: userProfile.email,
          createdAt: new Date(),
          items: [],
          members: [userProfile.email],
          isActive: true
        };

        const updatedLists = [...userLists, newList];
        setUserLists(updatedLists);
        setCurrentList(newList);
        
        saveListsToStorage([newList]);
        
        // Guardar la nova llista com a seleccionada al localStorage
        localStorage.setItem('selectedListId', newList.id);
        
        console.log('⚠️ List created in localStorage as fallback');
        return newList.id;
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Unir-se a una llista existent
  const joinList = async (listId: string): Promise<boolean> => {
    if (!currentUser || !userProfile) {
      throw new Error('User not authenticated');
    }

    console.log('🔍 Attempting to join list:', listId);
    setIsLoading(true);

    try {
      // Buscar la llista a Firestore
      const listRef = doc(db, 'shoppingLists', listId);
      const listSnap = await getDoc(listRef);
      
      if (!listSnap.exists()) {
        console.warn('❌ List not found in Firestore:', listId);
        
        // Fallback: buscar a localStorage
        try {
          const savedLists = localStorage.getItem('shoppingLists');
          const allLists: ShoppingList[] = savedLists ? JSON.parse(savedLists) : [];
          const listToJoin = allLists.find(list => list.id === listId);
          
          if (!listToJoin) {
            return false; // Llista no trobada
          }

          if (listToJoin.members.includes(userProfile.email)) {
            return true; // Ja és membre
          }

          // Afegir l'usuari a la llista en localStorage
          listToJoin.members.push(userProfile.email);
          const updatedLists = [...userLists, listToJoin];
          setUserLists(updatedLists);
          saveListsToStorage([listToJoin]);
          
          console.log('✅ Joined list via localStorage fallback');
          return true;
        } catch (fallbackError) {
          console.error('❌ Fallback failed:', fallbackError);
          return false;
        }
      }

      const listData = listSnap.data();
      console.log('✅ List found in Firestore:', listData.name);

      // Verificar si l'usuari ja és membre
      if (listData.members && listData.members.includes(userProfile.email)) {
        console.log('ℹ️ User is already a member of this list');
        return true;
      }

      // Afegir l'usuari a la llista a Firestore
      await updateDoc(listRef, {
        members: arrayUnion(userProfile.email)
      });

      console.log('✅ Successfully joined list in Firestore');
      return true;

    } catch (error) {
      console.error('❌ Error joining list:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Canviar a una llista específica
  const switchToList = (listId: string) => {
    if (!listId) {
      // Si es passa cadena buida, deseleccionar la llista actual
      setCurrentList(null);
      localStorage.removeItem('selectedListId');
      return;
    }
    
    const list = userLists.find(l => l.id === listId);
    if (list) {
      setCurrentList(list);
      // Guardar l'ID de la llista seleccionada al localStorage
      localStorage.setItem('selectedListId', listId);
      console.log(`💾 Llista seleccionada guardada: ${list.name} (${listId})`);
    }
  };

  // Afegir item a la llista actual
  const addItemToCurrentList = (item: Omit<ToDoItem, 'id' | 'addedBy' | 'addedAt'>) => {
    if (!currentList || !userProfile) return;

    const newItem: ToDoItem = {
      ...item,
      id: Date.now().toString(),
      addedBy: userProfile.email,
      addedAt: new Date()
    };

    // Actualitzar immediatament l'estat local per UX responsiva
    const updatedList = {
      ...currentList,
      items: [...currentList.items, newItem]
    };

    setCurrentList(updatedList);
    
    const updatedLists = userLists.map(list => 
      list.id === currentList.id ? updatedList : list
    );
    setUserLists(updatedLists);

    // Actualitzar a Firestore en background
    const updateFirestore = async () => {
      try {
        const listRef = doc(db, 'shoppingLists', currentList.id);
        await updateDoc(listRef, {
          items: arrayUnion(newItem)
        });
        console.log('✅ Item synced to Firestore successfully');
      } catch (error) {
        console.error('❌ Error syncing item to Firestore:', error);
        // Guardar localment com a fallback
        saveListsToStorage([updatedList]);
        console.log('⚠️ Item saved locally as fallback');
      }
    };

    updateFirestore();
  };

  // Marcar/desmarcar item de la llista actual
  // Aquesta funció sincronitza l'estat entre tots els usuaris de la llista
  // Quan un usuari marca un producte, tots els altres ho veuran automàticament
  const toggleItemInCurrentList = (itemId: string) => {
    if (!currentList) return;

    // Trobar l'item a modificar
    const itemToToggle = currentList.items.find(item => item.id === itemId);
    if (!itemToToggle) return;

    // Crear l'item actualitzat
    const updatedItem = { ...itemToToggle, done: !itemToToggle.done };

    // Actualitzar immediatament l'estat local per UX responsiva
    const updatedList = {
      ...currentList,
      items: currentList.items.map(item =>
        item.id === itemId ? updatedItem : item
      )
    };

    setCurrentList(updatedList);
    
    const updatedLists = userLists.map(list => 
      list.id === currentList.id ? updatedList : list
    );
    setUserLists(updatedLists);

    // Sincronitzar amb Firestore en background
    const syncToggleToFirestore = async () => {
      try {
        const listRef = doc(db, 'shoppingLists', currentList.id);
        
        // Primer obtenir la llista actual de Firestore
        const listDoc = await getDoc(listRef);
        if (listDoc.exists()) {
          const currentFirestoreData = listDoc.data();
          const currentItems = currentFirestoreData.items || [];
          
          // Actualitzar només l'item específic
          const updatedFirestoreItems = currentItems.map((item: ToDoItem) =>
            item.id === itemId ? updatedItem : item
          );
          
          // Guardar a Firestore
          await updateDoc(listRef, {
            items: updatedFirestoreItems
          });
          
          console.log(`✅ Item ${updatedItem.done ? 'marked as completed' : 'unmarked'} in Firestore`);
        }
      } catch (error) {
        console.error('❌ Error Firestore:', error);
        // Guardar localment com a fallback
        saveListsToStorage([updatedList]);
        console.log('⚠️ Toggle saved locally as fallback');
      }
    };

    syncToggleToFirestore();
  };

  // Eliminar item de la llista actual
  const deleteItemFromCurrentList = (itemId: string) => {
    if (!currentList) return;

    const updatedList = {
      ...currentList,
      items: currentList.items.filter(item => item.id !== itemId)
    };

    setCurrentList(updatedList);
    
    const updatedLists = userLists.map(list => 
      list.id === currentList.id ? updatedList : list
    );
    setUserLists(updatedLists);
    
    saveListsToStorage([updatedList]);
  };

  // Actualitzar llista actual
  const updateCurrentList = (updates: Partial<ShoppingList>) => {
    if (!currentList) return;

    const updatedList = { ...currentList, ...updates };
    setCurrentList(updatedList);
    
    const updatedLists = userLists.map(list => 
      list.id === currentList.id ? updatedList : list
    );
    setUserLists(updatedLists);
    
    saveListsToStorage([updatedList]);
  };

  // Sortir d'una llista
  const leaveList = async (listId: string) => {
    if (!userProfile) return;

    try {
      // Actualitzar a Firestore si està disponible
      if (FIREBASE_ENABLED) {
        const listRef = doc(db, 'shoppingLists', listId);
        await updateDoc(listRef, {
          members: arrayRemove(userProfile.email)
        });
        console.log('✅ User removed from list in Firestore');
      }
    } catch (error) {
      console.error('❌ Error leaving list in Firestore:', error);
    }

    // Actualitzar estat local
    const updatedLists = userLists.filter(list => list.id !== listId);
    setUserLists(updatedLists);

    if (currentList?.id === listId) {
      setCurrentList(null);
      localStorage.removeItem('selectedListId');
    }

    // Fallback localStorage
    try {
      const savedLists = localStorage.getItem('shoppingLists');
      const allLists: ShoppingList[] = savedLists ? JSON.parse(savedLists) : [];
      
      const listIndex = allLists.findIndex(list => list.id === listId);
      if (listIndex >= 0) {
        allLists[listIndex].members = allLists[listIndex].members.filter(
          member => member !== userProfile.email
        );
        localStorage.setItem('shoppingLists', JSON.stringify(allLists));
      }
    } catch (error) {
      console.error('Error leaving list:', error);
    }
  };

  // 🗑️ Eliminar llista completament (només el creador)
  const deleteList = async (listId: string): Promise<boolean> => {
    if (!userProfile) {
      throw new Error('No hi ha usuari autenticat');
    }

    const listToDelete = userLists.find(list => list.id === listId);
    if (!listToDelete) {
      throw new Error('Llista no trobada');
    }

    // Verificar que l'usuari és el creador
    if (listToDelete.createdBy !== userProfile.email) {
      throw new Error('Només el creador pot eliminar la llista');
    }

    setIsLoading(true);

    try {
      // Eliminar de Firestore si està disponible
      if (FIREBASE_ENABLED) {
        const listRef = doc(db, 'shoppingLists', listId);
        await deleteDoc(listRef);
        console.log('✅ List deleted from Firestore');
      }

      // Actualitzar estat local
      const updatedLists = userLists.filter(list => list.id !== listId);
      setUserLists(updatedLists);

      if (currentList?.id === listId) {
        setCurrentList(null);
        localStorage.removeItem('selectedListId');
      }

      // Eliminar de localStorage
      try {
        const savedLists = localStorage.getItem('shoppingLists');
        const allLists: ShoppingList[] = savedLists ? JSON.parse(savedLists) : [];
        const filteredLists = allLists.filter(list => list.id !== listId);
        localStorage.setItem('shoppingLists', JSON.stringify(filteredLists));
      } catch (localError) {
        console.warn('Error removing from localStorage:', localError);
      }

      console.log(`✅ Llista "${listToDelete.name}" eliminada correctament`);
      return true;

    } catch (error) {
      console.error('❌ Error deleting list:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: ShoppingListContextType = {
    currentList,
    userLists,
    isLoading,
    createNewList,
    joinList,
    switchToList,
    addItemToCurrentList,
    toggleItemInCurrentList,
    deleteItemFromCurrentList,
    updateCurrentList,
    leaveList,
    deleteList,
    generateListId
  };

  return (
    <ShoppingListContext.Provider value={contextValue}>
      {children}
    </ShoppingListContext.Provider>
  );
};

export const useShoppingList = (): ShoppingListContextType => {
  const context = useContext(ShoppingListContext);
  if (!context) {
    throw new Error('useShoppingList must be used within a ShoppingListProvider');
  }
  return context;
}; 