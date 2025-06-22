import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useShoppingList } from '../contexts/ShoppingListContext';
import { useNavigate } from 'react-router-dom';

const UserPage: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { userLists, currentList, switchToList } = useShoppingList();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
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
        <h2>📋 Informació Personal</h2>
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
                  className={`list-overview-card ${currentList?.id === list.id ? 'active-list' : ''}`}
                  onClick={() => handleGoToList(list.id)}
                >
                  <div className="list-overview-header">
                    <h4>📋 {list.name}</h4>
                    <div className="list-overview-stats">
                      <span className="pending-count">{pendingItemsInList.length} pendents</span>
                      <span className="completed-count">{completedItemsInList.length} comprats</span>
                    </div>
                  </div>
                  
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
