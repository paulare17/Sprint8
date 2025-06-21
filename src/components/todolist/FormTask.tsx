import React, { useState, useEffect } from "react";
import type { ToDoItem, Product } from "../types";
import { openFoodService } from "../../services/openFoodService";
import SupermarketSelector from "./SupermarketSelector";
import type { Supermarket } from "../../services/supermarketService";
import { useAuth } from "../../contexts/AuthContext";

interface ToDoListProps {
  handleAddItem: (item: ToDoItem) => void;
}

const FormTask: React.FC<ToDoListProps> = ({ handleAddItem }) => {
  const { userProfile } = useAuth();
  const [task, setTask] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSupermarket, setSelectedSupermarket] = useState<Supermarket | null>(null);

  // Utilitzar el codi postal de l'usuari autenticat
  const userPostalCode = userProfile?.postalCode;

  //cerca productes
  useEffect(() => {
    const searchProducts = async () => {
      if (task.length < 2) {
        setProducts([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await openFoodService.searchProducts(task, 5);
        setProducts(results);
        setShowDropdown(true);
      } catch (error) {
        console.error("Error searching products:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [task]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!task) return;

    handleAddItem({
      done: false,
      id: (+new Date()).toString(),
      task,
      product: selectedProduct || undefined,
      supermarket: selectedSupermarket ? {
        name: selectedSupermarket.name,
        coordinates: selectedSupermarket.coordinates
      } : undefined
    });
    setTask("");
    setSelectedProduct(null);
    setShowDropdown(false);
  };

  const handleProductSelect = (product: Product) => {
    setTask(product.name);
    setSelectedProduct(product);
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTask(e.target.value);
    setSelectedProduct(null);
  };

  return (
    <div className="form-container">
      <form className="todo-form" onSubmit={handleSubmit}>
        <div className="input-container">
          <input
            type="text"
            className="to-do-input"
            value={task}
            placeholder="Cerca producte..."
            onChange={handleInputChange}
            onFocus={() => task.length >= 2 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />
          
          {showDropdown && (
            <div className="product-dropdown">
              {isLoading ? (
                <div className="product-item loading">Buscant...</div>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="product-item"
                    onMouseDown={() => handleProductSelect(product)}
                  >
                    <div className="product-info">
                      {product.image_url && (
                        <img src={product.image_url} alt={product.name} className="product-image" />
                      )}
                      <div className="product-details">
                        <div className="product-name">{product.name}</div>
                        {product.brands && (
                          <div className="product-brand">{product.brands}</div>
                        )}
                      </div>
                    </div>
                    {product.nutriscore_grade && (
                      <div className={`nutriscore grade-${product.nutriscore_grade.toLowerCase()}`}>
                        {product.nutriscore_grade.toUpperCase()}
                      </div>
                    )}
                  </div>
                ))
              ) : task.length >= 2 ? (
                <div className="product-item no-results">No s'han trobat productes</div>
              ) : null}
            </div>
          )}
        </div>
            
        <button
          type="submit"
          className="add-button"
          disabled={!task}
        >
          +
        </button>
      </form>
    </div>
  );
};

export default FormTask;
