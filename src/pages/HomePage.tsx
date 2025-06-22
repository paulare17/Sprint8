import React from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '../components/todolist/Container';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {/* Conditional rendering based on user state */}
      {!currentUser ? (
        <>
          {/* Benvinguda per usuaris no autenticats */}
          <section className='inicia-section'>
            <button 
              className='inicia-button' 
              onClick={() => navigate('/register')}
            >
              Comença aquí - Registra't
            </button>
          </section>

          <div className='img-preview'>
            <img src="src/assets/imagetemporal.png" alt="Vista prèvia" />
          </div>

          <div className="welcome-message">
            <h2>Benvingut a Inprocode Shopping</h2>
            <p>La teva aplicació per gestionar llistes de compra compartides</p>
            <p>Registra't per començar a crear i compartir les teves llistes!</p>
          </div>
        </>
      ) : (
        <>
          {/* Mostrar llista de ToDo si està connectat */}
          <div className="user-info">
            <h2>Benvingut, {userProfile?.displayName}!</h2>
            <p>📍 Zona: {userProfile?.postalCode}</p>
          </div>
          <Container />
        </>
      )}
    </>
  );
}

export default HomePage;

