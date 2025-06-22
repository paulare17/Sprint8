import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CalendarEvent, Reminder, CalendarEventData, ToDoItem } from '../components/types';
import { useAuth } from './AuthContext';
import { useShoppingList } from './ShoppingListContext';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot, 
  arrayUnion,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

interface CalendarContextType {
  events: CalendarEvent[];
  reminders: Reminder[];
  isLoading: boolean;
  addProductAddedEvent: (listId: string, listName: string, itemId: string, itemName: string, date: Date) => void;
  markPurchaseCompleted: (listId: string, listName: string, itemId: string, itemName: string, date: Date) => void;
  createReminder: (listId: string, itemName: string, intervalWeeks: number, originalDate?: Date, supermarket?: { id: string; name: string; chain?: string; }) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;
  checkAndProcessReminders: () => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

interface CalendarProviderProps {
  children: ReactNode;
}

export const CalendarProvider: React.FC<CalendarProviderProps> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const { addItemToCurrentList } = useShoppingList();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar eventos y recordatorios de Firestore
  useEffect(() => {
    if (!currentUser || !userProfile) {
      setEvents([]);
      setReminders([]);
      return;
    }

    console.log('📅 Setting up calendar and reminders listener...');
    
    let unsubscribeEvents: (() => void) | null = null;
    let unsubscribeReminders: (() => void) | null = null;

    const setupListeners = async () => {
      try {
        // Listener para eventos de calendario
        const eventsQuery = query(
          collection(db, 'calendarEvents'),
          where('createdBy', '==', userProfile.email)
        );

        unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
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
          console.log(`📅 Loaded ${eventsList.length} calendar events`);
          setEvents(eventsList);
        });

        // Listener para recordatorios
        const remindersQuery = query(
          collection(db, 'reminders'),
          where('createdBy', '==', userProfile.email),
          where('isActive', '==', true)
        );

        unsubscribeReminders = onSnapshot(remindersQuery, (snapshot) => {
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
          console.log(`⏰ Loaded ${remindersList.length} active reminders`);
          setReminders(remindersList);
        });

      } catch (error) {
        console.error('❌ Error setting up calendar listeners:', error);
      }
    };

    setupListeners();

    return () => {
      if (unsubscribeEvents) unsubscribeEvents();
      if (unsubscribeReminders) unsubscribeReminders();
    };
  }, [currentUser, userProfile]);

  // Añadir evento cuando se añade un producto a una lista
  const addProductAddedEvent = async (listId: string, listName: string, itemId: string, itemName: string, date: Date) => {
    if (!userProfile) return;

    try {
      const eventData = {
        title: `➕ ${itemName} afegit a ${listName}`,
        date: date.toISOString().split('T')[0],
        type: 'product_added' as const,
        listId,
        listName,
        itemId,
        itemName,
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
        createdBy: userProfile.email,
        createdAt: Timestamp.now()
      };

      const eventId = `${listId}-${itemId}-added-${Date.now()}`;
      await setDoc(doc(db, 'calendarEvents', eventId), eventData);
      
      console.log('📅 Product added event created');
    } catch (error) {
      console.error('❌ Error creating product added event:', error);
    }
  };

  // Marcar compra completada
  const markPurchaseCompleted = async (listId: string, listName: string, itemId: string, itemName: string, date: Date) => {
    if (!userProfile) return;

    try {
      const eventData = {
        title: `✅ ${itemName} comprat de ${listName}`,
        date: date.toISOString().split('T')[0],
        type: 'purchase_completed' as const,
        listId,
        listName,
        itemId,
        itemName,
        backgroundColor: '#e8f5e8',
        borderColor: '#4caf50',
        createdBy: userProfile.email,
        createdAt: Timestamp.now()
      };

      const eventId = `${listId}-${itemId}-purchased-${Date.now()}`;
      await setDoc(doc(db, 'calendarEvents', eventId), eventData);
      
      console.log('📅 Purchase completed event created');
    } catch (error) {
      console.error('❌ Error creating purchase completed event:', error);
    }
  };

  // Crear recordatorio
  const createReminder = async (listId: string, itemName: string, intervalWeeks: number, originalDate: Date = new Date(), supermarket?: { id: string; name: string; chain?: string; }) => {
    if (!userProfile) return;

    try {
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

      const reminderId = `${listId}-${itemName.replace(/\s+/g, '-')}-${Date.now()}`;
      await setDoc(doc(db, 'reminders', reminderId), reminderData);

      // Crear evento de recordatorio en el calendario
      const eventData = {
        title: `🔔 Recordatori: comprar ${itemName}`,
        date: reminderDate.toISOString().split('T')[0],
        type: 'reminder' as const,
        listId,
        listName: '', // Se actualizará cuando se procese
        itemName,
        backgroundColor: '#fff3e0',
        borderColor: '#ff9800',
        createdBy: userProfile.email,
        createdAt: Timestamp.now()
      };

      const eventId = `reminder-${reminderId}`;
      await setDoc(doc(db, 'calendarEvents', eventId), eventData);
      
      console.log(`⏰ Reminder created for ${intervalWeeks} weeks from now`);
    } catch (error) {
      console.error('❌ Error creating reminder:', error);
    }
  };

  // Eliminar recordatorio
  const deleteReminder = async (reminderId: string) => {
    try {
      await deleteDoc(doc(db, 'reminders', reminderId));
      await deleteDoc(doc(db, 'calendarEvents', `reminder-${reminderId}`));
      console.log('🗑️ Reminder deleted');
    } catch (error) {
      console.error('❌ Error deleting reminder:', error);
    }
  };

  // Verificar y procesar recordatorios que deben ejecutarse
  const checkAndProcessReminders = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const reminder of reminders) {
      const reminderDate = new Date(reminder.reminderDate);
      reminderDate.setHours(0, 0, 0, 0);

      if (reminderDate <= today && reminder.isActive) {
        try {
          // Añadir el producto a la lista correspondiente
          addItemToCurrentList({
            task: reminder.itemName,
            done: false,
            supermarket: reminder.supermarket
          });

          // Desactivar el recordatorio
          await updateDoc(doc(db, 'reminders', reminder.id), {
            isActive: false
          });

          console.log(`✅ Reminder processed: ${reminder.itemName} added to list`);
        } catch (error) {
          console.error('❌ Error processing reminder:', error);
        }
      }
    }
  };

  const contextValue: CalendarContextType = {
    events,
    reminders,
    isLoading,
    addProductAddedEvent,
    markPurchaseCompleted,
    createReminder,
    deleteReminder,
    checkAndProcessReminders
  };

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}; 