import React, { useState } from 'react'
import Check  from './Check';
import { useShoppingList } from '../../contexts/ShoppingListContext';
import { useCalendar } from '../../contexts/CalendarContext';

const TaskList: React.FC = () => {
  const { currentList, toggleItemInCurrentList, deleteItemFromCurrentList } = useShoppingList();
  const { markPurchaseCompleted } = useCalendar();
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  if (!currentList) {
    return (
      <div className='todo-list'>
        <p>No hi ha cap llista seleccionada</p>
      </div>
    );
  }

  const onChangeStatus = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name} = e.target;
    const item = currentList?.items.find(item => item.id === name);
    
    // marcar com a checked
    if (item && !item.done && currentList) {
      markPurchaseCompleted(
        currentList.id,
        currentList.name,
        item.id,
        item.task,
        new Date()
      );
    }
    
    toggleItemInCurrentList(name);
  }
  
  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('Estàs segur que vols eliminar aquest producte?')) {
      deleteItemFromCurrentList(itemId);
    }
  };

  //
  const activeItems = currentList.items.filter(item => !item.done);
  const completedItems = currentList.items.filter(item => item.done);
  
  const completedToShow = showAllCompleted ? completedItems : completedItems.slice(0, 3);
  

  const activeChecks = activeItems.map(item => (
    <Check 
      key={item.id} 
      data={item} 
      onChange={onChangeStatus} 
      onDelete={handleDeleteItem}
    />
  ));

  const completedChecks = completedToShow.map(item => (
    <Check 
      key={item.id} 
      data={item} 
      onChange={onChangeStatus}

    />
  ));

  return (
    <div className='todo-list'>      

      {activeChecks}
      

      {completedItems.length > 0 && (
        <>
          {completedItems.length > 0 && (
            <div className="completed-section">
              <h4 className="completed-header">Productes comprats</h4>
              {completedChecks}
              
              {/* Botó "Carrega més" */}
              {completedItems.length > 3 && !showAllCompleted && (
                <button 
                  className="load-more-btn"
                  onClick={() => setShowAllCompleted(true)}
                >
                  Carrega més ({completedItems.length - 3} més)
                </button>
              )}
              
              {/* Botó "Mostra menys" */}
              {showAllCompleted && completedItems.length > 3 && (
                <button 
                  className="load-more-btn"
                  onClick={() => setShowAllCompleted(false)}
                >
                  Mostra menys
                </button>
              )}
            </div>
          )}
        </>
      )}
      
      {currentList.items.length === 0 && (
        <p className="no-items-message">No cal comprar res</p>
      )}
    </div>
  )
}

export default TaskList
