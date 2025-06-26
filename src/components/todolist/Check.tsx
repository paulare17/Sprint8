import React, {Fragment} from 'react'
import type { ToDoItem } from '../types';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

interface CheckProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  data: ToDoItem;
  onDelete?: (itemId: string) => void;
}


const Check: React.FC<CheckProps> = ({onChange, data, onDelete}) => {
  const {id, task, done, supermarket} = data

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  return (
    <label className="task-item">
      <input
        className="task-checkbox"
        name={id}
        type="checkbox"
        checked={done}
        onChange={onChange}
      />
      <div className="task-content">
        <span className="task-text">
          {done && <span className="completed-indicator">✅ </span>}
          {task}
        </span>
        {supermarket && (
          <div className="supermarket-info-mini">
            <span className="supermarket-name-mini">
              🏪 {supermarket.name}
              {supermarket.chain && <span className="chain-info"> ({supermarket.chain})</span>}
            </span>
          </div>
        )}
      </div>
      {onDelete && !done && (
        <button 
          className="delete-item-btn"
          onClick={handleDelete}
          title="Eliminar producte"
        >
        <DeleteForeverIcon/>
        </button>
      )}
    </label>
  )
}

export default Check
