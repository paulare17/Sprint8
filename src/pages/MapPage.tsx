import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useAuth } from '../contexts/AuthContext';
import { useShoppingList } from '../contexts/ShoppingListContext';
import { supermarketService, type Supermarket } from '../services/supermarketService';

// Import Mapbox CSS
import 'mapbox-gl/dist/mapbox-gl.css';

const MapPage: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { userProfile } = useAuth();
  const { currentList } = useShoppingList();
  
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [selectedSupermarket, setSelectedSupermarket] = useState<Supermarket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

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

        // Afegir nous marcadors
        realSupermarkets.forEach(supermarket => {
          const el = document.createElement('div');
          el.className = 'mapbox-marker';
          el.innerHTML = '🏪';
          el.style.fontSize = '24px';
          el.style.cursor = 'pointer';
          el.title = `${supermarket.name} - ${supermarket.distance}m`;
          


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
  }, [isLoading, currentList?.postalCode]); // Usar postalCode en lloc de id per detectar canvis de zona


  if (!userProfile) {
    return (
      <div className="map-page">
        <div className="map-auth-required">
          <h3>Inicia sessió per veure el mapa</h3>
        </div>
      </div>
    );
  }

  if (!currentList) {
    return (
      <div className="map-page">
        <div className="map-header">
          <h2>🗺️ Mapa de Supermercats</h2>
          <p>⚠️ Selecciona una llista per veure el mapa</p>
        </div>
      </div>
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
            minWidth: '250px'
          }}>
            <div className="popup-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>🏪 {selectedSupermarket.name}</h3>
              <button onClick={() => setSelectedSupermarket(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="popup-content">
              <p style={{ margin: '5px 0' }}>📍 {selectedSupermarket.address}</p>
              <p style={{ margin: '5px 0' }}>📏 {selectedSupermarket.distance}m</p>
              <button 
                onClick={() => window.location.href = '/pendents'}
                style={{ 
                  background: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                📋 Afegir productes
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="map-info">
        <p>🏪 {supermarkets.length} supermercats trobats</p>
        <p>📝 {currentList.items.filter(item => !item.done).length} productes pendents</p>

      </div>
    </div>
  );
};

export default MapPage; 