import React from 'react'
import Check  from './Check';
import { useShoppingList } from '../../contexts/ShoppingListContext';

const TaskList: React.FC = () => {
  const { currentList, toggleItemInCurrentList, deleteItemFromCurrentList } = useShoppingList();

  if (!currentList) {
    return (
      <div className='todo-list'>
        <p>No hi ha cap llista seleccionada</p>
      </div>
    );
  }

  const onChangeStatus = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name} = e.target;
    toggleItemInCurrentList(name);
  }
  
  const onClickRemoveItem = () => {
    const completedItems = currentList.items.filter(item => item.done);
    completedItems.forEach(item => deleteItemFromCurrentList(item.id));
  };

  const check = currentList.items.map(item => (
    <Check key={item.id} data={item} onChange={onChangeStatus} />
  ));

  return (
    <div className='todo-list'>
      {currentList.items.length ? check : "No cal comprar res" }
      {currentList.items.length ? (
        <p>
          <button className="inicia-button" onClick={onClickRemoveItem}>
            Eliminar completats
          </button>
        </p>
      ) : null}
    </div>
  )
}

export default TaskList
