import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useAuth } from '../contexts/AuthContext';
import { useShoppingList } from '../contexts/ShoppingListContext';
import { supermarketService, type Supermarket } from '../services/supermarketService';
import NoListSelected from '../components/NoListSelected';

// Import Mapbox CSS
import 'mapbox-gl/dist/mapbox-gl.css';

const MapPage: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { userProfile } = useAuth();
  const { currentList, addItemToCurrentList } = useShoppingList();
  
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [selectedSupermarket, setSelectedSupermarket] = useState<Supermarket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  // Estado para añadir productos desde el popup
  const [newProductName, setNewProductName] = useState('');

  // Inicialitzar mapa només una vegada
  useEffect(() => {
    console.log('🚀 Iniciant MapPage useEffect...');
    
    if (!mapContainer.current) {
      console.log('❌ mapContainer.current no està disponible');
      return;
    }
    
    if (map.current) {
      console.log('✅ Mapa ja existeix, sortint...');
      return;
    }

    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    console.log('🔑 Token Mapbox:', mapboxToken ? `${mapboxToken.substring(0, 10)}...` : 'NO TROBAT');
    
    if (!mapboxToken) {
      console.error('❌ Mapbox token not found');
      setMapError('Token de Mapbox no trobat');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🗺️ Configurant Mapbox token...');
      mapboxgl.accessToken = mapboxToken;

      // No crear el mapa si no tenim una llista amb codi postal
      if (!currentList?.postalCode) {
        console.log('⏸️ No es pot crear el mapa sense una llista amb codi postal');
        setMapError('Selecciona una llista amb codi postal per veure el mapa');
        setIsLoading(false);
        return;
      }

      console.log('🗺️ Creant nou mapa...');
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [0, 0], // Temporal, s'actualitzarà amb les coordenades del codi postal
        zoom: 13
      });

      console.log('🗺️ Mapa creat, esperant event "load"...');

      // Timeout de seguretat
      const timeout = setTimeout(() => {
        console.warn('⏰ Timeout: el mapa no s\'ha carregat en 15 segons');
        setMapError('Timeout carregant el mapa');
        setIsLoading(false);
      }, 15000);

      map.current.on('load', () => {
        console.log('🎉 Mapa carregat correctament!');
        clearTimeout(timeout); // Cancel·lar timeout quan el mapa es carrega
        setIsLoading(false);
        setMapError(null);
      });

      map.current.on('error', (e) => {
        console.error('❌ Error del mapa:', e);
        clearTimeout(timeout);
        setMapError('Error carregant el mapa');
        setIsLoading(false);
      });

      return () => {
        console.log('🧹 Netejant mapa...');
        clearTimeout(timeout);
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    } catch (error) {
      console.error('❌ Error inicialitzant mapa:', error);
      setMapError(`Error: ${error}`);
      setIsLoading(false);
    }
  }, [currentList]);

  // Carregar supermercats quan el mapa estigui llest i tinguem una llista
  useEffect(() => {
    console.log('🔍 useEffect supermercats - Estat:', {
      mapExists: !!map.current,
      isLoading,
      hasCurrentList: !!currentList,
      postalCode: currentList?.postalCode
    });

    if (!map.current || isLoading || !currentList?.postalCode) {
      console.log('⏸️ Sortint del useEffect supermercats - condicions no completes');
      return;
    }

    let cancelled = false;

    const loadRealSupermarkets = async () => {
      try {
        console.log(`🔍 Carregant supermercats reals per codi postal ${currentList.postalCode}...`);
        
        const realSupermarkets = await supermarketService.getAllNearbySupermarkets(currentList.postalCode);
        
        if (cancelled) {
          console.log('🚫 Request cancel·lat');
          return;
        }

        console.log(`📍 Trobats ${realSupermarkets.length} supermercats reals per ${currentList.postalCode}`);

        if (realSupermarkets.length === 0) {
          console.log('❌ No s\'han trobat supermercats a la zona');
          setMapError(`No s'han trobat supermercats a la zona ${currentList.postalCode}`);
          return;
        }

        setSupermarkets(realSupermarkets);

        // Neteja marcadors existents
        document.querySelectorAll('.mapbox-marker').forEach(el => el.remove());

        // Centrar mapa en la zona del codi postal si tenim supermercats
        if (realSupermarkets.length > 0 && map.current) {
          // Calcular centre de tots els supermercats
          const avgLat = realSupermarkets.reduce((sum: number, s: Supermarket) => sum + s.coordinates.lat, 0) / realSupermarkets.length;
          const avgLng = realSupermarkets.reduce((sum: number, s: Supermarket) => sum + s.coordinates.lng, 0) / realSupermarkets.length;
          
          console.log(`🎯 Centrant mapa a: [${avgLng}, ${avgLat}]`);
          map.current.flyTo({
            center: [avgLng, avgLat],
            zoom: 13
          });
        }

        // Afegir nous marcadors amb diferenciació segons si tenen productes assignats
        realSupermarkets.forEach(supermarket => {
          // Verificar si aquest supermercat té productes assignats a la llista actual
          const hasAssignedProducts = currentList.items.some(item => 
            item.supermarket?.id === supermarket.id
          );
          
          const el = document.createElement('div');
          el.className = 'mapbox-marker';
          
          // Usar different emojis/styles based on whether supermarket has assigned products
          if (hasAssignedProducts) {
            el.innerHTML = '🛒'; // Shopping cart for supermarkets with assigned products
            el.style.fontSize = '28px';
            el.classList.add('marker-with-products');
          } else {
            el.innerHTML = '🏪'; // Regular store emoji for supermarkets without products
            el.style.fontSize = '24px';
            el.classList.add('marker-without-products');
          }
          
          el.style.cursor = 'pointer';
          el.title = hasAssignedProducts 
            ? `${supermarket.name} - Té productes assignats` 
            : `${supermarket.name}`;

          el.onclick = () => {
            setSelectedSupermarket(supermarket);
            if (map.current) {
              map.current.flyTo({
                center: [supermarket.coordinates.lng, supermarket.coordinates.lat],
                zoom: 15
              });
            }
          };

          new mapboxgl.Marker(el)
            .setLngLat([supermarket.coordinates.lng, supermarket.coordinates.lat])
            .addTo(map.current!);
        });

        console.log(`✅ ${realSupermarkets.length} marcadors afegits al mapa`);

      } catch (error) {
        console.error(`❌ Error carregant supermercats per ${currentList.postalCode}:`, error);
        
        if (!cancelled) {
          setMapError(`Error carregant supermercats: ${error}`);
        }
      }
    };

    loadRealSupermarkets();

    return () => {
      cancelled = true;
    };
  }, [isLoading, currentList?.postalCode, currentList?.id, currentList?.items]); // Afegir dependències per actualitzar marcadors quan canvia la llista o els productes

  // Función para añadir producto al supermercado seleccionado
  const handleAddProductToSupermarket = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProductName.trim() || !selectedSupermarket || !currentList) {
      return;
    }

    // Crear el nuevo producto con el supermercado asignado
    const newItem = {
      done: false,
      task: newProductName.trim(),
      supermarket: {
        id: selectedSupermarket.id,
        name: selectedSupermarket.name,
        chain: selectedSupermarket.chain
      }
    };

    // Añadir el producto a la lista activa
    addItemToCurrentList(newItem);
    
    // Limpiar el input
    setNewProductName('');
    
    console.log(`✅ Producte "${newProductName.trim()}" afegit a ${selectedSupermarket.name}`);
  };

  if (!userProfile) {
    return (
      <NoListSelected
        pageTitle="Mapa de Supermercats"
        pageIcon="🗺️"
        description="Inicia sessió per veure el mapa dels supermercats de la teva zona."
        showCreateJoinButtons={false}
      />
    );
  }

  if (!currentList) {
    return (
      <NoListSelected
        pageTitle="Mapa de Supermercats"
        pageIcon="🗺️"
        description="Selecciona una llista amb codi postal per veure el mapa dels supermercats de la zona i poder afegir productes directament des del mapa."
      />
    );
  }

  if (mapError) {
    return (
      <div className="map-page">
        <div className="map-header">
          <h2>🗺️ Mapa de Supermercats</h2>
          <p>❌ Error: {mapError}</p>
          <button onClick={() => window.location.reload()}>🔄 Recarregar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-page">
      <div className="map-header">
        <h2>🗺️ Mapa de Supermercats</h2>
        <p>📍 Zona: {currentList.postalCode}</p>
        <p>📋 Llista: {currentList.name}</p>
        {isLoading && <p>⏳ Carregant mapa...</p>}
      </div>

      {/* Llegenda del mapa */}
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-icon">🏪</span>
          <span>Supermercats disponibles</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon legend-icon-large">🛒</span>
          <span>Amb productes assignats</span>
        </div>
      </div>

      <div className="map-container-wrapper" style={{ position: 'relative', width: '100%', height: '500px' }}>
        {isLoading && (
          <div className="map-loading" style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            zIndex: 1000,
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            Carregant mapa...
          </div>
        )}
        <div 
          ref={mapContainer} 
          className="map-container"
          style={{ width: '100%', height: '100%' }}
        />

        {selectedSupermarket && (
          <div className="supermarket-popup" style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'white',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 1000,
            minWidth: '280px',
            maxWidth: '350px'
          }}>
            <div className="popup-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>
                {currentList.items.some(item => item.supermarket?.id === selectedSupermarket.id) ? '🛒' : '🏪'} 
                {selectedSupermarket.name}
              </h3>
              <button onClick={() => setSelectedSupermarket(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="popup-content">
              <p style={{ margin: '5px 0' }}>📍 {selectedSupermarket.address}</p>
              
              {/* Formulario para añadir productos */}
              <div style={{ marginTop: '12px', marginBottom: '12px', padding: '10px', background: '#f0f8ff', borderRadius: '6px', border: '1px solid #e3f2fd' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#1976d2', fontWeight: '600' }}>
                  ➕ Afegir producte aquí
                </h5>
                <form onSubmit={handleAddProductToSupermarket} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Nom del producte..."
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1976d2'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  />
                  <button
                    type="submit"
                    disabled={!newProductName.trim()}
                    style={{
                      background: newProductName.trim() ? '#1976d2' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 10px',
                      cursor: newProductName.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    ➕
                  </button>
                </form>
              </div>
              
              {/* Mostrar productos assignados si n'hi ha */}
              {(() => {
                const assignedProducts = currentList.items.filter(item => 
                  item.supermarket?.id === selectedSupermarket.id
                );
                
                if (assignedProducts.length > 0) {
                  return (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#28a745' }}>
                        ✅ Productes assignats ({assignedProducts.length}):
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px' }}>
                        {assignedProducts.slice(0, 3).map(item => (
                          <li key={item.id} style={{ 
                            textDecoration: item.done ? 'line-through' : 'none',
                            color: item.done ? '#6c757d' : 'inherit'
                          }}>
                            {item.task} {item.done ? '✓' : ''}
                          </li>
                        ))}
                        {assignedProducts.length > 3 && (
                          <li style={{ fontStyle: 'italic', color: '#6c757d' }}>
                            ... i {assignedProducts.length - 3} més
                          </li>
                        )}
                      </ul>
                    </div>
                  );
                }
                return null;
              })()}
              
              <button 
                onClick={() => window.location.href = '/pendents'}
                style={{ 
                  background: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  marginTop: '10px',
                  width: '100%'
                }}
              >
                📋 Gestionar llista
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="map-info">
        <span>🏪 {supermarkets.length} supermercats</span>
        <span>🛒 {supermarkets.filter(s => currentList.items.some(item => item.supermarket?.id === s.id)).length} amb productes</span>
        <span>📝 {currentList.items.filter(item => !item.done).length} pendents</span>
        <span>✅ {currentList.items.filter(item => item.done).length} comprats</span>
      </div>
    </div>
  );
};

export default MapPage; 