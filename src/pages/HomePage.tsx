import React, { useState } from 'react';
import FormUser from '../components/FormUser';
import LoginForm from '../components/LoginForm';
import FAQs from '../components/FAQs';
import Container from '../components/todolist/Container';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const { currentUser, userProfile, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const handleUserRegistered = (postalCode: string) => {
    console.log('Usuari registrat amb codi postal:', postalCode);
  };

  const handlePostalCodeChange = (postalCode: string) => {
    console.log('Codi postal canviat:', postalCode);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      {/* Header section */}
      <section className='inicia-section'>
        {currentUser ? (
          <button className='inicia-button' onClick={handleLogout}>
            Tancar sessió
          </button>
        ) : (
          <button className='inicia-button' onClick={() => setShowLogin(!showLogin)}>
            {showLogin ? 'Vull registrar-me' : 'Ja tinc compte'}
          </button>
        )}
      </section>

      {/* Image preview */}
      <div className='img-preview'>
        <img src="src/assets/imagetemporal.png" alt="Vista prèvia" />
      </div>

      {/* Conditional rendering based on user state */}
      {!currentUser ? (
        <>
          {/* Show login or registration form */}
          {showLogin ? (
            <LoginForm onSwitchToRegister={() => setShowLogin(false)} />
          ) : (
            <FormUser 
              onUserRegistered={handleUserRegistered}
              onPostalCodeChange={handlePostalCodeChange}
              onSwitchToLogin={() => setShowLogin(true)}
            />
          )}
          <FAQs />
        </>
      ) : (
        <>
          {/* Show todo list if logged in */}
          <div className="user-info">
            <h2>Benvingut, {userProfile?.displayName}!</h2>
            <p>📍 Zona: {userProfile?.postalCode}</p>
          </div>
          <Container userPostalCode={userProfile?.postalCode} />
        </>
      )}
    </>
  );
}

export default HomePage;

