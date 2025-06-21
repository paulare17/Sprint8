import React, {Fragment} from 'react'
import type { ToDoItem } from '../types';

interface CheckProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  data: ToDoItem;
  }


const Check: React.FC<CheckProps> = ({onChange, data}) => {
  const {id, task, done, product, supermarket} = data

  
  return (
    <label className="task-item">
    <input
      className="task-checkbox"
      name={id}
      type="checkbox"
      defaultChecked={done}
      onChange={onChange}
    />
    <div className="task-content">
      <span className="task-text">{task}</span>
      {product && (
        <div className="product-info-mini">
          {product.image_url && (
            <img src={product.image_url} alt={product.name} className="product-image-mini" />
          )}
          {product.brands && (
            <span className="product-brand-mini">{product.brands}</span>
          )}
          {product.nutriscore_grade && (
            <span className={`nutriscore-mini grade-${product.nutriscore_grade.toLowerCase()}`}>
              {product.nutriscore_grade.toUpperCase()}
            </span>
          )}
        </div>
      )}
      {supermarket && (
        <div className="supermarket-info-mini">
          <span className="supermarket-name-mini">🏪 {supermarket.name}</span>
        </div>
      )}
    </div>
  </label>
)}

export default Check
