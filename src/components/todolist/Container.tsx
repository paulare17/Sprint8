import React from 'react'
import FormTask from "./FormTask";
import TaskList from "./TaskList";
import { useTodos } from '../../contexts/TodoContext';
import { useAuth } from '../../contexts/AuthContext';
import type { ToDoItem } from '../types';

const Container: React.FC = () => {
  const { addTodo } = useTodos();
  const { userProfile } = useAuth();

  const handleAddItem = (addItem: ToDoItem) => {
    addTodo(addItem);
  };

  return (
    <div className='todo-container'>
      <h2>Lista de la compra:</h2>
      {userProfile?.postalCode && (
        <div className="user-location">
          📍 Zona: {userProfile.postalCode}
        </div>
      )}
      <FormTask handleAddItem={handleAddItem} />
      <TaskList />
    </div>
  );
};

export default Container
