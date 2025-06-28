import express from 'express';
import { supermarketService } from '../services/supermarketService';

const router = express.Router();

// 🔍 GET /api/supermarkets/postal/:postalCode - Obtenir supermercats per codi postal
router.get('/postal/:postalCode', async (req, res) => {
  try {
    const { postalCode } = req.params;
    const { forceRefresh } = req.query;
    
    console.log(`📋 API: Petició per supermercats del codi postal ${postalCode}`);
    
    if (!postalCode || postalCode.length !== 5) {
      return res.status(400).json({
        error: 'Codi postal no vàlid. Ha de tenir 5 dígits.'
      });
    }

    const supermarkets = await supermarketService.getSupermarketsByPostalCode(
      postalCode, 
      forceRefresh === 'true'
    );

    res.json({
      success: true,
      data: supermarkets,
      total: supermarkets.length,
      postalCode,
      fromCache: forceRefresh !== 'true'
    });

  } catch (error) {
    console.error('❌ Error API supermercats per codi postal:', error);
    res.status(500).json({
      error: 'Error obtenint supermercats',
      details: error instanceof Error ? error.message : 'Error desconegut'
    });
  }
});

// 🌍 GET /api/supermarkets/nearby - Obtenir supermercats propers per coordenades
router.get('/nearby', async (req, res) => {
  try {
    const { lng, lat, maxDistance } = req.query;
    
    console.log(`📍 API: Petició supermercats propers a [${lng}, ${lat}]`);
    
    if (!lng || !lat) {
      return res.status(400).json({
        error: 'Coordenades lng i lat són obligatòries'
      });
    }

    const longitude = parseFloat(lng as string);
    const latitude = parseFloat(lat as string);
    const distance = maxDistance ? parseInt(maxDistance as string) : 2000;

    if (isNaN(longitude) || isNaN(latitude)) {
      return res.status(400).json({
        error: 'Coordenades no vàlides'
      });
    }

    const supermarkets = await supermarketService.getSupermarketsNearby(
      longitude, 
      latitude, 
      distance
    );

    res.json({
      success: true,
      data: supermarkets,
      total: supermarkets.length,
      coordinates: { lng: longitude, lat: latitude },
      maxDistance: distance
    });

  } catch (error) {
    console.error('❌ Error API supermercats propers:', error);
    res.status(500).json({
      error: 'Error obtenint supermercats propers',
      details: error instanceof Error ? error.message : 'Error desconegut'
    });
  }
});

// 🏪 POST /api/supermarkets - Afegir supermercat manual
router.post('/', async (req, res) => {
  try {
    const { name, address, postalCode, chain, lng, lat } = req.body;
    
    console.log(`➕ API: Afegir supermercat manual: ${name}`);
    
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
        type: 'Point' as const,
        coordinates: [parseFloat(lng), parseFloat(lat)]
      }
    };

    const newSupermarket = await supermarketService.addManualSupermarket(supermarketData);

    res.status(201).json({
      success: true,
      data: newSupermarket,
      message: 'Supermercat afegit correctament'
    });

  } catch (error) {
    console.error('❌ Error API afegir supermercat:', error);
    res.status(500).json({
      error: 'Error afegint supermercat',
      details: error instanceof Error ? error.message : 'Error desconegut'
    });
  }
});





// 📈 GET /api/supermarkets/stats - Obtenir estadístiques globals
router.get('/stats', async (req, res) => {
  try {
    console.log('📈 API: Petició estadístiques globals');
    
    const stats = await supermarketService.getSupermarketStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error API estadístiques:', error);
    res.status(500).json({
      error: 'Error obtenint estadístiques',
      details: error instanceof Error ? error.message : 'Error desconegut'
    });
  }
});

// 🔄 POST /api/supermarkets/refresh/:postalCode - Forçar actualització cache
router.post('/refresh/:postalCode', async (req, res) => {
  try {
    const { postalCode } = req.params;
    
    console.log(`🔄 API: Forçar actualització cache per ${postalCode}`);
    
    if (!postalCode || postalCode.length !== 5) {
      return res.status(400).json({
        error: 'Codi postal no vàlid. Ha de tenir 5 dígits.'
      });
    }

    const supermarkets = await supermarketService.getSupermarketsByPostalCode(
      postalCode, 
      true // Forçar refresh
    );

    res.json({
      success: true,
      data: supermarkets,
      total: supermarkets.length,
      postalCode,
      message: 'Cache actualitzat correctament'
    });

  } catch (error) {
    console.error('❌ Error API refresh cache:', error);
    res.status(500).json({
      error: 'Error actualitzant cache',
      details: error instanceof Error ? error.message : 'Error desconegut'
    });
  }
});

// 🔍 GET /api/supermarkets/search - Buscar supermercats per nom o cadena
router.get('/search', async (req, res) => {
  try {
    const { q, postalCode } = req.query;
    
    console.log(`🔍 API: Buscar supermercats: "${q}"`);
    
    if (!q) {
      return res.status(400).json({
        error: 'Paràmetre de cerca "q" obligatori'
      });
    }

    // Crear query de cerca amb regex
    const searchQuery: any = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { chain: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } }
      ]
    };

    // Filtrar per codi postal si es proporciona
    if (postalCode) {
      searchQuery.postalCode = postalCode;
    }

    // Buscar a MongoDB
    const { Supermarket } = await import('../models/Supermarket');
    const supermarkets = await Supermarket.find(searchQuery)
      .limit(20)
      .sort({ lastUpdated: -1, name: 1 });

    res.json({
      success: true,
      data: supermarkets,
      total: supermarkets.length,
      query: q,
      postalCode
    });

  } catch (error) {
    console.error('❌ Error API buscar supermercats:', error);
    res.status(500).json({
      error: 'Error buscant supermercats',
      details: error instanceof Error ? error.message : 'Error desconegut'
    });
  }
});

export default router; 