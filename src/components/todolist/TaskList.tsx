import React from 'react'
import Check  from './Check';
import { useTodos } from '../../contexts/TodoContext';

const TaskList: React.FC = () => {
  const { todos, updateTodo, deleteTodo } = useTodos();

    const onChangeStatus = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, checked} = e.target;
        updateTodo(name, { done: checked });
    }
    
const onClickRemoveItem = () => {
    const completedTodos = todos.filter(item => item.done);
    completedTodos.forEach(todo => deleteTodo(todo.id));
  };


    const check = todos.map(item => (
        <Check key={item.id} data={item} onChange={onChangeStatus} />
    ));

  return (
    <div className='todo-list'>
        {todos.length ? check : "No cal comprar res" }
        {todos.length ? (
            <p>
            <button className="inicia-button" onClick={onClickRemoveItem}>
            Delete all done
          </button>
            </p>
        ) : null}
    </div>
  )
}

export default TaskList
