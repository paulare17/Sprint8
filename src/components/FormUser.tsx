import React, { useState } from "react";
import { useAuth } from '../contexts/AuthContext';

interface UserData {
  user: string;
  email: string;
  password: string;
  repeatPassword: string;
  postal: string;
  listOption: 'new-list' | 'add-to-list';
}

interface FormUserProps {
  onUserRegistered?: (postalCode: string) => void;
  onPostalCodeChange?: (postalCode: string) => void;
  onSwitchToLogin?: () => void;
}

function FormUser({ onUserRegistered, onPostalCodeChange, onSwitchToLogin }: FormUserProps) {
  const { register } = useAuth();
  
  const [userData, setUserData] = useState<UserData>({
    user: '',
    email: '',
    password: '',
    repeatPassword: '',
    postal: '',
    listOption: 'new-list'
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    const newUserData = { ...userData, [name]: value };
    setUserData(newUserData);
    
    // Si és el codi postal, notificar immediatament
    if (name === 'postal') {
      onPostalCodeChange?.(value);
    }

    // Neteja errors quan l'usuari escriu
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = (): string[] => {
    const newErrors: string[] = [];

    // Validació nom d'usuari
    if (!userData.user.trim()) {
      newErrors.push("El nom d'usuari és obligatori");
    } else if (userData.user.length < 3) {
      newErrors.push("El nom d'usuari ha de tenir almenys 3 caràcters");
    }

    // Validació email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userData.email.trim()) {
      newErrors.push("L'email és obligatori");
    } else if (!emailRegex.test(userData.email)) {
      newErrors.push("Format d'email no vàlid");
    }

    // Validació contrasenya
    if (!userData.password) {
      newErrors.push("La contrasenya és obligatòria");
    } else if (userData.password.length < 6) {
      newErrors.push("La contrasenya ha de tenir almenys 6 caràcters");
    }

    // Validació repetir contrasenya
    if (userData.password !== userData.repeatPassword) {
      newErrors.push("Les contrasenyes no coincideixen");
    }

    // Validació codi postal
    if (!userData.postal.trim()) {
      newErrors.push("El codi postal és obligatori");
    } else if (!/^\d{5}$/.test(userData.postal)) {
      newErrors.push("El codi postal ha de tenir 5 dígits");
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validar formulari
    const formErrors = validateForm();
    if (formErrors.length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);
    setErrors([]);
    
    try {
      // Registrar usuari amb Firebase
      await register(
        userData.email,
        userData.password,
        userData.user,
        userData.postal,
        userData.listOption
      );

      setSuccessMessage('✅ Usuari registrat correctament!');
      
      // Notificar al component pare
      onUserRegistered?.(userData.postal);
      
      // Reset form després d'un temps
      setTimeout(() => {
        setUserData({
          user: '',
          email: '',
          password: '',
          repeatPassword: '',
          postal: '',
          listOption: 'new-list'
        });
        setSuccessMessage('');
      }, 2000);

    } catch (error: unknown) {
      console.error('Error registering user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error en registrar usuari';
      setErrors([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>
            <h3>Crea el teu usuari!</h3>
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

          {/* Missatge d'èxit */}
          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}
          
          <label htmlFor="user">Usuari:</label>
          <input
            id="user"
            placeholder="usuari"
            type="text"
            name="user"
            value={userData.user}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          /><br />
          
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            placeholder="email@example.com"
            type="email"
            name="email"
            value={userData.email}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          /><br />
          
          <label htmlFor="password">Contrasenya:</label>
          <input
            id="password"
            placeholder="contrasenya (mínim 6 caràcters)"
            type="password"
            name="password"
            value={userData.password}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          /><br />
          
          <label htmlFor="repeatPassword">Repeteixi contrasenya:</label>
          <input
            id="repeatPassword"
            placeholder="repeteixi contrasenya"
            type="password"
            name="repeatPassword"
            value={userData.repeatPassword}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          /><br />
          
          <label htmlFor="postal">Introdueixi el seu codi postal:</label>
          <input
            id="postal"
            placeholder="08001"
            type="text"
            name="postal"
            value={userData.postal}
            onChange={handleInputChange}
            disabled={isLoading}
            maxLength={5}
            pattern="\d{5}"
            required
          /><br />
          
          <div className="radio-group">
            <label>
              <input 
                type="radio" 
                name="listOption" 
                value="new-list" 
                checked={userData.listOption === 'new-list'}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              Crear una nova llista
            </label>
            <label>
              <input 
                type="radio" 
                name="listOption" 
                value="add-to-list" 
                checked={userData.listOption === 'add-to-list'}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              Unir-me a una llista existent
            </label>
          </div>
        </fieldset>
        
        <div className="inicia-section">
          <button 
            type="submit" 
            className="inicia-button"
            disabled={isLoading}
          >
            {isLoading ? '⏳ Registrant...' : 'Registra\'t'}
          </button>
        </div>

        {onSwitchToLogin && (
          <div className="switch-form">
            <p>
              Ja tens compte? 
              <button 
                type="button" 
                className="link-button"
                onClick={onSwitchToLogin}
                disabled={isLoading}
              >
                Inicia sessió aquí
              </button>
            </p>
          </div>
        )}
      </form>
    </section>
  );
}

export default FormUser;
