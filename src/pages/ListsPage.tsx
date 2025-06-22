import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShoppingList } from '../contexts/ShoppingListContext';
import { useAuth } from '../contexts/AuthContext';
import CreateListForm from '../components/CreateListForm';

const ListsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { 
    userLists, 
    currentList, 
    switchToList, 
    joinList, 
    leaveList, 
    isLoading 
  } = useShoppingList();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinListId, setJoinListId] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleCreateList = (listId: string) => {
    setShowCreateForm(false);
    navigate('/pendents'); // Redirigir a la pàgina de pendents
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
        // Redirigir a la llista o mostrar missatge d'èxit
      } else {
        setJoinError('Llista no trobada. Verifica l\'ID de la llista.');
      }
    } catch (error) {
      setJoinError('Error al unir-se a la llista. Torna-ho a intentar.');
    }
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
                  
                  {list.createdBy !== userProfile?.email && (
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