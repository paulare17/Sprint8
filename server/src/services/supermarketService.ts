import { Supermarket, ISupermarket } from '../models/Supermarket';
import axios from 'axios';

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

interface SupermarketData {
  name: string;
  address: string;
  postalCode: string;
  chain?: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  source: 'geoapify' | 'manual' | 'mapbox';
}

class SupermarketService {
  private readonly geoapifyKey = process.env.GEOAPIFY_API_KEY;

  // 🎯 Mètode principal: obtenir supermercats amb cache intel·ligent
  async getSupermarketsByPostalCode(postalCode: string, forceRefresh: boolean = false): Promise<ISupermarket[]> {
    try {
      console.log(`🔍 Buscant supermercats per codi postal: ${postalCode}`);

      // 1. Comprovar cache si no forcem refresh
      if (!forceRefresh) {
        const cachedSupermarkets = await Supermarket.findByPostalCode(postalCode, 24); // 24h cache
        if (cachedSupermarkets.length > 0) {
          console.log(`✅ Trobats ${cachedSupermarkets.length} supermercats en cache`);
          return cachedSupermarkets;
        }
      }

      // 2. Si no hi ha cache o forcem refresh, obtenir de APIs externes
      console.log(`🌐 Obtenint supermercats frescos de APIs externes...`);
      const coordinates = await this.getCoordinatesFromPostalCode(postalCode);
      
      if (!coordinates) {
        throw new Error(`No s'han pogut obtenir coordenades per al codi postal: ${postalCode}`);
      }

      const freshSupermarkets = await this.fetchFromGeoapify(coordinates, postalCode);
      
      // 3. Guardar a MongoDB
      const savedSupermarkets = await this.saveSupermarkets(freshSupermarkets);
      
      console.log(`✅ Guardats ${savedSupermarkets.length} supermercats nous a MongoDB`);
      return savedSupermarkets;

    } catch (error) {
      console.error(`❌ Error obtenint supermercats per ${postalCode}:`, error);
      throw error;
    }
  }

  // 🌍 Buscar supermercats propers per coordenades
  async getSupermarketsNearby(lng: number, lat: number, maxDistance: number = 2000): Promise<ISupermarket[]> {
    try {
      console.log(`📍 Buscant supermercats propers a [${lng}, ${lat}] en un radi de ${maxDistance}m`);
      
      const nearbySupermarkets = await Supermarket.findNearby(lng, lat, maxDistance);
      
      // Afegir distància calculada a cada supermercat
      const supermarketsWithDistance = nearbySupermarkets.map((supermarket: ISupermarket) => {
        const distance = supermarket.getDistance(lng, lat);
        return {
          ...supermarket.toObject(),
          distance: Math.round(distance)
        };
      });

      console.log(`✅ Trobats ${supermarketsWithDistance.length} supermercats propers`);
      return supermarketsWithDistance.sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance);

    } catch (error) {
      console.error(`❌ Error buscant supermercats propers:`, error);
      throw error;
    }
  }

  // 📋 Obtenir coordenades d'un codi postal
  private async getCoordinatesFromPostalCode(postalCode: string): Promise<[number, number] | null> {
    if (!this.geoapifyKey) {
      throw new Error('Clau API de Geoapify no configurada. Afegeix GEOAPIFY_API_KEY al fitxer .env del servidor');
    }

    try {
      const response = await axios.get(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(postalCode)}&format=geojson&apiKey=${this.geoapifyKey}&filter=countrycode:es&type=postcode`
      );

      const data: GeoapifyResponse = response.data;
      
      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry?.coordinates;
        if (coordinates) {
          const [lng, lat] = coordinates;
          console.log(`📍 Coordenades obtingudes per ${postalCode}: [${lng}, ${lat}]`);
          return [lng, lat];
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error obtenint coordenades:', error);
      return null;
    }
  }

  // 🔍 Obtenir supermercats de Geoapify
  private async fetchFromGeoapify(coordinates: [number, number], postalCode: string): Promise<SupermarketData[]> {
    if (!this.geoapifyKey) {
      throw new Error('Clau API de Geoapify no configurada');
    }

    const supermarkets: SupermarketData[] = [];
    const [lng, lat] = coordinates;
    
    const categories = [
      'commercial.supermarket',
      'commercial.food',
      'commercial.marketplace'
    ];

    for (const category of categories) {
      try {
        const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lng},${lat},2000&bias=proximity:${lng},${lat}&limit=20&apiKey=${this.geoapifyKey}`;
        
        const response = await axios.get(url);
        const data: GeoapifyResponse = response.data;
        
        if (data.features) {
          for (const feature of data.features) {
            if (feature.geometry?.coordinates && feature.properties) {
              const [fLng, fLat] = feature.geometry.coordinates;
              const name = feature.properties.name || 'Supermercat';
              const address = feature.properties.formatted || 
                            feature.properties.address_line1 || 
                            'Adreça no disponible';
              
              const supermarketData: SupermarketData = {
                name,
                address,
                postalCode,
                location: {
                  type: 'Point',
                  coordinates: [fLng, fLat]
                },
                chain: this.extractChainFromName(name),
                source: 'geoapify'
              };
              
              supermarkets.push(supermarketData);
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error buscant categoria ${category}:`, error);
      }
    }

    // Eliminar duplicats
    return this.removeDuplicates(supermarkets);
  }

  // 💾 Guardar supermercats a MongoDB
  private async saveSupermarkets(supermarketsData: SupermarketData[]): Promise<ISupermarket[]> {
    const savedSupermarkets: ISupermarket[] = [];

    for (const data of supermarketsData) {
      try {
        // Comprovar si ja existeix (per coordenades similars)
        const existingSupermarket = await Supermarket.findOne({
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: data.location.coordinates
              },
              $maxDistance: 50 // 50 metres de tolerància
            }
          }
        });

        if (existingSupermarket) {
          // Actualitzar data d'última actualització
          existingSupermarket.lastUpdated = new Date();
          await existingSupermarket.save();
          savedSupermarkets.push(existingSupermarket);
        } else {
          // Crear nou supermercat
          const newSupermarket = new Supermarket(data);
          const saved = await newSupermarket.save();
          savedSupermarkets.push(saved);
        }
      } catch (error) {
        console.warn(`⚠️ Error guardant supermercat ${data.name}:`, error);
      }
    }

    return savedSupermarkets;
  }

  // 🏪 Afegir supermercat manual
  async addManualSupermarket(data: Omit<SupermarketData, 'source'>): Promise<ISupermarket> {
    try {
      const supermarketData: SupermarketData = {
        ...data,
        source: 'manual'
      };

      const newSupermarket = new Supermarket(supermarketData);
      const saved = await newSupermarket.save();
      
      console.log(`✅ Supermercat manual afegit: ${saved.name}`);
      return saved;
    } catch (error) {
      console.error(`❌ Error afegint supermercat manual:`, error);
      throw error;
    }
  }



  // 🧹 Utilities
  private extractChainFromName(name: string): string {
    const chains = ['Mercadona', 'Carrefour', 'Dia', 'Lidl', 'Aldi', 'Eroski', 'Condis', 'Caprabo', 'El Corte Inglés'];
    
    for (const chain of chains) {
      if (name.toLowerCase().includes(chain.toLowerCase())) {
        return chain;
      }
    }
    
    return 'Altres';
  }

  private removeDuplicates(supermarkets: SupermarketData[]): SupermarketData[] {
    const uniqueMap = new Map<string, SupermarketData>();
    
    supermarkets.forEach(supermarket => {
      const coordKey = `${Math.round(supermarket.location.coordinates[1] * 1000)}_${Math.round(supermarket.location.coordinates[0] * 1000)}`;
      
      if (!uniqueMap.has(coordKey) || 
          (uniqueMap.get(coordKey)!.name.length < supermarket.name.length)) {
        uniqueMap.set(coordKey, supermarket);
      }
    });
    
    return Array.from(uniqueMap.values());
  }

  // 📈 Estadístiques bàsiques
  async getSupermarketStats(): Promise<{ totalSupermarkets: number; chainDistribution: string[] }> {
    try {
      const stats = await Supermarket.aggregate([
        {
          $group: {
            _id: null,
            totalSupermarkets: { $sum: 1 },
            chainDistribution: {
              $push: '$chain'
            }
          }
        }
      ]);

      return stats[0] || { totalSupermarkets: 0, chainDistribution: [] };
    } catch (error) {
      console.error('❌ Error obtenint estadístiques:', error);
      throw error;
    }
  }
}

export const supermarketService = new SupermarketService(); 