import { useState } from "react";
import Container from "../components/todolist/Container";
import { useShoppingList } from "../contexts/ShoppingListContext";
import { useAuth } from "../hooks/useAuth";
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
    switchToList, 
    leaveList,
    deleteList
  } = useShoppingList();
  const { createReminder } = useCalendar();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    itemName: '',
    intervalWeeks: 2
  });
  const [selectedReminderSupermarket, setSelectedReminderSupermarket] = useState<Supermarket | null>(null);

  const handleCreateList = () => {
    setShowCreateForm(false);
    // La llista ja s'ha seleccionat automàticament al crear-la
  };

  const handleCreateReminder = async () => {
    if (!reminderForm.itemName || !currentList) {
      return;
    }

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

  };

  const handleDeleteList = async () => {
    if (!currentList || !userProfile) return;

    if (!confirm(`Estàs segur que vols eliminar la llista "${currentList.name}"?\n\nAixò eliminarà tots els productes i no es podrà desfer.`)) {
      return;
    }

    await deleteList(currentList.id);
  };

  const handleLeaveList = async () => {
    if (!currentList || !userProfile) return;

    if (!confirm(`Estàs segur que vols sortir de la llista "${currentList.name}"?`)) {
      return;
    }

    await leaveList(currentList.id);
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