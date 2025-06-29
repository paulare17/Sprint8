import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShoppingList } from '../contexts/ShoppingListContext';
import { useAuth } from '../hooks/useAuth';
import CreateListForm from '../components/CreateListForm';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

const ListsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { 
    userLists, 
    currentList, 
    switchToList, 
    joinList, 
    leaveList, 
    deleteList,
    isLoading 
  } = useShoppingList();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinListId, setJoinListId] = useState('');


  const handleCreateList = () => {
    setShowCreateForm(false);
    navigate('/pendents'); // Redirigir a la pàgina de pendents
  };

  const handleJoinList = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!joinListId.trim()) {
      return;
    }

    await joinList(joinListId.trim().toUpperCase());
    setShowJoinForm(false);
    setJoinListId('');
  };

  const handleSwitchToList = (listId: string) => {
    switchToList(listId);
    navigate('/pendents');
  };

  const handleLeaveList = (listId: string, listName: string) => {
    if (window.confirm(`Estàs segur que vols sortir de la llista "${listName}"?`)) {
      leaveList(listId);
    }
  };

  const handleDeleteList = async (listId: string, listName: string) => {
    if (!userProfile) return;

    if (!confirm(`Estàs segur que vols eliminar la llista "${listName}"?\n\nAixò eliminarà tots els productes i no es podrà desfer.`)) {
      return;
    }

    await deleteList(listId);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ca-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (showCreateForm) {
    return (
      <div className="lists-page">
        <CreateListForm 
          onListCreated={handleCreateList}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="lists-page">
      <div className="page-header">
        <h2>Les Meves Llistes</h2>
        <p>Gestiona les teves llistes de compra compartides</p>
      </div>

      <div className="lists-actions">
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
            
            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => {
                  setShowJoinForm(false);
                  setJoinListId('');
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

      <div className="lists-container">
        {userLists.length === 0 ? (
          <div className="empty-lists">
            <div className="empty-icon">📝</div>
            <h3>No tens cap llista encara</h3>
            <p>Crea la teva primera llista o uneix-te a una existent</p>
          </div>
        ) : (
          <div className="lists-grid">
            {userLists.map((list) => (
              <div 
                key={list.id} 
                className={`list-card ${currentList?.id === list.id ? 'active' : ''}`}
              >
                <div className="list-header">
                  <h4>{list.name}</h4>
                  <span className="list-id">ID: {list.id}</span>
                </div>
                
                <div className="list-info">
                  <p className="list-location">📍 {list.postalCode}</p>
                  <p className="list-items">
                    {list.items.length} productes • {list.items.filter(item => item.done).length} comprats
                  </p>
                  <p className="list-members">
                    👥 {list.members.length} membre{list.members.length !== 1 ? 's' : ''}
                  </p>
                  <p className="list-date">
                    Creada: {formatDate(list.createdAt)}
                  </p>
                </div>

                <div className="list-actions">
                  <button 
                    className="btn-primary"
                    onClick={() => handleSwitchToList(list.id)}
                  >
                    {currentList?.id === list.id ? 'Llista Activa' : 'Seleccionar'}
                  </button>
                  
                  {list.createdBy === userProfile?.email ? (
                    <button 
                      className="btn-danger"
                      onClick={() => handleDeleteList(list.id, list.name)}
                      title="Eliminar llista (només el creador)"
                    >
                      <DeleteForeverIcon />
                      Eliminar
                    </button>
                  ) : (
                    <button 
                      className="btn-danger"
                      onClick={() => handleLeaveList(list.id, list.name)}
                    >
                      Sortir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListsPage; 