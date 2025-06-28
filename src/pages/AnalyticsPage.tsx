import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useShoppingList } from '../contexts/ShoppingListContext';
import { useAuth } from '../contexts/AuthContext';
import UserAnalytics from '../components/UserAnalytics';
import NoListSelected from '../components/NoListSelected';

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentList, userLists, switchToList } = useShoppingList();
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <NoListSelected
        pageTitle="Gràfics d'Analítica"
        pageIcon="📊"
        description="Selecciona una llista per veure les estadístiques dels usuaris i analitzar qui afegeix més productes i qui en compra més."
      />
    );
  }

  if (!currentList) {
    return (
      <NoListSelected
        pageTitle="Gràfics d'Analítica"
        pageIcon="📊"
        description="Selecciona una llista per veure les estadístiques dels usuaris i analitzar qui afegeix més productes i qui en compra més."
      />
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