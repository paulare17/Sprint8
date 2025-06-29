import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CalendarEvent, Reminder } from '../components/types';
import { useAuth } from '../hooks/useAuth';
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  onSnapshot, 
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

// 📋 Què pot fer el calendari (mantenim els noms originals)
interface CalendarContextType {
  events: CalendarEvent[];
  reminders: Reminder[];
  isLoading: boolean;
  addProductAddedEvent: (listId: string, listName: string, itemId: string, itemName: string, date: Date) => void;
  markPurchaseCompleted: (listId: string, listName: string, itemId: string, itemName: string, date: Date) => void;
  createReminder: (listId: string, itemName: string, intervalWeeks: number, originalDate?: Date, supermarket?: { id: string; name: string; chain?: string; }) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;

}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  
  // stats calendari
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || !userProfile) {
      setEvents([]);
      setReminders([]);
      return;
    }

    // Carregar events
    const eventsQuery = query(
      collection(db, 'calendarEvents'),
      where('createdBy', '==', userProfile.email)
    );

    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const eventsList: CalendarEvent[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        eventsList.push({
          id: doc.id,
          title: data.title,
          date: data.date,
          type: data.type,
          listId: data.listId,
          listName: data.listName,
          itemId: data.itemId,
          itemName: data.itemName,
          backgroundColor: data.backgroundColor,
          borderColor: data.borderColor
        });
      });
      setEvents(eventsList);
    });

    // Carregar recordatoris
    const remindersQuery = query(
      collection(db, 'reminders'),
      where('createdBy', '==', userProfile.email),
      where('isActive', '==', true)
    );

    const unsubscribeReminders = onSnapshot(remindersQuery, (snapshot) => {
      const remindersList: Reminder[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        remindersList.push({
          id: doc.id,
          listId: data.listId,
          itemName: data.itemName,
          originalPurchaseDate: data.originalPurchaseDate?.toDate() || new Date(),
          reminderDate: data.reminderDate?.toDate() || new Date(),
          intervalWeeks: data.intervalWeeks,
          isActive: data.isActive,
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate() || new Date(),
          supermarket: data.supermarket
        });
      });
      setReminders(remindersList);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeReminders();
    };
  }, [currentUser, userProfile]);

  // afegir producte
  const addProductAddedEvent = async (listId: string, listName: string, itemId: string, itemName: string, date: Date) => {
    if (!userProfile) return;

    const eventData = {
      title: `➕ ${itemName} afegit a ${listName}`,
      date: date.toISOString().split('T')[0], // "2024-01-15"
      type: 'product_added',
      listId,
      listName,
      itemId,
      itemName,
      backgroundColor: '#e3f2fd', // Blau clar
      borderColor: '#2196f3',     // Blau
      createdBy: userProfile.email,
      createdAt: Timestamp.now()
    };

    try {
      await setDoc(doc(db, 'calendarEvents', `${listId}-${itemId}-added-${Date.now()}`), eventData);
    } catch {
      // Error manejado silenciosamente
    }
  };

  // marcar cheked
  const markPurchaseCompleted = async (listId: string, listName: string, itemId: string, itemName: string, date: Date) => {
    if (!userProfile) return;

    const eventData = {
      title: `✅ ${itemName} comprat de ${listName}`,
      date: date.toISOString().split('T')[0],
      type: 'purchase_completed',
      listId,
      listName,
      itemId,
      itemName,
      backgroundColor: '#e8f5e8', // Verd clar
      borderColor: '#4caf50',     // Verd
      createdBy: userProfile.email,
      createdAt: Timestamp.now()
    };

    try {
      await setDoc(doc(db, 'calendarEvents', `${listId}-${itemId}-purchased-${Date.now()}`), eventData);
    } catch {
      // Error manejado silenciosamente
    }
  };

  // Crear un recordatori 
  const createReminder = async (listId: string, itemName: string, intervalWeeks: number, originalDate: Date = new Date(), supermarket?: { id: string; name: string; chain?: string; }) => {
    if (!userProfile) return;

    // calcular quan recordar
    const reminderDate = new Date(originalDate);
    reminderDate.setDate(reminderDate.getDate() + (intervalWeeks * 7));

    const reminderData = {
      listId,
      itemName,
      originalPurchaseDate: Timestamp.fromDate(originalDate),
      reminderDate: Timestamp.fromDate(reminderDate),
      intervalWeeks,
      isActive: true,
      createdBy: userProfile.email,
      createdAt: Timestamp.now(),
      ...(supermarket && { supermarket })
    };

    try {
      await setDoc(doc(db, 'reminders', `reminder-${Date.now()}`), reminderData);
    } catch {
      // Error manejado silenciosamente
    }
  };

  // eliminar recordatori
  const deleteReminder = async (reminderId: string) => {
    try {
      await deleteDoc(doc(db, 'reminders', reminderId));
    } catch {
      // Error manejado silenciosamente
    }
  };




  const contextValue: CalendarContextType = {
    events,
    reminders,
    isLoading,
    addProductAddedEvent,        // Nom original mantenen
    markPurchaseCompleted,       // Nom original mantenen  
    createReminder,              // Signatura original mantinguda
    deleteReminder
  };

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};

// Hook per usar el calendari
export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar s\'ha d\'usar dins de CalendarProvider');
  }
  return context;
}; 