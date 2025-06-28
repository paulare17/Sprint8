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

class SupermarketService {
  private readonly mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  private readonly geoapifyKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
  private readonly backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';



  private async getCoordinatesFromPostalCode(postalCode: string): Promise<[number, number] | null> {
    // Usar Geoapify com a API principal
    if (!this.geoapifyKey) {
      throw new Error('Clau API de Geoapify no configurada. Afegeix VITE_GEOAPIFY_API_KEY al fitxer .env');
    }

    try {
      const coordinates = await this.getCoordinatesFromGeoapify(postalCode);
      if (coordinates) {
        console.log(`✅ Coordenades obtingudes amb Geoapify: [${coordinates[0]}, ${coordinates[1]}]`);
        return coordinates;
      }
      
      throw new Error(`No s'han pogut obtenir coordenades per al codi postal: ${postalCode}`);
    } catch (error) {
      console.error('Error obtaining coordinates:', error);
      throw error;
    }
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
    } catch (error) {
      console.error('Error with Geoapify geocoding:', error);
      return null;
    }
  }





  async getAllNearbySupermarkets(postalCode: string): Promise<Supermarket[]> {
    try {
      console.log(`🌍 Obtenint supermercats per codi postal: ${postalCode} des del backend MongoDB`);
      
      // 1. Primer intentar obtenir del nostre backend MongoDB
      const response = await fetch(`${this.backendUrl}/api/supermarkets/postal/${postalCode}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Rebuts ${data.total} supermercats del backend MongoDB`);
        
        // Convertir format MongoDB al format frontend
        const supermarkets = data.data.map((s: any) => this.convertMongoToFrontend(s));
        return supermarkets.sort((a: Supermarket, b: Supermarket) => (a.distance || 0) - (b.distance || 0));
      }
      
      // 2. Si el backend falla, fallback al mètode original (Geoapify directe)
      console.warn('⚠️ Backend no disponible, utilitzant fallback a Geoapify directe');
      return await this.fallbackToDirectApi(postalCode);
      
    } catch (error) {
      console.error('❌ Error getting nearby supermarkets:', error);
      // 3. En cas d'error, intentar fallback
      try {
        return await this.fallbackToDirectApi(postalCode);
      } catch (fallbackError) {
        console.error('❌ Fallback també ha fallat:', fallbackError);
        return [];
      }
    }
  }



  // Buscar supermercats reals utilitzant Geoapify
  private async searchRealSupermarkets(coordinates: [number, number]): Promise<Supermarket[]> {
    if (!this.geoapifyKey) {
      throw new Error('Clau API de Geoapify no configurada. Afegeix VITE_GEOAPIFY_API_KEY al fitxer .env');
    }

    console.log(`🔑 Utilitzant Geoapify per cercar supermercats...`);
    
    try {
      const geoapifyResults = await this.searchWithGeoapify(coordinates);
      console.log(`🌍 Geoapify trobat: ${geoapifyResults.length} supermercats`);
      
      if (geoapifyResults.length === 0) {
        throw new Error('No s\'han trobat supermercats a la zona especificada');
      }

      // Eliminar duplicats basats en coordenades similars
      const uniqueSupermarkets = this.removeDuplicateSupermarkets(geoapifyResults);
      
      console.log(`🧹 Després d'eliminar duplicats: ${uniqueSupermarkets.length} supermercats únics`);
      
      const finalResults = uniqueSupermarkets.slice(0, 30); // Limitar a 15 resultats
      console.log(`📋 Resultat final: ${finalResults.length} supermercats per retornar`);
      
      return finalResults;
    } catch (error) {
      console.error('❌ Error cercant supermercats:', error);
      throw error;
    }
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
          console.warn(`Geoapify request failed for category ${category}:`, response.status);
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
      } catch (error) {
        console.warn(`Error searching Geoapify category ${category}:`, error);
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
  private convertMongoToFrontend(mongoSupermarket: any): Supermarket {
    return {
      id: mongoSupermarket._id || mongoSupermarket.id,
      _id: mongoSupermarket._id,
      name: mongoSupermarket.name,
      address: mongoSupermarket.address,
      coordinates: {
        lat: mongoSupermarket.location.coordinates[1], // MongoDB usa [lng, lat]
        lng: mongoSupermarket.location.coordinates[0]
      },
      distance: mongoSupermarket.distance,
      chain: mongoSupermarket.chain,
      postalCode: mongoSupermarket.postalCode,
      source: mongoSupermarket.source,
      lastUpdated: mongoSupermarket.lastUpdated ? new Date(mongoSupermarket.lastUpdated) : undefined
    };
  }

  // 🔄 Fallback al mètode original (Geoapify directe)
  private async fallbackToDirectApi(postalCode: string): Promise<Supermarket[]> {
    console.log(`🔄 Utilitzant fallback: cridar directament a Geoapify per ${postalCode}`);
    
    const coordinates = await this.getCoordinatesFromPostalCode(postalCode);
    
    if (!coordinates) {
      console.error(`❌ No s'han pogut obtenir coordenades per al codi postal: ${postalCode}`);
      throw new Error('Codi postal no vàlid');
    }
    
    console.log(`📍 Coordenades obtingudes: [${coordinates[0]}, ${coordinates[1]}]`);
    
    // Obtenir supermercats reals de Geoapify
    const realSupermarkets = await this.searchRealSupermarkets(coordinates);
    
    console.log(`✅ Total supermercats trobats amb fallback: ${realSupermarkets.length}`);
    
    return realSupermarkets.sort((a: Supermarket, b: Supermarket) => (a.distance || 0) - (b.distance || 0));
  }

  // 🔄 Forçar actualització del cache del backend
  async refreshSupermarketsCache(postalCode: string): Promise<Supermarket[]> {
    try {
      console.log(`🔄 Forçant actualització del cache per ${postalCode}`);
      
      const response = await fetch(`${this.backendUrl}/api/supermarkets/refresh/${postalCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Cache actualitzat: ${data.total} supermercats`);
        
        return data.data.map((s: any) => this.convertMongoToFrontend(s));
      }
      
      throw new Error('Error actualitzant cache');
    } catch (error) {
      console.error('❌ Error forçant actualització cache:', error);
      throw error;
    }
  }

  // ⭐ Actualitzar rating d'un supermercat
  async updateSupermarketRating(supermarketId: string, rating: number): Promise<boolean> {
    try {
      console.log(`⭐ Actualitzant rating del supermercat ${supermarketId}: ${rating}`);
      
      const response = await fetch(`${this.backendUrl}/api/supermarkets/${supermarketId}/rating`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating })
      });
      
      if (response.ok) {
        console.log(`✅ Rating actualitzat correctament`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error actualitzant rating:', error);
      return false;
    }
  }

  // 📊 Registrar visita a un supermercat
  async recordSupermarketVisit(supermarketId: string): Promise<boolean> {
    try {
      console.log(`📊 Registrant visita al supermercat ${supermarketId}`);
      
      const response = await fetch(`${this.backendUrl}/api/supermarkets/${supermarketId}/visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log(`✅ Visita registrada correctament`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error registrant visita:', error);
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
      console.log(`🏪 Afegint supermercat manual: ${supermarketData.name}`);
      
      const response = await fetch(`${this.backendUrl}/api/supermarkets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(supermarketData)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Supermercat manual afegit correctament`);
        return this.convertMongoToFrontend(data.data);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error afegint supermercat manual:', error);
      return null;
    }
  }

  // 🔍 Buscar supermercats per nom
  async searchSupermarkets(query: string, postalCode?: string): Promise<Supermarket[]> {
    try {
      console.log(`🔍 Buscant supermercats: "${query}"`);
      
      const params = new URLSearchParams({ q: query });
      if (postalCode) {
        params.append('postalCode', postalCode);
      }
      
      const response = await fetch(`${this.backendUrl}/api/supermarkets/search?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Trobats ${data.total} supermercats`);
        
        return data.data.map((s: any) => this.convertMongoToFrontend(s));
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error buscant supermercats:', error);
      return [];
    }
  }

  // 📈 Obtenir estadístiques dels supermercats
  async getSupermarketStats(): Promise<any> {
    try {
      console.log(`📈 Obtenint estadístiques dels supermercats`);
      
      const response = await fetch(`${this.backendUrl}/api/supermarkets/stats`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Estadístiques obtingudes`);
        return data.data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error obtenint estadístiques:', error);
      return null;
    }
  }
}

export const supermarketService = new SupermarketService(); 