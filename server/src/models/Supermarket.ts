import mongoose, { Schema, Document, Model } from 'mongoose';

// Interfície per mètodes estàtics
interface ISupermarketModel extends Model<ISupermarket> {
  findNearby(lng: number, lat: number, maxDistance?: number): Promise<ISupermarket[]>;
  findByPostalCode(postalCode: string, maxAge?: number): Promise<ISupermarket[]>;
}

export interface ISupermarket extends Document {
  name: string;
  address: string;
  postalCode: string;
  chain?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  // Metadades essencials
  source: 'geoapify' | 'manual' | 'mapbox';
  lastUpdated: Date;
  // Mètodes d'instància
  getDistance(userLng: number, userLat: number): number;
}

const SupermarketSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  postalCode: {
    type: String,
    required: true,
    index: true
  },
  chain: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere' // Índex geoespacial per queries eficients
    }
  },
  // Metadades essencials
  source: {
    type: String,
    enum: ['geoapify', 'manual', 'mapbox'],
    required: true,
    default: 'geoapify'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índexs optimitzats per queries essencials
SupermarketSchema.index({ postalCode: 1, lastUpdated: -1 });
SupermarketSchema.index({ chain: 1, postalCode: 1 });
SupermarketSchema.index({ location: '2dsphere', postalCode: 1 });

// Mètode per calcular distància
SupermarketSchema.methods.getDistance = function(userLng: number, userLat: number): number {
  const R = 6371e3; // metres
  const φ1 = userLat * Math.PI/180;
  const φ2 = this.location.coordinates[1] * Math.PI/180;
  const Δφ = (this.location.coordinates[1] - userLat) * Math.PI/180;
  const Δλ = (this.location.coordinates[0] - userLng) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // metres
};

// Mètodes estàtics essencials
SupermarketSchema.statics.findNearby = function(lng: number, lat: number, maxDistance: number = 2000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance
      }
    }
  });
};

SupermarketSchema.statics.findByPostalCode = function(postalCode: string, maxAge: number = 24) {
  const maxAgeDate = new Date(Date.now() - maxAge * 60 * 60 * 1000);
  return this.find({
    postalCode: postalCode,
    lastUpdated: { $gte: maxAgeDate }
  });
};

export const Supermarket = mongoose.model<ISupermarket, ISupermarketModel>('Supermarket', SupermarketSchema); 