import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './config/database';
import { SupermarketService } from './services/supermarketService';
import { Supermarket } from './models/Supermarket';

const supermarketService = new SupermarketService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Conectar a MongoDB
    await connectToDatabase();

    const { url, method } = req;
    
    // Extraer la ruta después de /api/supermarkets
    const urlPath = url?.replace('/api/supermarkets', '') || '';
    
    // 🔍 GET /api/supermarkets/postal/:postalCode - Obtenir supermercats per codi postal
    if (method === 'GET' && urlPath.match(/^\/postal\/\d{5}$/)) {
      const postalCode = urlPath.split('/')[2];
      const forceRefresh = req.query.forceRefresh === 'true';
      
      // Validar format del codi postal
      if (!postalCode || !/^[0-9]{5}$/.test(postalCode)) {
        return res.status(400).json({
          error: 'Format de codi postal invàlid. Ha de ser 5 dígits (ex: 08001)'
        });
      }

      const supermarkets = await supermarketService.getSupermarketsByPostalCode(postalCode, forceRefresh);
      
      return res.json({
        success: true,
        total: supermarkets.length,
        data: supermarkets,
        postalCode,
        cached: !forceRefresh
      });
    }
    
    // 🌍 GET /api/supermarkets/nearby - Obtenir supermercats propers per coordenades
    else if (method === 'GET' && urlPath === '/nearby') {
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
      
      return res.json({
        success: true,
        total: supermarkets.length,
        data: supermarkets,
        coordinates: { lng: longitude, lat: latitude },
        maxDistance: distance
      });
    }
    
    // 🏪 POST /api/supermarkets - Afegir supermercat manual
    else if (method === 'POST' && urlPath === '') {
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

      return res.status(201).json({
        success: true,
        data: newSupermarket,
        message: 'Supermercat afegit correctament'
      });
    }
    
    // 📈 GET /api/supermarkets/stats - Obtenir estadístiques globals
    else if (method === 'GET' && urlPath === '/stats') {
      const stats = await supermarketService.getSupermarketStats();
      
      return res.json({
        success: true,
        data: stats
      });
    }
    
    // 🔄 POST /api/supermarkets/refresh/:postalCode - Forçar actualització cache
    else if (method === 'POST' && urlPath.match(/^\/refresh\/\d{5}$/)) {
      const postalCode = urlPath.split('/')[2];
      
      if (!postalCode || !/^[0-9]{5}$/.test(postalCode)) {
        return res.status(400).json({
          error: 'Format de codi postal invàlid'
        });
      }

      const supermarkets = await supermarketService.getSupermarketsByPostalCode(postalCode, true);
      
      return res.json({
        success: true,
        total: supermarkets.length,
        data: supermarkets,
        postalCode,
        refreshed: true
      });
    }
    
    // 🔍 GET /api/supermarkets/search - Buscar supermercats per nom o cadena
    else if (method === 'GET' && urlPath === '/search') {
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
      
      return res.json({
        success: true,
        total: supermarkets.length,
        data: supermarkets,
        query: q,
        postalCode: postalCode || null
      });
    }
    
    // ⭐ PUT /api/supermarkets/:id/rating - Actualitzar rating
    else if (method === 'PUT' && urlPath.match(/^\/[^/]+\/rating$/)) {
      const supermarketId = urlPath.split('/')[1];
      const { rating } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          error: 'Rating ha de ser entre 1 i 5'
        });
      }

      const supermarket = await Supermarket.findById(supermarketId);
      if (!supermarket) {
        return res.status(404).json({
          error: 'Supermercat no trobat'
        });
      }

      // Per simplicitat, només actualitzem el rating
      // En un sistema real, hauríem de fer una mitjana de ratings
      (supermarket as any).rating = rating;
      await supermarket.save();

      return res.json({
        success: true,
        message: 'Rating actualitzat correctament'
      });
    }
    
    // 📊 POST /api/supermarkets/:id/visit - Registrar visita
    else if (method === 'POST' && urlPath.match(/^\/[^/]+\/visit$/)) {
      const supermarketId = urlPath.split('/')[1];
      
      const supermarket = await Supermarket.findById(supermarketId);
      if (!supermarket) {
        return res.status(404).json({
          error: 'Supermercat no trobat'
        });
      }

      // Registrar visita (actualitzar lastUpdated)
      supermarket.lastUpdated = new Date();
      await supermarket.save();

      return res.json({
        success: true,
        message: 'Visita registrada correctament'
      });
    }
    
    else {
      return res.status(404).json({ 
        error: 'Ruta no trobada',
        path: urlPath,
        method,
        url: url
      });
    }
    
  } catch (error: any) {
    console.error('Error en la API de supermercats:', error);
    return res.status(500).json({
      error: 'Error obtenint supermercats',
      details: error instanceof Error ? error.message : 'Error desconegut'
    });
  }
} 