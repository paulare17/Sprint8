import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTodos } from '../contexts/TodoContext';
import { useNavigate } from 'react-router-dom';

const UserPage: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { todos, pendingTodos, completedTodos, clearTodos } = useTodos();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleClearTodos = () => {
    if (window.confirm('Estàs segur que vols esborrar tots els productes?')) {
      clearTodos();
    }
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
            <span className="stat-number">{pendingTodos.length}</span>
          </div>
          <div className="stat-card completed">
            <h3>Productes Comprats</h3>
            <span className="stat-number">{completedTodos.length}</span>
          </div>
          <div className="stat-card total">
            <h3>Total Productes</h3>
            <span className="stat-number">{todos.length}</span>
          </div>
        </div>
      </section>

      {/* Productes pendents */}
      <section className="pending-products">
        <div className="section-header">
          <h2>🛒 Productes Pendents</h2>
          {pendingTodos.length > 0 && (
            <button className="clear-button" onClick={handleClearTodos}>
              Esborrar tots
            </button>
          )}
        </div>
        
        {pendingTodos.length === 0 ? (
          <div className="empty-state">
            <p>No tens productes pendents a la llista de compra</p>
            <button onClick={() => navigate('/')} className="go-shopping-button">
              Afegir productes
            </button>
          </div>
        ) : (
          <div className="products-list">
            {pendingTodos.map((todo) => (
              <div key={todo.id} className="product-card">
                <div className="product-header">
                  <h4>{todo.task}</h4>
                  {todo.product && (
                    <div className="product-image-container">
                      {todo.product.image_url && (
                        <img 
                          src={todo.product.image_url} 
                          alt={todo.product.name}
                          className="product-image"
                        />
                      )}
                    </div>
                  )}
                </div>
                
                {todo.product && (
                  <div className="product-details">
                    {todo.product.brands && (
                      <p className="product-brand">Marca: {todo.product.brands}</p>
                    )}
                    {todo.product.nutriscore_grade && (
                      <span className={`nutriscore grade-${todo.product.nutriscore_grade.toLowerCase()}`}>
                        Nutriscore: {todo.product.nutriscore_grade.toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
                
                {todo.supermarket && (
                  <div className="supermarket-info">
                    <p>🏪 {todo.supermarket.name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Productes completats (recentment) */}
      {completedTodos.length > 0 && (
        <section className="completed-products">
          <h2>✅ Productes Comprats Recentment</h2>
          <div className="products-list">
            {completedTodos.slice(0, 5).map((todo) => (
              <div key={todo.id} className="product-card completed">
                <div className="product-header">
                  <h4>{todo.task}</h4>
                  <span className="completed-badge">✅</span>
                </div>
                {todo.supermarket && (
                  <div className="supermarket-info">
                    <p>🏪 {todo.supermarket.name}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {completedTodos.length > 5 && (
            <p className="more-items">... i {completedTodos.length - 5} més</p>
          )}
        </section>
      )}

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
