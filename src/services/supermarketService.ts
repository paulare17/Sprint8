export interface Supermarket {
  id: string;
  _id?: string; // MongoDB ID
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distance?: number;
  rating?: number;
  chain?: string;
  price?: number;
  hasProduct?: boolean;
  // Noves propietats de MongoDB
  postalCode?: string;
  source?: 'geoapify' | 'manual' | 'mapbox';
  lastUpdated?: Date;
}

interface MongoSupermarket {
  _id?: string;
  id?: string;
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  location?: {
    coordinates: [number, number];
  };
  distance?: number;
  rating?: number;
  chain?: string;
  postalCode?: string;
  source?: string;
  lastUpdated?: Date;
}

interface GeoapifyFeature {
  properties?: {
    name?: string;
    formatted?: string;
    address_line1?: string;
    address_line2?: string;
    categories?: string[];
    datasource?: {
      sourcename?: string;
    };
  };
  geometry?: {
    coordinates?: [number, number];
  };
}

interface GeoapifyResponse {
  features?: GeoapifyFeature[];
}

class SupermarketService {
  // Configuration para desarrollo y producción
  private readonly isDev = import.meta.env.DEV;
  private readonly geoapifyKey = import.meta.env.VITE_GEOAPIFY_API_KEY || this.getEnvKey();

  // 🔑 Fallback para obtener la clau API
  private getEnvKey(): string | undefined {
    // Prova variables d'entorn del sistema (per desenvolupament local)
    if (typeof process !== 'undefined' && process.env?.VITE_GEOAPIFY_API_KEY) {
      return process.env.VITE_GEOAPIFY_API_KEY;
    }
    
    return undefined;
  }

  // 🎯 Método principal: obtener supermercados por código postal
  async getAllNearbySupermarkets(postalCode: string): Promise<Supermarket[]> {
    console.log('🔧 Configuració:', {
      isDev: this.isDev,
      hasGeoapifyKey: !!this.geoapifyKey,
      keyLength: this.geoapifyKey?.length || 0,
      postalCode
    });

    // Sempre usar Geoapify directament si tenim la clau API
    if (this.geoapifyKey) {
      console.log('🔍 Usant Geoapify directament...');
      try {
        const result = await this.getFromGeoapifyDirect(postalCode);
        console.log('✅ Resultat final:', result.length, 'supermercats');
        return result;
      } catch (error) {
        console.error('❌ Error amb Geoapify:', error);
        return [];
      }
    }

    console.warn('❌ No hi ha clau API de Geoapify configurada');
    return [];
  }



  // 🔍 Obtener supermercatos directamente de Geoapify
  private async getFromGeoapifyDirect(postalCode: string): Promise<Supermarket[]> {
    if (!this.geoapifyKey) {
      console.warn('❌ VITE_GEOAPIFY_API_KEY no està configurada');
      return [];
    }

    try {
      console.log('🌍 Obtenint coordenades per codi postal:', postalCode);
      
      // 1. Obtener coordenadas del código postal
      const coordinates = await this.getCoordinatesFromPostalCode(postalCode);
      if (!coordinates) {
        console.warn('⚠️ No s\'han pogut obtenir coordenades per:', postalCode);
        return [];
      }

      console.log('📍 Coordenades obtingudes:', coordinates);

      // 2. Buscar supermercados cercanos
      const supermarkets = await this.fetchSupermarketsFromGeoapify(coordinates, postalCode);
      
      console.log('🏪 Supermercats trobats:', supermarkets.length);
      return supermarkets;
    } catch (error) {
      console.error('❌ Error cridant Geoapify:', error);
      return [];
    }
  }

  // 📍 Obtener coordenadas de un código postal
  private async getCoordinatesFromPostalCode(postalCode: string): Promise<[number, number] | null> {
    try {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(postalCode)}&format=geojson&apiKey=${this.geoapifyKey}&filter=countrycode:es&type=postcode`;
      
      console.log('🌍 Cridant geocoding URL:', url.replace(this.geoapifyKey!, 'API_KEY_HIDDEN'));
      
      const response = await fetch(url);
      
      console.log('📡 Resposta geocoding:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error geocoding response:', errorText);
        throw new Error(`Error geocoding: ${response.status} - ${errorText}`);
      }

      const data: GeoapifyResponse = await response.json();
      console.log('📍 Dades geocoding:', data);
      
      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry?.coordinates;
        if (coordinates) {
          const [lng, lat] = coordinates;
          console.log('✅ Coordenades trobades:', { lng, lat });
          return [lng, lat];
        }
      }
      
      console.warn('⚠️ No s\'han trobat coordenades per al codi postal');
      return null;
    } catch (error) {
      console.error('❌ Error obtenint coordenades:', error);
      return null;
    }
  }

  // 🏪 Buscar supermercados en Geoapify
  private async fetchSupermarketsFromGeoapify(coordinates: [number, number], postalCode: string): Promise<Supermarket[]> {
    const supermarkets: Supermarket[] = [];
    const [lng, lat] = coordinates;
    
    const categories = [
      'commercial.supermarket',
      'commercial.food',
      'commercial.marketplace'
    ];

    console.log('🔍 Cercant supermercats per categories:', categories);

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      try {
        const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lng},${lat},2000&bias=proximity:${lng},${lat}&limit=20&apiKey=${this.geoapifyKey}`;
        
        console.log(`📡 Cridant categoria ${i + 1}/${categories.length}: ${category}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          console.warn(`⚠️ Error HTTP ${response.status} per categoria ${category}`);
          continue;
        }
        
        const data: GeoapifyResponse = await response.json();
        console.log(`✅ Resposta categoria ${category}:`, data.features?.length || 0, 'resultats');
        
        if (data.features) {
          for (const feature of data.features) {
            if (feature.geometry?.coordinates && feature.properties) {
              const [fLng, fLat] = feature.geometry.coordinates;
              const name = feature.properties.name || 'Supermercat';
              const address = feature.properties.formatted || 
                            feature.properties.address_line1 || 
                            'Adreça no disponible';
              
              // Calcular distancia
              const distance = this.calculateDistance(lat, lng, fLat, fLng);
              
              const supermarket: Supermarket = {
                id: `geoapify_${fLng}_${fLat}`,
                name,
                address,
                coordinates: { lat: fLat, lng: fLng },
                distance: Math.round(distance),
                chain: this.extractChainFromName(name),
                postalCode,
                source: 'geoapify'
              };
              
              supermarkets.push(supermarket);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error en categoria ${category}:`, error);
      }
    }

    console.log('🏪 Total supermercats abans de netejar duplicats:', supermarkets.length);

    // Eliminar duplicados y ordenar por distancia
    const unique = this.removeDuplicates(supermarkets);
    console.log('✨ Supermercats finals després de netejar:', unique.length);
    
    return unique.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  // 🧮 Calcular distancia entre dos puntos (fórmula Haversine)
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // 🏷️ Extraer cadena del nombre
  private extractChainFromName(name: string): string {
    const chains = ['Mercadona', 'Carrefour', 'Dia', 'Lidl', 'Aldi', 'Eroski', 'Condis', 'Caprabo', 'El Corte Inglés'];
    
    for (const chain of chains) {
      if (name.toLowerCase().includes(chain.toLowerCase())) {
        return chain;
      }
    }
    
    return 'Altres';
  }

  // 🧹 Eliminar duplicados
  private removeDuplicates(supermarkets: Supermarket[]): Supermarket[] {
    const uniqueMap = new Map<string, Supermarket>();
    
    supermarkets.forEach(supermarket => {
      const coordKey = `${Math.round(supermarket.coordinates.lat * 1000)}_${Math.round(supermarket.coordinates.lng * 1000)}`;
      
      if (!uniqueMap.has(coordKey) || 
          (uniqueMap.get(coordKey)!.name.length < supermarket.name.length)) {
        uniqueMap.set(coordKey, supermarket);
      }
    });
    
    return Array.from(uniqueMap.values());
  }



  // 🌍 Buscar supermercados por coordenadas
  async getSupermarketsByCoordinates(lng: number, lat: number, maxDistance: number = 2000): Promise<Supermarket[]> {
    try {
      // Si tenemos API key, usar Geoapify directamente
      if (this.geoapifyKey) {
        return await this.fetchSupermarketsFromGeoapify([lng, lat], 'coordenades');
      }

      // Fallback: API de Vercel
      const response = await fetch(`/api/supermarkets/nearby?lng=${lng}&lat=${lat}&maxDistance=${maxDistance}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.data.map((s: MongoSupermarket) => this.convertMongoToFrontend(s));
      }
      
      throw new Error(`Error obtaining supermarkets nearby: ${response.status}`);
      
    } catch (error) {
      console.error('Error obtaining supermarkets nearby:', error);
      return [];
    }
  }

  // 🔍 Buscar supermercados por nombre
  async searchSupermarkets(query: string, postalCode?: string): Promise<Supermarket[]> {
    try {
      const url = new URL(`/api/supermarkets/search`, window.location.origin);
      url.searchParams.append('q', query);
      if (postalCode) {
        url.searchParams.append('postalCode', postalCode);
      }

      const response = await fetch(url.toString());
      
      if (response.ok) {
        const data: { data: MongoSupermarket[] } = await response.json();
        return data.data.map((s: MongoSupermarket) => this.convertMongoToFrontend(s));
      }

      return [];
    } catch (error) {
      console.error('Error cercant supermercats:', error);
      return [];
    }
  }

  // 🏷️ Filtrar supermercados por cadena
  getSupermarketsByChain(supermarkets: Supermarket[], chain: string): Supermarket[] {
    if (chain === 'Tots') {
      return supermarkets;
    }
    return supermarkets.filter(s => s.chain === chain);
  }

  // 🔄 Convertir formato MongoDB al formato frontend
  private convertMongoToFrontend(mongoSupermarket: MongoSupermarket): Supermarket {
    const location = mongoSupermarket.location;
    const coords = mongoSupermarket.coordinates;
    
    let lat = 0, lng = 0;
    
    if (location?.coordinates) {
      [lng, lat] = location.coordinates;
    } else if (coords) {
      lat = coords.lat;
      lng = coords.lng;
    }

    return {
      id: mongoSupermarket._id || mongoSupermarket.id || 'unknown',
      _id: mongoSupermarket._id,
      name: mongoSupermarket.name,
      address: mongoSupermarket.address,
      coordinates: { lat, lng },
      distance: mongoSupermarket.distance,
      rating: mongoSupermarket.rating,
      chain: mongoSupermarket.chain || 'Altres',
      postalCode: mongoSupermarket.postalCode,
      source: mongoSupermarket.source as 'geoapify' | 'manual' | 'mapbox',
      lastUpdated: mongoSupermarket.lastUpdated ? new Date(mongoSupermarket.lastUpdated) : undefined
    };
  }
}

export const supermarketService = new SupermarketService(); 