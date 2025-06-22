import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useShoppingList } from '../contexts/ShoppingListContext';
import { useAuth } from '../contexts/AuthContext';
import UserAnalytics from '../components/UserAnalytics';

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentList, userLists, switchToList } = useShoppingList();
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="analytics-page">
        <div className="analytics-page-header">
          <h1>📊 Gràfics d'Analítica</h1>
        </div>
        <div className="not-authenticated">
          <h3>Inicia sessió per veure les analítiques</h3>
          <button onClick={() => navigate('/register')} className="login-button">
            Iniciar Sessió
          </button>
        </div>
      </div>
    );
  }

  if (!currentList) {
    return (
      <div className="analytics-page">
        <div className="analytics-page-header">
          <h1>📊 Gràfics d'Analítica</h1>
        </div>
        <div className="no-list-selected">
          <h3>No hi ha cap llista seleccionada</h3>
          <p>Selecciona una llista per veure les estadístiques dels usuaris.</p>
          
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
                    <p>👥 {list.members.length} membres</p>
                    <p>📊 {list.items.length} productes</p>
                    <span className="click-hint">Click per seleccionar →</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-lists">
              <p>No tens cap llista creada.</p>
              <button onClick={() => navigate('/lists')} className="create-list-button">
                📝 Crear o Unir-se a una Llista
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-page-header">
        <h1>📊 Gràfics d'Analítica</h1>
        <div className="current-list-info">
          <span className="current-list-badge">
            📋 {currentList.name} | 📍 {currentList.postalCode}
          </span>
        </div>
      </div>

      <UserAnalytics />

      <div className="analytics-page-footer">
        <button onClick={() => navigate('/pendents')} className="back-to-list-button">
          ← Tornar a la Llista
        </button>
        <button onClick={() => navigate('/lists')} className="change-list-button">
          📝 Canviar de Llista
        </button>
      </div>
    </div>
  );
};

export default AnalyticsPage; 