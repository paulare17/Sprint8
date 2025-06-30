import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormUser from '../components/FormUser';
import LoginForm from '../components/LoginForm';
import FAQs from '../components/FAQs';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);

  const handleUserRegistered = (_postalCode: string) => {
    // Redirigir a la pàgina principal després del registre
    navigate('/', { replace: true });
  };

  const handlePostalCodeChange = (_postalCode: string) => {
    // Actualitzar el codi postal si és necessari
  };

  return (
    <div className="register-page">
      {/* Header de benvinguda */}
      <div className="register-header">
        <h1>Uneix-te a Inprocode Shopping</h1>
        <p>Crea el teu compte per començar a gestionar llistes compartides</p>
      </div>

      {/* Header amb navegació */}
      <section className='inicia-section'>
        <button 
          className='inicia-button' 
          onClick={() => setShowLogin(!showLogin)}
        >
          {showLogin ? 'Vull registrar-me' : 'Ja tinc compte'}
        </button>
      </section>

      {/* Formularis */}
      {showLogin ? (
        <LoginForm onSwitchToRegister={() => setShowLogin(false)} />
      ) : (
        <FormUser 
          onUserRegistered={handleUserRegistered}
          onPostalCodeChange={handlePostalCodeChange}
          onSwitchToLogin={() => setShowLogin(true)}
        />
      )}

      {/* FAQs */}
      <FAQs />

      {/* Botó per tornar */}
      <div className="page-footer">
        <button onClick={() => navigate('/')} className="back-button">
          ← Tornar a l'inici
        </button>
      </div>
    </div>
  );
};

export default RegisterPage; 