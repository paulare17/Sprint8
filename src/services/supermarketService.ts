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

class SupermarketService {
  // En desarrollo apunta a localhost, en producción a Vercel
  private readonly backendUrl = import.meta.env.VITE_BACKEND_URL || 
    (import.meta.env.DEV ? 'http://localhost:3000' : '');

  // 🎯 Método principal: obtener supermercados por código postal
  async getAllNearbySupermarkets(postalCode: string): Promise<Supermarket[]> {
    try {
      const response = await fetch(`${this.backendUrl}/api/supermarkets/postal/${postalCode}`);
      
      if (response.ok) {
        const data = await response.json();
        const supermarkets = data.data.map((s: MongoSupermarket) => this.convertMongoToFrontend(s));
        return supermarkets.sort((a: Supermarket, b: Supermarket) => (a.distance || 0) - (b.distance || 0));
      }
      
      throw new Error(`Error obtenint supermercats: ${response.status}`);
      
    } catch (error) {
      console.error('Error obtenint supermercats:', error);
      return [];
    }
  }

  // 🌍 Buscar supermercados por coordenadas
  async getSupermarketsByCoordinates(lng: number, lat: number, maxDistance: number = 2000): Promise<Supermarket[]> {
    try {
      const response = await fetch(`${this.backendUrl}/api/supermarkets/nearby?lng=${lng}&lat=${lat}&maxDistance=${maxDistance}`);
      
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

  // 🔄 Forzar actualización del cache
  async refreshSupermarketsCache(postalCode: string): Promise<Supermarket[]> {
    try {
      const response = await fetch(`${this.backendUrl}/api/supermarkets/postal/${postalCode}?forceRefresh=true`);

      if (response.ok) {
        const data = await response.json();
        return data.data.map((s: MongoSupermarket) => this.convertMongoToFrontend(s));
      }

      throw new Error('Error actualitzant cache');
    } catch (error) {
      console.error('Error actualitzant cache:', error);
      return [];
    }
  }

  // ⭐ Actualizar rating de un supermercado
  async updateSupermarketRating(supermarketId: string, rating: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/api/supermarkets/${supermarketId}/rating`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error actualitzant rating:', error);
      return false;
    }
  }

  // 📊 Registrar visita a un supermercado
  async recordSupermarketVisit(supermarketId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/api/supermarkets/${supermarketId}/visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error registrant visita:', error);
      return false;
    }
  }

  // 🏪 Añadir supermercado manual
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
      const response = await fetch(`${this.backendUrl}/api/supermarkets`, {
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
    } catch (error) {
      console.error('Error afegint supermercat:', error);
      return null;
    }
  }

  // 🔍 Buscar supermercados por nombre
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
    } catch (error) {
      console.error('Error cercant supermercats:', error);
      return [];
    }
  }

  // 📈 Obtener estadísticas de supermercados
  async getSupermarketStats(): Promise<{ totalSupermarkets: number; chainDistribution: string[] }> {
    try {
      const response = await fetch(`${this.backendUrl}/api/supermarkets/stats`);
      
      if (response.ok) {
        const data = await response.json();
        return data.data;
      }

      return { totalSupermarkets: 0, chainDistribution: [] };
    } catch (error) {
      console.error('Error obtaining statistics:', error);
      return { totalSupermarkets: 0, chainDistribution: [] };
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