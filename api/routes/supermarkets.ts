import express, { Request, Response } from 'express';
import { supermarketService } from '../services/supermarketService';
import { Supermarket } from '../models/Supermarket';

const router = express.Router();

// 🔍 GET /api/supermarkets/postal/:postalCode - Obtenir supermercats per codi postal
router.get('/postal/:postalCode', async (req: Request, res: Response) => {
  try {
    const { postalCode } = req.params;
    const forceRefresh = req.query.forceRefresh === 'true';
    
    // Validar format del codi postal
    if (!postalCode || !/^[0-9]{5}$/.test(postalCode)) {
      return res.status(400).json({
        error: 'Format de codi postal invàlid. Ha de ser 5 dígits (ex: 08001)'
      });
    }

    const supermarkets = await supermarketService.getSupermarketsByPostalCode(postalCode, forceRefresh);
    
    res.json({
      success: true,
      total: supermarkets.length,
      data: supermarkets,
      postalCode,
      cached: !forceRefresh
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Error obtenint supermercats',
      details: error instanceof Error ? error.message : 'Error desconegut'
    });
  }
});

// 🌍 GET /api/supermarkets/nearby - Obtenir supermercats propers per coordenades
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lng, lat, maxDistance } = req.query;
    
    if (!lng || !lat) {
      return res.status(400).json({
        error: 'Coordenades obligatòries: lng i lat'
      });
    }

    const longitude = parseFloat(lng as string);
    const latitude = parseFloat(lat as string);
    const distance = maxDistance ? parseInt(maxDistance as string) : 2000;

    if (isNaN(longitude) || isNaN(latitude)) {
      return res.status(400).json({
        error: 'Coordenades han de ser números vàlids'
      });
    }

    const supermarkets = await supermarketService.getSupermarketsNearby(longitude, latitude, distance);
    
    res.json({
      success: true,
      total: supermarkets.length,
      data: supermarkets,
      coordinates: { lng: longitude, lat: latitude },
      maxDistance: distance
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Error obtenint supermercats propers',
      details: error instanceof Error ? error.message : 'Error desconegut'
    });
  }
});

// 🏪 POST /api/supermarkets - Afegir supermercat manual
router.post('/', async (req: Request, res: Response) => {
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
        type: 'Point' as const,
        coordinates: [parseFloat(lng), parseFloat(lat)] as [number, number]
      }
    };

    const newSupermarket = await supermarketService.addManualSupermarket(supermarketData);

    res.status(201).json({
      success: true,
      data: newSupermarket,
      message: 'Supermercat afegit correctament'
    });

  } catch (error) {
    res.status(500).json({
      error: 'Error afegint supermercat',
      details: error instanceof Error ? error.message : 'Error desconegut'
    });
  }
});

// 📈 GET /api/supermarkets/stats - Obtenir estadístiques globals
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await supermarketService.getSupermarketStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Error obtenint estadístiques',
      details: error instanceof Error ? error.message : 'Error desconegut'
    });
  }
});

// 🔄 POST /api/supermarkets/refresh/:postalCode - Forçar actualització cache
router.post('/refresh/:postalCode', async (req: Request, res: Response) => {
  try {
    const { postalCode } = req.params;
    
    if (!postalCode || !/^[0-9]{5}$/.test(postalCode)) {
      return res.status(400).json({
        error: 'Format de codi postal invàlid'
      });
    }

    const supermarkets = await supermarketService.getSupermarketsByPostalCode(postalCode, true);
    
    res.json({
      success: true,
      total: supermarkets.length,
      data: supermarkets,
      postalCode,
      refreshed: true
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Error actualitzant cache',
      details: error instanceof Error ? error.message : 'Error desconegut'
    });
  }
});

// 🔍 GET /api/supermarkets/search - Buscar supermercats per nom o cadena
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, postalCode } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Paràmetre de cerca "q" és obligatori'
      });
    }

    // Buscar per nom, adreça i cadena
    const query: any = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { address: { $regex: q, $options: 'i' } },
        { chain: { $regex: q, $options: 'i' } }
      ]
    };

    if (postalCode && typeof postalCode === 'string') {
      query.postalCode = postalCode;
    }

    const supermarkets = await Supermarket.find(query).limit(20);
    
    res.json({
      success: true,
      total: supermarkets.length,
      data: supermarkets,
      query: q,
      postalCode: postalCode || null
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Error cercant supermercats',
      details: error instanceof Error ? error.message : 'Error desconegut'
    });
  }
});

export default router; 