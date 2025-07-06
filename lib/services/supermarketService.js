"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supermarketService = exports.SupermarketService = void 0;
const Supermarket_1 = require("../models/Supermarket");
const axios_1 = __importDefault(require("axios"));
class SupermarketService {
    constructor() {
        this.geoapifyKey = process.env.GEOAPIFY_API_KEY;
    }
    async getSupermarketsByPostalCode(postalCode, forceRefresh = false) {
        if (!forceRefresh) {
            const cachedSupermarkets = await Supermarket_1.Supermarket.findByPostalCode(postalCode, 24);
            if (cachedSupermarkets.length > 0) {
                return cachedSupermarkets;
            }
        }
        const coordinates = await this.getCoordinatesFromPostalCode(postalCode);
        if (!coordinates) {
            throw new Error(`No s'han pogut obtenir coordenades per al codi postal: ${postalCode}`);
        }
        const freshSupermarkets = await this.fetchFromGeoapify(coordinates, postalCode);
        const savedSupermarkets = await this.saveSupermarkets(freshSupermarkets);
        return savedSupermarkets;
    }
    async getSupermarketsNearby(lng, lat, maxDistance = 2000) {
        const nearbySupermarkets = await Supermarket_1.Supermarket.findNearby(lng, lat, maxDistance);
        const supermarketsWithDistance = nearbySupermarkets.map((supermarket) => {
            const distance = supermarket.getDistance(lng, lat);
            return {
                ...supermarket.toObject(),
                distance: Math.round(distance)
            };
        });
        return supermarketsWithDistance.sort((a, b) => a.distance - b.distance);
    }
    async getCoordinatesFromPostalCode(postalCode) {
        if (!this.geoapifyKey) {
            throw new Error('Clau API de Geoapify no configurada. Afegeix GEOAPIFY_API_KEY al fitxer .env del servidor');
        }
        try {
            const response = await axios_1.default.get(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(postalCode)}&format=geojson&apiKey=${this.geoapifyKey}&filter=countrycode:es&type=postcode`);
            const data = response.data;
            if (data.features && data.features.length > 0) {
                const coordinates = data.features[0].geometry?.coordinates;
                if (coordinates) {
                    const [lng, lat] = coordinates;
                    return [lng, lat];
                }
            }
            return null;
        }
        catch {
            return null;
        }
    }
    async fetchFromGeoapify(coordinates, postalCode) {
        if (!this.geoapifyKey) {
            throw new Error('Clau API de Geoapify no configurada');
        }
        const supermarkets = [];
        const [lng, lat] = coordinates;
        const categories = [
            'commercial.supermarket',
            'commercial.food',
            'commercial.marketplace'
        ];
        for (const category of categories) {
            try {
                const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lng},${lat},2000&bias=proximity:${lng},${lat}&limit=20&apiKey=${this.geoapifyKey}`;
                const response = await axios_1.default.get(url);
                const data = response.data;
                if (data.features) {
                    for (const feature of data.features) {
                        if (feature.geometry?.coordinates && feature.properties) {
                            const [fLng, fLat] = feature.geometry.coordinates;
                            const name = feature.properties.name || 'Supermercat';
                            const address = feature.properties.formatted ||
                                feature.properties.address_line1 ||
                                'Adreça no disponible';
                            const supermarketData = {
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
            }
            catch {
            }
        }
        return this.removeDuplicates(supermarkets);
    }
    async saveSupermarkets(supermarketsData) {
        const savedSupermarkets = [];
        for (const data of supermarketsData) {
            try {
                const existingSupermarket = await Supermarket_1.Supermarket.findOne({
                    location: {
                        $near: {
                            $geometry: {
                                type: 'Point',
                                coordinates: data.location.coordinates
                            },
                            $maxDistance: 50
                        }
                    }
                });
                if (existingSupermarket) {
                    existingSupermarket.lastUpdated = new Date();
                    await existingSupermarket.save();
                    savedSupermarkets.push(existingSupermarket);
                }
                else {
                    const newSupermarket = new Supermarket_1.Supermarket(data);
                    const saved = await newSupermarket.save();
                    savedSupermarkets.push(saved);
                }
            }
            catch {
            }
        }
        return savedSupermarkets;
    }

    extractChainFromName(name) {
        const chains = ['Mercadona', 'Carrefour', 'Dia', 'Lidl', 'Aldi', 'Eroski', 'Condis', 'Caprabo', 'El Corte Inglés'];
        for (const chain of chains) {
            if (name.toLowerCase().includes(chain.toLowerCase())) {
                return chain;
            }
        }
        return 'Altres';
    }
    removeDuplicates(supermarkets) {
        const uniqueMap = new Map();
        supermarkets.forEach(supermarket => {
            const coordKey = `${Math.round(supermarket.location.coordinates[1] * 1000)}_${Math.round(supermarket.location.coordinates[0] * 1000)}`;
            if (!uniqueMap.has(coordKey) ||
                (uniqueMap.get(coordKey).name.length < supermarket.name.length)) {
                uniqueMap.set(coordKey, supermarket);
            }
        });
        return Array.from(uniqueMap.values());
    }

}
exports.SupermarketService = SupermarketService;
exports.supermarketService = new SupermarketService();
