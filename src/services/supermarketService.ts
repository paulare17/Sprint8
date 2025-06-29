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

class SupermarketService {
  private readonly mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  private readonly geoapifyKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
  private readonly backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';



  private async getCoordinatesFromPostalCode(postalCode: string): Promise<[number, number] | null> {
    if (!this.geoapifyKey) {
      throw new Error('Clau API de Geoapify no configurada. Afegeix VITE_GEOAPIFY_API_KEY al fitxer .env');
    }

    const coordinates = await this.getCoordinatesFromGeoapify(postalCode);
    if (coordinates) {
      return coordinates;
    }
    
    throw new Error(`No s'han pogut obtenir coordenades per al codi postal: ${postalCode}`);
  }

  private async getCoordinatesFromGeoapify(postalCode: string): Promise<[number, number] | null> {
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(postalCode)}&format=geojson&apiKey=${this.geoapifyKey}&filter=countrycode:es&type=postcode`
      );
      
      if (!response.ok) {
        throw new Error('Geoapify geocoding failed');
      }

      const data: GeoapifyResponse = await response.json();
      
      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry?.coordinates;
        if (coordinates) {
          const [lng, lat] = coordinates;
          return [lng, lat];
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }





  async getAllNearbySupermarkets(postalCode: string): Promise<Supermarket[]> {
    try {
      // 1. Primer intentar obtenir del nostre backend MongoDB
      const response = await fetch(`${this.backendUrl}/api/supermarkets/postal/${postalCode}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Convertir format MongoDB al format frontend
        const supermarkets = data.data.map((s: unknown) => this.convertMongoToFrontend(s));
        return supermarkets.sort((a: Supermarket, b: Supermarket) => (a.distance || 0) - (b.distance || 0));
      }
      
      // 2. Si el backend falla, fallback al mètode original (Geoapify directe)
      return await this.fallbackToDirectApi(postalCode);
      
    } catch {
      // 3. En cas d'error, intentar fallback
      try {
        return await this.fallbackToDirectApi(postalCode);
      } catch {
        return [];
      }
    }
  }



  // Buscar supermercats reals utilitzant Geoapify
  private async searchRealSupermarkets(coordinates: [number, number]): Promise<Supermarket[]> {
    if (!this.geoapifyKey) {
      throw new Error('Clau API de Geoapify no configurada. Afegeix VITE_GEOAPIFY_API_KEY al fitxer .env');
    }
    
    const geoapifyResults = await this.searchWithGeoapify(coordinates);
    
    if (geoapifyResults.length === 0) {
      throw new Error('No s\'han trobat supermercats a la zona especificada');
    }

    // Eliminar duplicats basats en coordenades similars
    const uniqueSupermarkets = this.removeDuplicateSupermarkets(geoapifyResults);
    
    const finalResults = uniqueSupermarkets.slice(0, 30); // Limitar a 15 resultats
    
    return finalResults;
  }



  private async searchWithGeoapify(coordinates: [number, number]): Promise<Supermarket[]> {
    const supermarkets: Supermarket[] = [];
    const [lng, lat] = coordinates;
    
    // Categories de Geoapify per supermercats
    const categories = [
      'commercial.supermarket',
      'commercial.food',
      'commercial.marketplace'
    ];

    for (const category of categories) {
      try {
        const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lng},${lat},2000&bias=proximity:${lng},${lat}&limit=20&apiKey=${this.geoapifyKey}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          continue;
        }

        const data: GeoapifyResponse = await response.json();
        
        if (data.features) {
          for (const feature of data.features) {
            if (feature.geometry?.coordinates && feature.properties) {
              const [fLng, fLat] = feature.geometry.coordinates;
              const name = feature.properties.name || 'Supermercat';
              const address = feature.properties.formatted || 
                            feature.properties.address_line1 || 
                            'Adreça no disponible';
              
              const distance = this.calculateDistance(lat, lng, fLat, fLng);
              
              const supermarket: Supermarket = {
                id: `geoapify-${fLng}-${fLat}`,
                name,
                address,
                coordinates: { lat: fLat, lng: fLng },
                distance,
                chain: this.extractChainFromName(name)
              };
              
              supermarkets.push(supermarket);
            }
          }
        }
      } catch {
        // Ignorar errors en categories específiques
      }
    }

    return supermarkets;
  }



  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // metres
  }

  private extractChainFromName(name: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('mercadona')) return 'Mercadona';
    if (lowerName.includes('carrefour')) return 'Carrefour';
    if (lowerName.includes('dia')) return 'DIA';
    if (lowerName.includes('lidl')) return 'Lidl';
    if (lowerName.includes('aldi')) return 'Aldi';
    if (lowerName.includes('eroski')) return 'Eroski';
    if (lowerName.includes('condis')) return 'Condis';
    if (lowerName.includes('caprabo')) return 'Caprabo';
    if (lowerName.includes('alcampo')) return 'Alcampo';
    if (lowerName.includes('hipercor')) return 'Hipercor';
    
    return 'Supermercat';
  }

  private removeDuplicateSupermarkets(supermarkets: Supermarket[]): Supermarket[] {
    const uniqueMap = new Map<string, Supermarket>();
    
    supermarkets.forEach(supermarket => {
      // Crear una clau basada en coordenades arrodonides
      const coordKey = `${Math.round(supermarket.coordinates.lat * 1000)}_${Math.round(supermarket.coordinates.lng * 1000)}`;
      
      // Si no existeix o la nova entrada té més informació, la guardem
      if (!uniqueMap.has(coordKey) || 
          (uniqueMap.get(coordKey)!.name.length < supermarket.name.length)) {
        uniqueMap.set(coordKey, supermarket);
      }
    });
    
    return Array.from(uniqueMap.values());
  }

  // Mètode per obtenir supermercats per cadena específica
  getSupermarketsByChain(supermarkets: Supermarket[], chain: string): Supermarket[] {
    return supermarkets.filter(s => s.chain === chain);
  }

  // 🔄 Convertir format MongoDB al format frontend
  private convertMongoToFrontend(mongoSupermarket: unknown): Supermarket {
    const mongo = mongoSupermarket as MongoSupermarket;
    return {
      id: mongo._id || mongo.id || '',
      name: mongo.name || '',
      address: mongo.address || '',
      coordinates: mongo.coordinates || {
        lat: mongo.location?.coordinates[1] || 0,
        lng: mongo.location?.coordinates[0] || 0
      },
      distance: mongo.distance,
      rating: mongo.rating,
      chain: mongo.chain,
      postalCode: mongo.postalCode,
      source: mongo.source as 'geoapify' | 'manual' | 'mapbox' | undefined,
      lastUpdated: mongo.lastUpdated
    };
  }

  // 🔄 Fallback al mètode original (Geoapify directe)
  private async fallbackToDirectApi(postalCode: string): Promise<Supermarket[]> {
    const coordinates = await this.getCoordinatesFromPostalCode(postalCode);
    if (!coordinates) {
      throw new Error(`No s'han pogut obtenir coordenades per al codi postal: ${postalCode}`);
    }

    const realSupermarkets = await this.searchRealSupermarkets(coordinates);
    
    return realSupermarkets.slice(0, 20);
  }

  // 🔄 Forçar actualització del cache del backend
  async refreshSupermarketsCache(postalCode: string): Promise<Supermarket[]> {
    const response = await fetch(`${this.backendUrl}/api/supermarkets/postal/${postalCode}?forceRefresh=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.data.map((s: unknown) => this.convertMongoToFrontend(s));
    }

    throw new Error('Error actualitzant cache');
  }

  // ⭐ Actualitzar rating d'un supermercat
  async updateSupermarketRating(supermarketId: string, rating: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/api/supermarkets/${supermarketId}/rating`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });

      if (response.ok) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  // 📊 Registrar visita a un supermercat
  async recordSupermarketVisit(supermarketId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/api/supermarkets/${supermarketId}/visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  // 🏪 Afegir supermercat manual
  async addManualSupermarket(supermarketData: {
    name: string;
    address: string;
    postalCode: string;
    chain?: string;
    lng: number;
    lat: number;
    rating?: number;
  }): Promise<Supermarket | null> {
    try {
      const response = await fetch(`${this.backendUrl}/api/supermarkets/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supermarketData),
      });

      if (response.ok) {
        const data: MongoSupermarket = await response.json();
        return this.convertMongoToFrontend(data);
      }

      return null;
    } catch {
      return null;
    }
  }

  // 🔍 Buscar supermercats per nom
  async searchSupermarkets(query: string, postalCode?: string): Promise<Supermarket[]> {
    try {
      const url = new URL(`${this.backendUrl}/api/supermarkets/search`);
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
    } catch {
      return [];
    }
  }

  // 📈 Obtenir estadístiques dels supermercats
  async getSupermarketStats(): Promise<{ totalSupermarkets: number; chainDistribution: string[] }> {
    try {
      const response = await fetch(`${this.backendUrl}/api/supermarkets/stats`);
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }

      return { totalSupermarkets: 0, chainDistribution: [] };
    } catch {
      return { totalSupermarkets: 0, chainDistribution: [] };
    }
  }
}

export const supermarketService = new SupermarketService(); 