import type { Supermarket } from '../services/supermarketService';

export interface ToDoItem {
  id: string;
  task: string;
  done: boolean;
  supermarket?: {
    id: string;
    name: string;
    chain?: string;
  }; // Informació bàsica del supermercat seleccionat
  addedBy?: string; // Email de l'usuari que va afegir l'item
  addedAt?: Date;
}

  export interface ShoppingList {
    id: string;
    name: string;
    postalCode: string;
    createdBy: string; // Email de l'usuari creador
    createdAt: Date;
    items: ToDoItem[];
    members: string[]; // Emails dels usuaris que tenen accés
    isActive: boolean;
  }

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