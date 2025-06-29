import React, { useState } from 'react';
import { useShoppingList } from '../contexts/ShoppingListContext';

interface CreateListFormProps {
  onListCreated: (listId: string) => void;
  onCancel: () => void;
}

const CreateListForm: React.FC<CreateListFormProps> = ({ onListCreated, onCancel }) => {
  const { createNewList, isLoading } = useShoppingList();
  const [listName, setListName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!listName.trim()) {
      setError('El nom de la llista és obligatori');
      return;
    }
    
    if (!postalCode.trim()) {
      setError('El codi postal és obligatori');
      return;
    }

    // Validar format del codi postal espanyol
    const postalCodeRegex = /^[0-5][0-9]{4}$/;
    if (!postalCodeRegex.test(postalCode.trim())) {
      setError('El codi postal ha de tenir 5 dígits (ex: 08001)');
      return;
    }

    try {
      setError('');
      const newListId = await createNewList(listName.trim(), postalCode.trim());
      onListCreated(newListId);
    } catch {
      setError('Error creant la llista');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-list-form">
      <div className="form-header">
        <h3>Crear Nova Llista</h3>
        <button 
          type="button" 
          onClick={onCancel}
          className="close-btn"
          disabled={isLoading}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="list-form">
        <div className="form-group">
          <label htmlFor="listName">Nom de la llista</label>
          <input
            type="text"
            id="listName"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="Ex: Compra setmanal, Festa d'aniversari..."
            disabled={isLoading}
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label htmlFor="postalCode">Codi postal</label>
          <input
            type="text"
            id="postalCode"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="Ex: 08001"
            disabled={isLoading}
            maxLength={5}
          />
          <small className="form-help">
            Els supermercats es buscaran basant-se en aquest codi postal
          </small>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel·lar
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creant...' : 'Crear Llista'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateListForm; 