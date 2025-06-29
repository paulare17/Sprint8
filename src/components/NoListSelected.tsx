import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useShoppingList } from '../contexts/ShoppingListContext';
import { useAuth } from '../hooks/useAuth';

interface NoListSelectedProps {
  pageTitle: string;
  pageIcon: string;
  description: string;
  actionButtonText?: string;
  showCreateJoinButtons?: boolean;
}

const NoListSelected: React.FC<NoListSelectedProps> = ({
  pageTitle,
  pageIcon,
  description,
  actionButtonText = "📝 Crear o Unir-se a una Llista",
  showCreateJoinButtons = true
}) => {
  const navigate = useNavigate();
  const { userLists, switchToList } = useShoppingList();
  const { currentUser } = useAuth();

  // Si no está autenticado
  if (!currentUser) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>{pageIcon} {pageTitle}</h1>
        </div>
        <div className="not-authenticated">
          <h3>Inicia sessió per accedir a aquesta pàgina</h3>
          <p>Necessites estar autenticat per gestionar les teves llistes.</p>
          <button onClick={() => navigate('/register')} className="login-button">
            🔑 Iniciar Sessió
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{pageIcon} {pageTitle}</h1>
      </div>
      <div className="no-list-selected">
        <h3>No hi ha cap llista seleccionada</h3>
        <p>{description}</p>
        
        {userLists.length > 0 ? (
          <div className="available-lists">
            <h4>Llistes disponibles:</h4>
            <div className="lists-grid">
              {userLists.map((list) => (
                <div 
                  key={list.id} 
                  className="list-card"
                  onClick={() => switchToList(list.id)}
                >
                  <h5>📋 {list.name}</h5>
                  <p>📍 {list.postalCode}</p>
                  <p>👥 {list.members.length} membre{list.members.length !== 1 ? 's' : ''}</p>
                  <p>📊 {list.items.length} productes</p>
                  <span className="click-hint">Click per seleccionar →</span>
                </div>
              ))}
            </div>
            <p className="selection-help">
              💡 Fes click en una llista per seleccionar-la i començar a treballar
            </p>
          </div>
        ) : (
          <div className="no-lists">
            <div className="empty-icon">📝</div>
            <h3>No tens cap llista creada</h3>
            <p>Crea la teva primera llista o uneix-te a una existent per començar.</p>
          </div>
        )}

        {showCreateJoinButtons && (
          <div className="action-buttons">
            <button onClick={() => navigate('/lists')} className="create-list-button">
              {actionButtonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoListSelected; 