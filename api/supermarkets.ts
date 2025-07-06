import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/config/database';
import { SupermarketService } from '../lib/services/supermarketService';
import { Supermarket } from '../lib/models/Supermarket';

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
          error: 'Format de codi postal invàlid. Ha de ser 5 dígits'
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