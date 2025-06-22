import React, {Fragment} from 'react'
import type { ToDoItem } from '../types';

interface CheckProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  data: ToDoItem;
  }


const Check: React.FC<CheckProps> = ({onChange, data}) => {
  const {id, task, done, supermarket} = data

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
    </label>
  )
}

export default Check
