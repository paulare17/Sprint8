import React, { useState, useEffect } from "react";
import type { Supermarket } from "../services/supermarketService";
import { supermarketService } from "../services/supermarketService";

interface SupermarketSelectorProps {
  postalCode?: string;
  selectedSupermarket: Supermarket | null;
  onSupermarketSelect: (supermarket: Supermarket | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SupermarketSelector: React.FC<SupermarketSelectorProps> = ({
  postalCode,
  selectedSupermarket,
  onSupermarketSelect,
  placeholder = "🏪 Seleccionar supermercat (opcional)",
  disabled = false
}) => {
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar supermercats quan canvia el codi postal
  useEffect(() => {
    const loadSupermarkets = async () => {
      if (!postalCode) {
        setSupermarkets([]);
        return;
      }

      console.log(`🔍 Carregant supermercats per codi postal: ${postalCode}`);
      setIsLoading(true);
      try {
        const results = await supermarketService.getAllNearbySupermarkets(postalCode);
        console.log(`✅ Supermercats carregats: ${results.length}`);
        setSupermarkets(results);
      } catch (error) {
        console.error("❌ Error loading supermarkets:", error);
        setSupermarkets([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSupermarkets();
  }, [postalCode]);

  const handleSupermarketSelect = (supermarket: Supermarket | null) => {
    console.log('🏪 Supermercat seleccionat:', supermarket?.name || 'Cap');
    onSupermarketSelect(supermarket);
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    if (disabled) return;
    console.log('📋 Toggle dropdown:', !showDropdown);
    setShowDropdown(!showDropdown);
  };

  const getButtonText = () => {
    if (selectedSupermarket) {
      return `🏪 ${selectedSupermarket.name}`;
    }
    if (isLoading) {
      return '⏳ Carregant supermercats...';
    }
    if (supermarkets.length > 0) {
      return placeholder;
    }
    return '🚫 No hi ha supermercats disponibles';
  };

  return (
    <div className="supermarket-selector" style={{ position: 'relative', display: 'block' }}>
      <button
        type="button"
        className="supermarket-toggle-button"
        onClick={toggleDropdown}
        disabled={disabled}
        style={{ 
          padding: '10px', 
          border: '1px solid #ccc', 
          background: 'white', 
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>{getButtonText()}</span>
        <span className="dropdown-arrow">▼</span>
      </button>
        
      {showDropdown && !disabled && (
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
          {isLoading ? (
            <div className="supermarket-item loading" style={{ padding: '10px' }}>
              Carregant supermercats...
            </div>
          ) : (
            <>
              <div 
                className="supermarket-item clear-selection"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🚫 Netejant selecció de supermercat');
                  handleSupermarketSelect(null);
                }}
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
              {supermarkets.map((supermarket) => (
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
                      {supermarket.distance && <span className="distance"> • {Math.round(supermarket.distance)}m</span>}
                    </div>
                    <div className="supermarket-address">
                      📍 {supermarket.address}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SupermarketSelector; 