import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ToDoItem } from '../components/types';

interface TodoContextType {
  todos: ToDoItem[];
  addTodo: (todo: ToDoItem) => void;
  updateTodo: (id: string, updates: Partial<ToDoItem>) => void;
  deleteTodo: (id: string) => void;
  clearTodos: () => void;
  pendingTodos: ToDoItem[];
  completedTodos: ToDoItem[];
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const useTodos = () => {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};

interface TodoProviderProps {
  children: React.ReactNode;
}

export const TodoProvider: React.FC<TodoProviderProps> = ({ children }) => {
  const [todos, setTodos] = useState<ToDoItem[]>([]);

  // Carregar TODOs del localStorage en inicialitzar
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      try {
        setTodos(JSON.parse(savedTodos));
      } catch (error) {
        console.error('Error loading todos from localStorage:', error);
      }
    }
  }, []);

  // Guardar TODOs al localStorage quan canviïn
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (todo: ToDoItem) => {
    setTodos(prev => [...prev, todo]);
  };

  const updateTodo = (id: string, updates: Partial<ToDoItem>) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, ...updates } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const clearTodos = () => {
    setTodos([]);
    localStorage.removeItem('todos');
  };

  // Computar TODOs pendents i completats
  const pendingTodos = todos.filter(todo => !todo.done);
  const completedTodos = todos.filter(todo => todo.done);

  const value: TodoContextType = {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    clearTodos,
    pendingTodos,
    completedTodos
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
}; 