import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../../../lib/config/database';
import { SupermarketService } from '../../../lib/services/supermarketService';

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    await connectToDatabase();

    const { postalCode } = req.query;
    const forceRefresh = req.query.forceRefresh === 'true';
    
    // Validar format del codi postal
    if (!postalCode || typeof postalCode !== 'string' || !/^[0-9]{5}$/.test(postalCode)) {
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
    
  } catch (error: any) {
    console.error('Error obtenint supermercats:', error);
    return res.status(500).json({
      error: 'Error obtenint supermercats',
      details: error instanceof Error ? error.message : 'Error desconegut'
    });
  }
} 