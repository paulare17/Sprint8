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
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import NoListSelected from '../components/NoListSelected';

function Pendents() {
  const { currentUser, userProfile } = useAuth();
  const { 
    currentList, 
    userLists, 
    switchToList, 
    joinList, 
    leaveList,
    deleteList,
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

  const handleDeleteList = async () => {
    if (!currentList || !userProfile) return;

    if (!confirm(`Estàs segur que vols eliminar la llista "${currentList.name}"?\n\nAixò eliminarà tots els productes i no es podrà desfer.`)) {
      return;
    }

    try {
      await deleteList(currentList.id);
      alert('Llista eliminada correctament');
    } catch (error) {
      console.error('Error eliminant llista:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error eliminant la llista';
      alert(`Error eliminant la llista: ${errorMessage}`);
    }
  };

  const handleLeaveList = async () => {
    if (!currentList || !userProfile) return;

    if (!confirm(`Estàs segur que vols sortir de la llista "${currentList.name}"?`)) {
      return;
    }

    try {
      await leaveList(currentList.id);
      alert('Has sortit de la llista correctament');
    } catch (error) {
      console.error('Error sortint de la llista:', error);
      alert('Error sortint de la llista');
    }
  };

  // Si no està autenticat, usar el component unificat
  if (!currentUser) {
    return (
      <NoListSelected
        pageTitle="Llista de Pendents"
        pageIcon="📝"
        description="Inicia sessió per gestionar les teves llistes de compra i marcar productes com a comprats."
        showCreateJoinButtons={false}
      />
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

  // Si no té cap llista activa, usar el component unificat
  if (!currentList) {
    return (
      <NoListSelected
        pageTitle="Llista de Pendents"
        pageIcon="📝"
        description="Selecciona una llista per començar a afegir productes i marcar-los com a comprats quan vagis de compres."
      />
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
          <button 
            className={`btn-danger ${currentList.createdBy === userProfile?.email ? 'delete-list-btn' : 'leave-list-btn'}`}
            onClick={currentList.createdBy === userProfile?.email ? handleDeleteList : handleLeaveList}
            title={currentList.createdBy === userProfile?.email ? 'Eliminar llista (només el creador)' : 'Sortir de la llista'}
          >
            <DeleteForeverIcon />
            {currentList.createdBy === userProfile?.email ? 'Esborrar Llista' : 'Sortir de la Llista'}
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