"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supermarketService_1 = require("../services/supermarketService");
const Supermarket_1 = require("../models/Supermarket");
const router = express_1.default.Router();
router.get('/postal/:postalCode', async (req, res) => {
    try {
        const { postalCode } = req.params;
        const forceRefresh = req.query.forceRefresh === 'true';
        if (!postalCode || !/^[0-9]{5}$/.test(postalCode)) {
            return res.status(400).json({
                error: 'Format de codi postal invàlid. Ha de ser 5 dígits (ex: 08001)'
            });
        }
        const supermarkets = await supermarketService_1.supermarketService.getSupermarketsByPostalCode(postalCode, forceRefresh);
        res.json({
            success: true,
            total: supermarkets.length,
            data: supermarkets,
            postalCode,
            cached: !forceRefresh
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Error obtenint supermercats',
            details: error instanceof Error ? error.message : 'Error desconegut'
        });
    }
});
router.get('/nearby', async (req, res) => {
    try {
        const { lng, lat, maxDistance } = req.query;
        if (!lng || !lat) {
            return res.status(400).json({
                error: 'Coordenades obligatòries: lng i lat'
            });
        }
        const longitude = parseFloat(lng);
        const latitude = parseFloat(lat);
        const distance = maxDistance ? parseInt(maxDistance) : 2000;
        if (isNaN(longitude) || isNaN(latitude)) {
            return res.status(400).json({
                error: 'Coordenades han de ser números vàlids'
            });
        }
        const supermarkets = await supermarketService_1.supermarketService.getSupermarketsNearby(longitude, latitude, distance);
        res.json({
            success: true,
            total: supermarkets.length,
            data: supermarkets,
            coordinates: { lng: longitude, lat: latitude },
            maxDistance: distance
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Error obtenint supermercats propers',
            details: error instanceof Error ? error.message : 'Error desconegut'
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const { name, address, postalCode, chain, lng, lat } = req.body;
        if (!name || !address || !postalCode || !lng || !lat) {
            return res.status(400).json({
                error: 'Camps obligatoris: name, address, postalCode, lng, lat'
            });
        }
        const supermarketData = {
            name: name.trim(),
            address: address.trim(),
            postalCode: postalCode.trim(),
            chain: chain?.trim(),
            location: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
            }
        };
        const newSupermarket = await supermarketService_1.supermarketService.addManualSupermarket(supermarketData);
        res.status(201).json({
            success: true,
            data: newSupermarket,
            message: 'Supermercat afegit correctament'
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Error afegint supermercat',
            details: error instanceof Error ? error.message : 'Error desconegut'
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const stats = await supermarketService_1.supermarketService.getSupermarketStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Error obtenint estadístiques',
            details: error instanceof Error ? error.message : 'Error desconegut'
        });
    }
});
router.post('/refresh/:postalCode', async (req, res) => {
    try {
        const { postalCode } = req.params;
        if (!postalCode || !/^[0-9]{5}$/.test(postalCode)) {
            return res.status(400).json({
                error: 'Format de codi postal invàlid'
            });
        }
        const supermarkets = await supermarketService_1.supermarketService.getSupermarketsByPostalCode(postalCode, true);
        res.json({
            success: true,
            total: supermarkets.length,
            data: supermarkets,
            postalCode,
            refreshed: true
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Error actualitzant cache',
            details: error instanceof Error ? error.message : 'Error desconegut'
        });
    }
});
router.get('/search', async (req, res) => {
    try {
        const { q, postalCode } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({
                error: 'Paràmetre de cerca "q" és obligatori'
            });
        }
        const query = {
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { address: { $regex: q, $options: 'i' } },
                { chain: { $regex: q, $options: 'i' } }
            ]
        };
        if (postalCode && typeof postalCode === 'string') {
            query.postalCode = postalCode;
        }
        const supermarkets = await Supermarket_1.Supermarket.find(query).limit(20);
        res.json({
            success: true,
            total: supermarkets.length,
            data: supermarkets,
            query: q,
            postalCode: postalCode || null
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Error cercant supermercats',
            details: error instanceof Error ? error.message : 'Error desconegut'
        });
    }
});
exports.default = router;
