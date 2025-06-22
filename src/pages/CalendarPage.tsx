import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useCalendar } from '../contexts/CalendarContext';
import { useShoppingList } from '../contexts/ShoppingListContext';
import SupermarketSelector from '../components/SupermarketSelector';
import type { EventInput } from '@fullcalendar/core';
import type { Supermarket } from '../services/supermarketService';
import './CalendarPage.css';

const CalendarPage: React.FC = () => {
  const { events, reminders, createReminder, deleteReminder, checkAndProcessReminders } = useCalendar();
  const { userLists, currentList } = useShoppingList();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    listId: '',
    itemName: '',
    intervalWeeks: 2
  });
  const [selectedSupermarket, setSelectedSupermarket] = useState<Supermarket | null>(null);

  // Procesar recordatorios al cargar la página
  useEffect(() => {
    checkAndProcessReminders();
  }, []);

  // Convertir eventos para FullCalendar
  const calendarEvents: EventInput[] = events.map(event => ({
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

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event);
  };

  const handleDateClick = (info: any) => {
    console.log('Data seleccionada:', info.dateStr);
  };

  const openReminderModal = () => {
    setReminderForm({
      listId: currentList?.id || '',
      itemName: '',
      intervalWeeks: 2
    });
    setSelectedSupermarket(null);
    setShowReminderModal(true);
  };

  const handleCreateReminder = async () => {
    if (!reminderForm.itemName || !reminderForm.listId) {
      alert('Sisplau, emplena tots els camps');
      return;
    }

    try {
      await createReminder(
        reminderForm.listId,
        reminderForm.itemName,
        reminderForm.intervalWeeks,
        new Date(),
        selectedSupermarket ? {
          id: selectedSupermarket.id,
          name: selectedSupermarket.name,
          chain: selectedSupermarket.chain
        } : undefined
      );
      setShowReminderModal(false);
      setReminderForm({ listId: '', itemName: '', intervalWeeks: 2 });
      setSelectedSupermarket(null);
    } catch (error) {
      console.error('Error creant recordatori:', error);
      alert('Error creant el recordatori');
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'product_added': return 'Producte afegit';
      case 'purchase_completed': return 'Compra realitzada';
      case 'reminder': return 'Recordatori';
      default: return type;
    }
  };

  const getIntervalLabel = (weeks: number) => {
    if (weeks === 1) return '1 setmana';
    if (weeks === 2) return '2 setmanes';
    if (weeks === 4) return '1 mes';
    if (weeks === 8) return '2 mesos';
    return `${weeks} setmanes`;
  };

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <h1>📅 Calendari de Compres</h1>
        <div className="calendar-actions">
          <button 
            className="btn-primary"
            onClick={openReminderModal}
          >
            ⏰ Crear Recordatori
          </button>
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#e3f2fd', borderColor: '#2196f3' }}></span>
          <span>Producte afegit</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#e8f5e8', borderColor: '#4caf50' }}></span>
          <span>Compra realitzada</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#fff3e0', borderColor: '#ff9800' }}></span>
          <span>Recordatori</span>
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
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          locale="ca"
          firstDay={1}
          eventDisplay="block"
          dayMaxEvents={3}
          moreLinkClick="popover"
        />
      </div>

      {/* Sidebar amb informació d'esdeveniments */}
      <div className="calendar-sidebar">
        <h3>Recordatoris Actius</h3>
        <div className="reminders-list">
          {reminders.map(reminder => (
            <div key={reminder.id} className="reminder-item">
              <div className="reminder-info">
                <strong>{reminder.itemName}</strong>
                <p>Cada {getIntervalLabel(reminder.intervalWeeks)}</p>
                <p>Proper: {reminder.reminderDate.toLocaleDateString('ca-ES')}</p>
                {reminder.supermarket && (
                  <p>🏪 {reminder.supermarket.name}</p>
                )}
              </div>
              <button 
                className="btn-danger-small"
                onClick={() => deleteReminder(reminder.id)}
              >
                🗑️
              </button>
            </div>
          ))}
          {reminders.length === 0 && (
            <p className="no-reminders">No tens recordatoris actius</p>
          )}
        </div>
      </div>

      {/* Modal per crear recordatoris */}
      {showReminderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>⏰ Crear Recordatori</h3>
            
            <div className="form-group">
              <label>Llista:</label>
              <select 
                value={reminderForm.listId}
                onChange={(e) => setReminderForm(prev => ({ ...prev, listId: e.target.value }))}
              >
                <option value="">Selecciona una llista</option>
                {userLists.map(list => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Nom del producte:</label>
              <input 
                type="text"
                value={reminderForm.itemName}
                onChange={(e) => setReminderForm(prev => ({ ...prev, itemName: e.target.value }))}
                placeholder="Ex: Llet, Pà, Fruita..."
              />
            </div>

            <div className="form-group">
              <label>Recordar cada:</label>
              <select 
                value={reminderForm.intervalWeeks}
                onChange={(e) => setReminderForm(prev => ({ ...prev, intervalWeeks: parseInt(e.target.value) }))}
              >
                <option value={1}>1 setmana</option>
                <option value={2}>2 setmanes</option>
                <option value={4}>1 mes</option>
                <option value={8}>2 mesos</option>
              </select>
            </div>

            <div className="form-group">
              <label>Supermercat (opcional):</label>
              <SupermarketSelector
                postalCode={userLists.find(list => list.id === reminderForm.listId)?.postalCode}
                selectedSupermarket={selectedSupermarket}
                onSupermarketSelect={setSelectedSupermarket}
                placeholder="🏪 Seleccionar supermercat per al recordatori"
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowReminderModal(false)}
              >
                Cancel·lar
              </button>
              <button 
                className="btn-primary"
                onClick={handleCreateReminder}
              >
                Crear Recordatori
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'informació d'esdeveniment */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>📋 Detalls de l'Esdeveniment</h3>
            
            <div className="event-details">
              <p><strong>Títol:</strong> {selectedEvent.title}</p>
              <p><strong>Data:</strong> {selectedEvent.startStr}</p>
              <p><strong>Tipus:</strong> {getEventTypeLabel(selectedEvent.extendedProps.type)}</p>
              {selectedEvent.extendedProps.listName && (
                <p><strong>Llista:</strong> {selectedEvent.extendedProps.listName}</p>
              )}
              {selectedEvent.extendedProps.itemName && (
                <p><strong>Producte:</strong> {selectedEvent.extendedProps.itemName}</p>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setSelectedEvent(null)}
              >
                Tancar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage; 