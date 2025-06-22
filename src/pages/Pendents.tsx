import React, { useState } from "react";
// import FormTask from "../components/todolist/FormTask";
import Container from "../components/todolist/Container";
// import Check from "../components/todolist/Check";
// import TaskList from "../components/todolist/TaskList";
import { useShoppingList } from "../contexts/ShoppingListContext";
import { useAuth } from "../contexts/AuthContext";
import { useCalendar } from "../contexts/CalendarContext";
import SupermarketSelector from "../components/SupermarketSelector";
import CreateListForm from "../components/CreateListForm";
import type { Supermarket } from "../services/supermarketService";

function Pendents() {
  const { currentUser } = useAuth();
  const { 
    currentList, 
    userLists, 
    switchToList, 
    joinList, 
    isLoading 
  } = useShoppingList();
  const { createReminder } = useCalendar();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinListId, setJoinListId] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    itemName: '',
    intervalWeeks: 2
  });
  const [selectedReminderSupermarket, setSelectedReminderSupermarket] = useState<Supermarket | null>(null);

  const handleCreateList = (listId: string) => {
    setShowCreateForm(false);
    // La llista ja s'ha seleccionat automàticament al crear-la
  };

  const handleJoinList = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!joinListId.trim()) {
      setJoinError('Introdueix un ID de llista vàlid');
      return;
    }

    try {
      setJoinError('');
      const success = await joinList(joinListId.trim().toUpperCase());
      
      if (success) {
        setShowJoinForm(false);
        setJoinListId('');
      } else {
        setJoinError('Llista no trobada. Verifica l\'ID de la llista.');
      }
    } catch (error) {
      setJoinError('Error al unir-se a la llista. Torna-ho a intentar.');
    }
  };

  const handleSwitchToList = (listId: string) => {
    switchToList(listId);
  };

  const handleCreateReminder = async () => {
    if (!reminderForm.itemName || !currentList) {
      alert('Sisplau, emplena tots els camps');
      return;
    }

    try {
      await createReminder(
        currentList.id,
        reminderForm.itemName,
        reminderForm.intervalWeeks,
        new Date(),
        selectedReminderSupermarket ? {
          id: selectedReminderSupermarket.id,
          name: selectedReminderSupermarket.name,
          chain: selectedReminderSupermarket.chain
        } : undefined
      );
      setShowReminderModal(false);
      setReminderForm({ itemName: '', intervalWeeks: 2 });
      setSelectedReminderSupermarket(null);
      alert('Recordatori creat correctament!');
    } catch (error) {
      console.error('Error creant recordatori:', error);
      alert('Error creant el recordatori');
    }
  };

  // Si no està autenticat, no mostrar res
  if (!currentUser) {
    return (
      <div className="pendents-page">
        <div className="auth-required">
          <h3>Inicia sessió per veure les teves llistes</h3>
          <p>Necessites estar autenticat per gestionar les teves llistes de compra.</p>
        </div>
      </div>
    );
  }

  // Si està mostrant el formulari de crear llista
  if (showCreateForm) {
    return (
      <div className="pendents-page">
        <CreateListForm 
          onListCreated={handleCreateList}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  // Si no té cap llista activa, mostrar opcions per crear o unir-se
  if (!currentList) {
    return (
      <div className="pendents-page">
        <div className="list-selection">
          <div className="selection-header">
            <h2>Selecciona una Llista</h2>
            <p>Per començar a afegir productes, primer has de crear una llista o unir-te a una existent.</p>
          </div>

          <div className="selection-actions">
            <button 
              className="btn-primary create-list-btn"
              onClick={() => setShowCreateForm(true)}
            >
              ➕ Crear Nova Llista
            </button>
            
            <button 
              className="btn-secondary join-list-btn"
              onClick={() => setShowJoinForm(!showJoinForm)}
            >
              🔗 Unir-se a una Llista
            </button>
          </div>

          {showJoinForm && (
            <div className="join-list-form">
              <h4>Unir-se a una Llista Existent</h4>
              <form onSubmit={handleJoinList}>
                <div className="form-group">
                  <label htmlFor="joinListId">ID de la llista</label>
                  <input
                    type="text"
                    id="joinListId"
                    value={joinListId}
                    onChange={(e) => setJoinListId(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC123XYZ"
                    maxLength={9}
                    style={{ textTransform: 'uppercase' }}
                  />
                  <small className="form-help">
                    Demana l'ID de la llista a la persona que la va crear
                  </small>
                </div>
                
                {joinError && (
                  <div className="error-message">{joinError}</div>
                )}
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowJoinForm(false);
                      setJoinListId('');
                      setJoinError('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel·lar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Unint-se...' : 'Unir-se'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {userLists.length > 0 && (
            <div className="existing-lists">
              <h4>O selecciona una de les teves llistes existents:</h4>
              <div className="lists-grid">
                {userLists.map((list) => (
                  <div 
                    key={list.id} 
                    className="list-card"
                    onClick={() => handleSwitchToList(list.id)}
                  >
                    <div className="list-header">
                      <h5>{list.name}</h5>
                      <span className="list-id">ID: {list.id}</span>
                    </div>
                    
                    <div className="list-info">
                      <p className="list-location">📍 {list.postalCode}</p>
                      <p className="list-items">
                        {list.items.length} productes • {list.items.filter(item => item.done).length} comprats
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Si té una llista activa, mostrar el Container normal
  return (
    <div className="pendents-page">
      <div className="active-list-header">
        <div className="list-info">
          <h3>📝 {currentList.name}</h3>
          <p>📍 {currentList.postalCode} • ID: {currentList.id}</p>
        </div>
        <div className="list-actions">
                      <button 
             className="btn-reminder"
             onClick={() => {
               setReminderForm({ itemName: '', intervalWeeks: 2 });
               setSelectedReminderSupermarket(null);
               setShowReminderModal(true);
             }}
           >
             ⏰ Crear Recordatori
           </button>
          <button 
            className="btn-secondary change-list-btn"
            onClick={() => switchToList('')} // Deseleccionar llista actual
          >
            Canviar Llista
          </button>
        </div>
      </div>
      <Container />

      {/* Modal per crear recordatoris */}
      {showReminderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>⏰ Crear Recordatori</h3>
            
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
                postalCode={currentList?.postalCode}
                selectedSupermarket={selectedReminderSupermarket}
                onSupermarketSelect={setSelectedReminderSupermarket}
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
    </div>
  );
}

export default Pendents;