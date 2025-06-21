export interface Supermarket {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [lng, lat]
  distance?: number;
  rating?: number;
  types: string[];
}

class SupermarketService {
  async searchSupermarkets(postalCode: string): Promise<Supermarket[]> {
    try {
      const coordinates = await this.getCoordinatesFromPostalCode(postalCode);
      if (!coordinates) {
        throw new Error('Codi postal no vàlid');
      }

      return this.findNearbySupermakerts(coordinates);
    } catch (error) {
      console.error('Error searching supermarkets:', error);
      return [];
    }
  }

  private async getCoordinatesFromPostalCode(postalCode: string): Promise<[number, number] | null> {
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    if (!mapboxToken) {
      console.warn('Mapbox token not found, using mock coordinates');
      return this.getMockCoordinates(postalCode);
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(postalCode)}.json?country=ES&types=postcode&access_token=${mapboxToken}`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return [lng, lat];
      }
      
      return this.getMockCoordinates(postalCode);
    } catch (error) {
      console.error('Error with Mapbox geocoding:', error);
      return this.getMockCoordinates(postalCode);
    }
  }

  private getMockCoordinates(postalCode: string): [number, number] | null {
    const postalCodeMap: Record<string, [number, number]> = {
      '08001': [2.1734, 41.3851], // Barcelona Centre
      '08002': [2.1825, 41.3886], // Barcelona Eixample
      '08003': [2.1825, 41.3886], // Barcelona Sant Pere
      '08080': [2.1734, 41.3851], // Barcelona genèric
    };

    return postalCodeMap[postalCode] || null;
  }

  private async findNearbySupermakerts(coordinates: [number, number]): Promise<Supermarket[]> {
    const mockSupermarkets: Supermarket[] = [
      {
        id: 'mercadona_1',
        name: 'Mercadona',
        address: 'Carrer Gran de Gràcia, 15, Barcelona',
        coordinates: [coordinates[0] + 0.001, coordinates[1] + 0.001],
        distance: 200,
        rating: 4.2,
        types: ['grocery_or_supermarket', 'food', 'establishment']
      },
      {
        id: 'carrefour_1', 
        name: 'Carrefour Express',
        address: 'Passeig de Gràcia, 45, Barcelona',
        coordinates: [coordinates[0] - 0.002, coordinates[1] + 0.003],
        distance: 350,
        rating: 3.8,
        types: ['grocery_or_supermarket', 'food', 'establishment']
      },
      {
        id: 'dia_1',
        name: 'Supermercados DIA',
        address: 'Carrer de Valencia, 123, Barcelona',
        coordinates: [coordinates[0] + 0.003, coordinates[1] - 0.001],
        distance: 150,
        rating: 3.5,
        types: ['grocery_or_supermarket', 'food', 'establishment']
      }
    ];

    return mockSupermarkets.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }
}

export const supermarketService = new SupermarketService(); 