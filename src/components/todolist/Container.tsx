import React from 'react'
import { useNavigate } from 'react-router-dom';
import FormTask from "./FormTask";
import TaskList from "./TaskList";
import { useShoppingList } from '../../contexts/ShoppingListContext';
import type { ToDoItem } from '../types';

const Container: React.FC = () => {
  const { currentList, addItemToCurrentList } = useShoppingList();
  const navigate = useNavigate();

  const handleAddItem = (addItem: Omit<ToDoItem, 'id' | 'addedBy' | 'addedAt'>) => {
    addItemToCurrentList(addItem);
  };

  if (!currentList) {
    return (
      <div className='todo-container'>
        <div className="no-list-selected">
          <h3>No hi ha cap llista seleccionada</h3>
          <p>Selecciona una llista per començar a afegir productes.</p>
          <button className='action-button' onClick={()=>navigate('/lists')}>Selecciona una llista</button>
        </div>
      </div>
    );
  }

  return (
    <div className='todo-container'>
      <h2>📝 {currentList.name}</h2>
      <div className="list-details">
        <div className="list-location">
          📍 Zona: {currentList.postalCode}
        </div>
        <div className="list-members">
          👥 {currentList.members.length} membre{currentList.members.length !== 1 ? 's' : ''}
        </div>
        <div className="list-stats">
          📊 {currentList.items.length} productes • {currentList.items.filter(item => item.done).length} comprats
        </div>
      </div>
      <FormTask handleAddItem={handleAddItem} />
      <TaskList />
    </div>
  );
};

export default Container
