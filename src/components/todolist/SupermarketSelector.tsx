import React, { useState, useEffect } from 'react';
import type { Supermarket } from '../../services/supermarketService';
import { supermarketService } from '../../services/supermarketService';

interface SupermarketSelectorProps {
  onSupermarketSelect: (supermarket: Supermarket) => void;
  selectedSupermarket?: Supermarket;
  initialPostalCode?: string;
}

const SupermarketSelector: React.FC<SupermarketSelectorProps> = ({ 
  onSupermarketSelect, 
  selectedSupermarket,
  initialPostalCode
}) => {
  const [postalCode, setPostalCode] = useState(initialPostalCode || '');
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSupermarkets, setShowSupermarkets] = useState(false);

  // Actualitzar el codi postal si canvia des de fora
  useEffect(() => {
    if (initialPostalCode && initialPostalCode !== postalCode) {
      setPostalCode(initialPostalCode);
    }
  }, [initialPostalCode]);

  useEffect(() => {
    const searchSupermarkets = async () => {
      if (postalCode.length !== 5) {
        setSupermarkets([]);
        setShowSupermarkets(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await supermarketService.searchSupermarkets(postalCode);
        setSupermarkets(results);
        setShowSupermarkets(results.length > 0);
      } catch (error) {
        console.error('Error searching supermarkets:', error);
        setSupermarkets([]);
        setShowSupermarkets(false);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchSupermarkets, 500);
    return () => clearTimeout(timeoutId);
  }, [postalCode]);

  const handleSupermarketSelect = (supermarket: Supermarket) => {
    onSupermarketSelect(supermarket);
    setShowSupermarkets(false);
  };

  return (
    <div className="supermarket-selector">
      <div className="postal-code-input">
        <input
          type="text"
          className="postal-input"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder="Codi postal (ex: 08001)"
          maxLength={5}
        />
        {selectedSupermarket && (
          <div className="selected-supermarket">
            📍 {selectedSupermarket.name}
          </div>
        )}
      </div>

      {showSupermarkets && (
        <div className="supermarket-dropdown">
          {isLoading ? (
            <div className="supermarket-item loading">Buscant supermercats...</div>
          ) : supermarkets.length > 0 ? (
            supermarkets.map((supermarket) => (
              <div
                key={supermarket.id}
                className="supermarket-item"
                onClick={() => handleSupermarketSelect(supermarket)}
              >
                <div className="supermarket-info">
                  <div className="supermarket-name">🏪 {supermarket.name}</div>
                  <div className="supermarket-address">{supermarket.address}</div>
                  <div className="supermarket-details">
                    {supermarket.distance && (
                      <span className="distance">{supermarket.distance}m</span>
                    )}
                    {supermarket.rating && (
                      <span className="rating">⭐ {supermarket.rating}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="supermarket-item no-results">
              No s'han trobat supermercats en aquest codi postal
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupermarketSelector;
