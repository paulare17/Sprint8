const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const supermarketRoutes = require("./routes/supermarkets");

dotenv.config();
const app = express();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

// CORS configurat segons entorn
const allowedOrigins = isProduction 
  ? ['https://sprint8-tau.vercel.app', 'https://tu-dominio.com'] 
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Connexió a MongoDB (opcional - comentat per ara)
mongoose.connect(process.env.MONGO_URL || "")
  .then(() => {
    console.log("✅ Connectat a MongoDB");
  })
  .catch((err: any) => {
    console.error("❌ Error MongoDB:", err);
  });

// Rutes principals
app.get("/", (req: any, res: any) => {
  res.json({
    message: "🏪 Servidor de supermercats actiu",
    version: "1.0.0",
    environment: NODE_ENV,
    endpoints: {
      supermarkets: "/api/supermarkets",
      health: "/health"
    },
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req: any, res: any) => {
  res.json({
    status: "healthy",
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Registrar rutes de supermercats
app.use("/api/supermarkets", supermarketRoutes);

// Middleware per gestionar errors globals
app.use((error: any, req: any, res: any, next: any) => {
  console.error('❌ Error del servidor:', error);
  
  const errorResponse = {
    error: 'Error intern del servidor',
    message: isProduction ? 'Alguna cosa ha anat malament' : error.message || 'Error desconegut'
  };
  
  res.status(500).json(errorResponse);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escoltant al port ${PORT}`);
  console.log(`🔧 Entorn: ${NODE_ENV}`);
  console.log(`📋 API disponible a http://localhost:${PORT}/api/supermarkets`);
  console.log(`🔍 Health check a http://localhost:${PORT}/health`);
});