import React, { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useCalendar } from '../contexts/CalendarContext';
import { useShoppingList } from '../contexts/ShoppingListContext';

import type { EventInput } from '@fullcalendar/core';

import './CalendarPage.css';
import NoListSelected from '../components/NoListSelected';

const CalendarPage: React.FC = () => {
  const { events, reminders, createReminder, deleteReminder } = useCalendar();
  const { currentList } = useShoppingList();
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    listId: '',
    itemName: '',
    intervalWeeks: 2
  });



  // Filtrar esdeveniments per llista actual
  const filteredEvents = useMemo(() => {
    if (!currentList) return [];
    return events.filter(event => event.listId === currentList.id);
  }, [events, currentList]);

  // Filtrar recordatoris per llista actual
  const filteredReminders = useMemo(() => {
    if (!currentList) return [];
    return reminders.filter(reminder => reminder.listId === currentList.id);
  }, [reminders, currentList]);

  // Convertir eventos filtrados para FullCalendar
  const calendarEvents: EventInput[] = filteredEvents.map(event => ({
    id: event.id,
    title: event.title,
    date: event.date,
    backgroundColor: event.backgroundColor,
    borderColor: event.borderColor,
    extendedProps: {
      type: event.type,
      listId: event.listId,
      listName: event.listName,
      itemId: event.itemId,
      itemName: event.itemName
    }
  }));



  const openReminderModal = () => {
    setReminderForm({
      listId: currentList?.id || '',
      itemName: '',
      intervalWeeks: 2
    });
    setShowReminderModal(true);
  };

  const closeReminderModal = () => {
    setShowReminderModal(false);
  };

  const handleCreateReminder = async () => {
    if (!reminderForm.itemName.trim()) {
      return;
    }

    await createReminder(
      reminderForm.listId,
      reminderForm.itemName,
      reminderForm.intervalWeeks
    );
    closeReminderModal();
  };

  // AHORA SÍ, DESPUÉS DE TODOS LOS HOOKS, VERIFICAMOS SI HAY LISTA
  if (!currentList) {
    return (
      <NoListSelected
        pageTitle="Calendari"
        pageIcon="📅"
        description="Selecciona una llista per veure els esdeveniments i recordatoris"
      />
    );
  }

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <h1>📅 Calendari - {currentList.name}</h1>
        <p>Esdeveniments i recordatoris de la llista seleccionada</p>
        <div className="calendar-actions">
          <button 
            onClick={openReminderModal}
            className="create-reminder-btn"
          >
            ➕ Crear Recordatori
          </button>
        </div>
      </div>

      <div className="calendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next',
            center: 'title',
            right: ''
          }}
          events={calendarEvents}
          height="auto"
          locale="ca"
          firstDay={1}
          eventDisplay="block"
          dayMaxEvents={3}
          moreLinkClick="popover"
        />
      </div>

      {/* Sección de recordatorios activos filtrados por lista */}
      <div className="reminders-section">
        <h3>Recordatoris Actius</h3>
        <div className="reminders-list">
          {filteredReminders.map(reminder => (
            <div key={reminder.id} className="reminder-item">
              <div className="reminder-info">
                <h4>{reminder.itemName}</h4>
                <p>Cada {reminder.intervalWeeks} setmanes</p>
                <p>Proper recordatori: {new Date(reminder.reminderDate).toLocaleDateString('ca-ES')}</p>
                {reminder.supermarket && (
                  <p>Supermercat: {reminder.supermarket.name}</p>
                )}
              </div>
              <button 
                onClick={() => deleteReminder(reminder.id)}
                className="delete-reminder-btn"
              >
                🗑️
              </button>
            </div>
          ))}
          {filteredReminders.length === 0 && (
            <p className="no-reminders">No tens recordatoris actius per aquesta llista</p>
          )}
        </div>
      </div>

      {/* Modal para crear recordatorios */}
      {showReminderModal && (
        <div className="modal-overlay" onClick={closeReminderModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Crear Recordatori</h3>
            <div className="form-group">
              <label>Nom del producte:</label>
              <input
                type="text"
                value={reminderForm.itemName}
                onChange={(e) => setReminderForm(prev => ({
                  ...prev,
                  itemName: e.target.value
                }))}
                placeholder="Ex: Llet, Pa, etc."
              />
            </div>
            <div className="form-group">
              <label>Recordar cada (setmanes):</label>
              <select
                value={reminderForm.intervalWeeks}
                onChange={(e) => setReminderForm(prev => ({
                  ...prev,
                  intervalWeeks: parseInt(e.target.value)
                }))}
              >
                <option value={1}>1 setmana</option>
                <option value={2}>2 setmanes</option>
                <option value={3}>3 setmanes</option>
                <option value={4}>1 mes</option>
                <option value={8}>2 mesos</option>
              </select>
            </div>

            <div className="modal-actions">
              <button onClick={closeReminderModal} className="cancel-btn">
                Cancel·lar
              </button>
              <button onClick={handleCreateReminder} className="confirm-btn">
                Crear Recordatori
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default CalendarPage; 