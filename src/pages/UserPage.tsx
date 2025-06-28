import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useShoppingList } from '../contexts/ShoppingListContext';
import { useNavigate } from 'react-router-dom';

const UserPage: React.FC = () => {
  const { currentUser, userProfile, logout, updateProfile } = useAuth();
  const { userLists, currentList, switchToList, deleteList } = useShoppingList();
  const navigate = useNavigate();
  
  // États per editar perfil
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    postalCode: '',
    listOption: 'new-list' as 'new-list' | 'add-to-list'
  });
  const [updateError, setUpdateError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Estats per eliminar llistes
  const [deletingListId, setDeletingListId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // Inicialitzar formulari amb dades actuals
  useEffect(() => {
    if (userProfile) {
      setEditForm({
        displayName: userProfile.displayName,
        postalCode: userProfile.postalCode,
        listOption: userProfile.listOption
      });
    }
  }, [userProfile]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setUpdateError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setUpdateError('');
    // Restaurar valors originals
    if (userProfile) {
      setEditForm({
        displayName: userProfile.displayName,
        postalCode: userProfile.postalCode,
        listOption: userProfile.listOption
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!editForm.displayName.trim()) {
      setUpdateError('El nom és obligatori');
      return;
    }

    if (!editForm.postalCode.trim()) {
      setUpdateError('El codi postal és obligatori');
      return;
    }

    // Validar format del codi postal
    const postalCodeRegex = /^[0-5][0-9]{4}$/;
    if (!postalCodeRegex.test(editForm.postalCode.trim())) {
      setUpdateError('El codi postal ha de tenir 5 dígits (ex: 08001)');
      return;
    }

    setIsUpdating(true);
    setUpdateError('');

    try {
      await updateProfile({
        displayName: editForm.displayName.trim(),
        postalCode: editForm.postalCode.trim(),
        listOption: editForm.listOption
      });
      
      setIsEditing(false);
      console.log('✅ Perfil actualitzat correctament');
    } catch (error) {
      console.error('❌ Error actualitzant perfil:', error);
      setUpdateError(error instanceof Error ? error.message : 'Error actualitzant el perfil');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteList = async (listId: string, listName: string) => {
    if (!confirm(`Estàs segur que vols eliminar la llista "${listName}"?\n\nAixò eliminarà tots els productes i no es podrà desfer.`)) {
      return;
    }

    setDeletingListId(listId);
    setDeleteError('');

    try {
      await deleteList(listId);
      console.log(`✅ Llista "${listName}" eliminada correctament`);
    } catch (error) {
      console.error('❌ Error eliminant llista:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error eliminant la llista';
      setDeleteError(`Error eliminant "${listName}": ${errorMessage}`);
    } finally {
      setDeletingListId(null);
    }
  };

  // Calcular estadístiques de les llistes
  const allItems = userLists.flatMap(list => list.items);
  const pendingItems = allItems.filter(item => !item.done);
  const completedItems = allItems.filter(item => item.done);

  const handleGoToList = (listId: string) => {
    const listName = userLists.find(list => list.id === listId)?.name;
    switchToList(listId);
    
    // Petita notificació visual opcional 
    if (listName) {
      console.log(`✅ Llista "${listName}" seleccionada`);
    }
    
    navigate('/pendents');
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ca-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!currentUser || !userProfile) {
    return (
      <div className="user-page-loading">
        <h2>Carregant dades de l'usuari...</h2>
      </div>
    );
  }

  return (
    <div className="user-page">
      <div className="user-page-header">
        <h1>Perfil de l'usuari</h1>
        <button className="logout-button" onClick={handleLogout}>
          Tancar sessió
        </button>
      </div>

      {/* Informació personal */}
      <section className="user-info-section">
        <div className="section-header">
          <h2>📋 Informació Personal</h2>
          {!isEditing && (
            <button className="edit-button" onClick={handleEditProfile}>
              ✏️ Editar Perfil
            </button>
          )}
        </div>
        
        {!isEditing ? (
          <div className="user-details">
            <div className="user-detail">
              <strong>Nom:</strong> {userProfile.displayName}
            </div>
            <div className="user-detail">
              <strong>Email:</strong> {userProfile.email}
            </div>
            <div className="user-detail">
              <strong>Codi Postal:</strong> 📍 {userProfile.postalCode}
            </div>
            <div className="user-detail">
              <strong>Opció de llista:</strong> {userProfile.listOption === 'new-list' ? 'Nova llista' : 'Afegir a llista existent'}
            </div>
            <div className="user-detail">
              <strong>Registrat el:</strong> {formatDate(userProfile.createdAt)}
            </div>
          </div>
        ) : (
          <div className="edit-profile-form">
            {updateError && (
              <div className="error-message">
                ❌ {updateError}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="displayName">
                <strong>Nom:</strong>
              </label>
              <input
                type="text"
                id="displayName"
                value={editForm.displayName}
                onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                placeholder="El teu nom"
                disabled={isUpdating}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <strong>Email:</strong>
              </label>
              <input
                type="email"
                id="email"
                value={userProfile.email}
                disabled
                title="L'email no es pot modificar"
              />
            </div>

            <div className="form-group">
              <label htmlFor="postalCode">
                <strong>Codi Postal:</strong>
              </label>
              <input
                type="text"
                id="postalCode"
                value={editForm.postalCode}
                onChange={(e) => setEditForm({...editForm, postalCode: e.target.value})}
                placeholder="08001"
                disabled={isUpdating}
                maxLength={5}
              />
            </div>

            <div className="form-group">
              <label htmlFor="listOption">
                <strong>Opció de llista per defecte:</strong>
              </label>
              <select
                id="listOption"
                value={editForm.listOption}
                onChange={(e) => setEditForm({...editForm, listOption: e.target.value as 'new-list' | 'add-to-list'})}
                disabled={isUpdating}
              >
                <option value="new-list">Nova llista</option>
                <option value="add-to-list">Afegir a llista existent</option>
              </select>
            </div>

            <div className="form-actions">
              <button 
                className="save-button" 
                onClick={handleUpdateProfile}
                disabled={isUpdating}
              >
                {isUpdating ? '⏳ Guardant...' : '💾 Guardar Canvis'}
              </button>
              <button 
                className="cancel-button" 
                onClick={handleCancelEdit}
                disabled={isUpdating}
              >
                ❌ Cancel·lar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Estadístiques de compra */}
      <section className="shopping-stats">
        <h2>📊 Estadístiques de Compra</h2>
        <div className="stats-grid">
          <div className="stat-card pending">
            <h3>Productes Pendents</h3>
            <span className="stat-number">{pendingItems.length}</span>
          </div>
          <div className="stat-card completed">
            <h3>Productes Comprats</h3>
            <span className="stat-number">{completedItems.length}</span>
          </div>
          <div className="stat-card total">
            <h3>Total Llistes</h3>
            <span className="stat-number">{userLists.length}</span>
          </div>
        </div>
      </section>

      {/* Llistes de compra */}
      <section className="pending-products">
        <div className="section-header">
          <h2>🛒 Les Meves Llistes de Compra</h2>
        </div>
        
        {deleteError && (
          <div className="error-message">
            ❌ {deleteError}
          </div>
        )}
        
        {userLists.length === 0 ? (
          <div className="empty-state">
            <p>No tens cap llista de compra creada</p>
            <button onClick={() => navigate('/lists')} className="go-shopping-button">
              Crear o unir-se a una llista
            </button>
          </div>
        ) : (
          <div className="lists-overview">
            {userLists.map((list) => {
              const pendingItemsInList = list.items.filter(item => !item.done);
              const completedItemsInList = list.items.filter(item => item.done);
              const previewItems = pendingItemsInList.slice(0, 2);
              
              return (
                <div 
                  key={list.id} 
                  className={`list-overview-card ${currentList?.id === list.id ? 'active-list' : ''} ${deletingListId === list.id ? 'deleting' : ''}`}
                >
                  <div className="list-overview-header">
                    <h4>📋 {list.name}</h4>
                    <div className="list-header-actions">
                      <div className="list-overview-stats">
                        <span className="pending-count">{pendingItemsInList.length} pendents</span>
                        <span className="completed-count">{completedItemsInList.length} comprats</span>
                      </div>
                      {list.createdBy === userProfile.email && (
                        <button
                          className="delete-list-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteList(list.id, list.name);
                          }}
                          disabled={deletingListId === list.id}
                          title="Eliminar llista (només el creador)"
                        >
                          {deletingListId === list.id ? '⏳' : '🗑️'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div 
                    className="list-content"
                    onClick={() => handleGoToList(list.id)}
                  >
                    <div className="list-overview-info">
                      <p className="list-location">📍 {list.postalCode}</p>
                      <p className="list-members">👥 {list.members.length} membres</p>
                    </div>
                    
                    {previewItems.length > 0 && (
                      <div className="list-preview-items">
                        <h5>Productes pendents:</h5>
                        {previewItems.map((item) => (
                          <div key={item.id} className="preview-item">
                            <span className="preview-item-name">{item.task}</span>
                          </div>
                        ))}
                        {pendingItemsInList.length > 2 && (
                          <p className="more-items-preview">
                            ... i {pendingItemsInList.length - 2} més
                          </p>
                        )}
                      </div>
                    )}
                    
                    {pendingItemsInList.length === 0 && (
                      <div className="no-pending-items">
                        <p>✅ Tots els productes comprats!</p>
                      </div>
                    )}
                    
                    <div className="click-hint">
                      <p>Click per accedir a la llista →</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Accions ràpides */}
      <section className="quick-actions">
        <h2>⚡ Accions Ràpides</h2>
        <div className="action-buttons">
          <button onClick={() => navigate('/lists')} className="action-button">
            📝 Gestionar Llistes
          </button>
          <button onClick={() => navigate('/')} className="action-button">
            🛒 Anar a Comprar
          </button>
        </div>
      </section>

      {/* Botó per tornar a la pàgina principal */}
      <div className="page-footer">
        <button onClick={() => navigate('/')} className="back-button">
          ← Tornar a la llista de compra
        </button>
      </div>
    </div>
  );
};

export default UserPage;
