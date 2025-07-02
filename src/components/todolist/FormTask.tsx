import React, { useState } from "react";
import type { ToDoItem } from "../types";
import type { Supermarket } from "../../services/supermarketService";
import { useShoppingList } from "../../contexts/ShoppingListContext";
import { useCalendar } from "../../contexts/CalendarContext";
import SupermarketSelector from "../SupermarketSelector";

interface ToDoListProps {
  handleAddItem: (item: Omit<ToDoItem, 'id' | 'addedBy' | 'addedAt'>) => void;
}

const FormTask: React.FC<ToDoListProps> = ({ handleAddItem }) => {
  const { currentList } = useShoppingList();
  const { addProductAddedEvent } = useCalendar();
  const [task, setTask] = useState("");
  const [selectedSupermarket, setSelectedSupermarket] = useState<Supermarket | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!task.trim()) return;

    const newItem: Omit<ToDoItem, 'id' | 'addedBy' | 'addedAt'> = {
      done: false,
      task: task.trim(),
      ...(selectedSupermarket && {
        supermarket: {
          id: selectedSupermarket.id,
          name: selectedSupermarket.name,
          chain: selectedSupermarket.chain
        }
      })
    };

    handleAddItem(newItem);

    // Registrar event al calendari
    if (currentList) {
      const itemId = Date.now().toString();
      addProductAddedEvent(
        currentList.id,
        currentList.name,
        itemId,
        task.trim(),
        new Date()
      );
    }
    
    setTask("");
    setSelectedSupermarket(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTask(e.target.value);
  };

  const handleSupermarketSelect = (supermarket: Supermarket | null) => {
    setSelectedSupermarket(supermarket);
  };

  if (!currentList) {
    return (
      <div className="form-container">
        <div className="no-list-message">
          Selecciona una llista per afegir productes
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <form className="todo-form" onSubmit={handleSubmit}>
        <div className="input-container">
          <input
            type="text"
            className="to-do-input"
            value={task}
            placeholder="Escriu el nom del producte..."
            onChange={handleInputChange}
          />
        </div>
        
        {/* Selector de supermercat */}
        <SupermarketSelector
          postalCode={currentList?.postalCode}
          selectedSupermarket={selectedSupermarket}
          onSupermarketSelect={handleSupermarketSelect}
          placeholder="🏪 Seleccionar supermercat"
          />
         
        <button
          type="submit"
          className="add-button"
          disabled={!task.trim()}
        >
          ➕ 
        </button>
      </form>
    </div>
  );
};

export default FormTask;
