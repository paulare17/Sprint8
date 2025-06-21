import React, { useState } from "react";
import { useAuth } from '../contexts/AuthContext';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuth();
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
    
    // Neteja errors quan l'usuari escriu
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      setErrors(['Tots els camps són obligatoris']);
      return;
    }

    setIsLoading(true);
    setErrors([]);
    
    try {
      await login(loginData.email, loginData.password);
      // L'usuari serà redirigit automàticament gràcies a AuthContext
    } catch (error: any) {
      console.error('Error logging in:', error);
      setErrors([error.message || 'Error en iniciar sessió']);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>
            <h3>Inicia sessió</h3>
          </legend>

          {/* Missatges d'error */}
          {errors.length > 0 && (
            <div className="error-messages">
              {errors.map((error, index) => (
                <div key={index} className="error-message">
                  ❌ {error}
                </div>
              ))}
            </div>
          )}
          
          <label htmlFor="loginEmail">Email:</label>
          <input
            id="loginEmail"
            placeholder="email@example.com"
            type="email"
            name="email"
            value={loginData.email}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          /><br />
          
          <label htmlFor="loginPassword">Contrasenya:</label>
          <input
            id="loginPassword"
            placeholder="contrasenya"
            type="password"
            name="password"
            value={loginData.password}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          /><br />
        </fieldset>
        
        <div className="inicia-section">
          <button 
            type="submit" 
            className="inicia-button"
            disabled={isLoading}
          >
            {isLoading ? '⏳ Iniciant sessió...' : 'Inicia sessió'}
          </button>
        </div>

        <div className="switch-form">
          <p>
            No tens compte? 
            <button 
              type="button" 
              className="link-button"
              onClick={onSwitchToRegister}
              disabled={isLoading}
            >
              Registra't aquí
            </button>
          </p>
        </div>
      </form>
    </section>
  );
}

export default LoginForm; 