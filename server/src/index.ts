import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import supermarketRoutes from "./routes/supermarkets";

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Connexió a MongoDB amb millor gestió d'errors
mongoose.connect(process.env.MONGO_URL || "")
  .then(() => {
    console.log("✅ Connectat a MongoDB");
    console.log(`🏪 Base de dades: ${mongoose.connection.name}`);
  })
  .catch((err: Error) => {
    console.error("❌ Error MongoDB:", err);
    process.exit(1);
  });

// Configurar esdeveniments de MongoDB
mongoose.connection.on('error', (err: Error) => {
  console.error('❌ Error de connexió MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB desconnectat');
});

// Rutes
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "🏪 Servidor de supermercats actiu",
    version: "1.0.0",
    endpoints: {
      supermarkets: "/api/supermarkets",
      health: "/health"
    },
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// Registrar rutes de supermercats
app.use("/api/supermarkets", supermarketRoutes);

// Middleware per gestionar errors 404
app.use("*", (_req: Request, res: Response) => {
  res.status(404).json({
    error: "Endpoint no trobat",
    availableEndpoints: [
      "GET /",
      "GET /health",
      "GET /api/supermarkets/postal/:postalCode",
      "GET /api/supermarkets/nearby",
      "POST /api/supermarkets",
      "PUT /api/supermarkets/:id/rating",
      "POST /api/supermarkets/:id/visit",
      "GET /api/supermarkets/stats",
      "POST /api/supermarkets/refresh/:postalCode",
      "GET /api/supermarkets/search"
    ]
  });
});

// Middleware per gestionar errors globals
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Error del servidor:', error);
  res.status(500).json({
    error: 'Error intern del servidor',
    message: error.message || 'Error desconegut'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escoltant al port ${PORT}`);
  console.log(`📋 API disponible a http://localhost:${PORT}/api/supermarkets`);
  console.log(`🔍 Health check a http://localhost:${PORT}/health`);
});