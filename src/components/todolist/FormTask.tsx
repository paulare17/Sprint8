import React, { useState, useEffect } from "react";
import type { ToDoItem } from "../types";
import type { Supermarket } from "../../services/supermarketService";
import { supermarketService } from "../../services/supermarketService";
import { useShoppingList } from "../../contexts/ShoppingListContext";

interface ToDoListProps {
  handleAddItem: (item: Omit<ToDoItem, 'id' | 'addedBy' | 'addedAt'>) => void;
}

const FormTask: React.FC<ToDoListProps> = ({ handleAddItem }) => {
  const { currentList } = useShoppingList();
  const [task, setTask] = useState("");
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [selectedSupermarket, setSelectedSupermarket] = useState<Supermarket | null>(null);
  const [showSupermarketDropdown, setShowSupermarketDropdown] = useState(false);
  const [isLoadingSupermarkets, setIsLoadingSupermarkets] = useState(false);

  // Carregar supermercats de la zona quan hi ha una llista
  useEffect(() => {
    const loadSupermarkets = async () => {
      if (!currentList?.postalCode) {
        console.log('🔍 No hi ha codi postal a la llista actual');
        setSupermarkets([]);
        return;
      }

      console.log(`🔍 Carregant supermercats per codi postal: ${currentList.postalCode}`);
      setIsLoadingSupermarkets(true);
      try {
        const results = await supermarketService.getAllNearbySupermarkets(currentList.postalCode);
        console.log(`✅ Supermercats carregats: ${results.length}`);
        setSupermarkets(results);
      } catch (error) {
        console.error("❌ Error loading supermarkets:", error);
        setSupermarkets([]);
      } finally {
        setIsLoadingSupermarkets(false);
      }
    };

    loadSupermarkets();
  }, [currentList?.postalCode]);

  // Debug rendering
  console.log('🔄 FormTask render:', {
    currentListPostalCode: currentList?.postalCode,
    supermarketsCount: supermarkets.length,
    isLoading: isLoadingSupermarkets,
    showDropdown: showSupermarketDropdown,
    selectedSupermarket: selectedSupermarket?.name,
    geoapifyKey: import.meta.env.VITE_GEOAPIFY_API_KEY ? 'Configured' : 'Missing'
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!task.trim()) return;

    handleAddItem({
      done: false,
      task: task.trim(),
      supermarket: selectedSupermarket ? {
        id: selectedSupermarket.id,
        name: selectedSupermarket.name,
        chain: selectedSupermarket.chain
      } : undefined
    });
    
    setTask("");
    setSelectedSupermarket(null);
    setShowSupermarketDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTask(e.target.value);
  };

  const handleSupermarketSelect = (supermarket: Supermarket) => {
    console.log('🏪 Supermercat seleccionat:', supermarket.name);
    setSelectedSupermarket(supermarket);
    setShowSupermarketDropdown(false);
  };

  const toggleSupermarketDropdown = () => {
    console.log('📋 Toggle dropdown:', !showSupermarketDropdown);
    setShowSupermarketDropdown(!showSupermarketDropdown);
  };

  if (!currentList) {
    return (
      <div className="form-container">
        <div className="no-list-message">
          Selecciona una llista per afegir productes
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <form className="todo-form" onSubmit={handleSubmit}>
        <div className="input-container">
          <input
            type="text"
            className="to-do-input"
            value={task}
            placeholder="Escriu el nom del producte..."
            onChange={handleInputChange}
          />
        </div>
        
        {/* Selector de supermercat */}
        <div className="supermarket-selector" style={{ position: 'relative', display: 'block' }}>
          <button
            type="button"
            className="supermarket-toggle-button"
            onClick={toggleSupermarketDropdown}
            style={{ padding: '10px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
          >
            {selectedSupermarket 
              ? `🏪 ${selectedSupermarket.name}` 
              : isLoadingSupermarkets 
                ? '⏳ Carregant supermercats...'
                : supermarkets.length > 0
                  ? '🏪 Seleccionar supermercat (opcional)'
                  : '🚫 No hi ha supermercats disponibles'
            }
            <span className="dropdown-arrow">▼</span>
          </button>
            
          {showSupermarketDropdown && (
            <div 
              className="supermarket-dropdown" 
              style={{ 
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                border: '1px solid #ccc', 
                background: 'white', 
                maxHeight: '200px', 
                overflow: 'auto',
                zIndex: 1000,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              {isLoadingSupermarkets ? (
                <div className="supermarket-item loading" style={{ padding: '10px' }}>Carregant supermercats...</div>
              ) : (
                <>
                  <div 
                    className="supermarket-item clear-selection"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🚫 Netejant selecció de supermercat');
                      setSelectedSupermarket(null);
                      setShowSupermarketDropdown(false);
                    }}
                    onMouseEnter={() => console.log('🔄 Hover on clear selection')}
                    style={{ 
                      padding: '10px', 
                      cursor: 'pointer', 
                      borderBottom: '1px solid #eee',
                      userSelect: 'none',
                      backgroundColor: '#f8f9fa'
                    }}
                  >
                    <span>🚫 Sense supermercat específic</span>
                  </div>
                  {supermarkets.map((supermarket) => {
                    console.log('🏪 Rendering supermarket item:', supermarket.name);
                    return (
                    <div
                      key={supermarket.id}
                      className="supermarket-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        console.log('🏪 Clicked supermarket:', supermarket.name);
                        handleSupermarketSelect(supermarket);
                      }}
                      style={{ 
                        padding: '10px', 
                        cursor: 'pointer', 
                        borderBottom: '1px solid #eee',
                        userSelect: 'none'
                      }}
                    >
                      <div className="supermarket-info">
                        <div className="supermarket-name">
                          🏪 {supermarket.name}
                        </div>
                                                  <div className="supermarket-details">
                            {supermarket.chain && <span className="chain">({supermarket.chain})</span>}
                            <span className="distance">{supermarket.distance}m</span>
                          </div>
                        <div className="supermarket-address">
                          📍 {supermarket.address}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
        
        <button
          type="submit"
          className="add-button"
          disabled={!task.trim()}
        >
          ➕ Afegir
        </button>
      </form>
    </div>
  );
};

export default FormTask;
