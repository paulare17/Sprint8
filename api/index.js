"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const supermarkets_1 = __importDefault(require("./routes/supermarkets"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 5000;
mongoose_1.default.connect(process.env.MONGO_URL || "")
    .then(() => {
    console.log("✅ Connectat a MongoDB");
    console.log(`🏪 Base de dades: ${mongoose_1.default.connection.name}`);
})
    .catch((err) => {
    console.error("❌ Error MongoDB:", err);
    process.exit(1);
});
mongoose_1.default.connection.on('error', (err) => {
    console.error('❌ Error de connexió MongoDB:', err);
});
mongoose_1.default.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB desconnectat');
});
app.get("/", (_req, res) => {
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
app.get("/health", (_req, res) => {
    res.json({
        status: "healthy",
        database: mongoose_1.default.connection.readyState === 1 ? "connected" : "disconnected",
        timestamp: new Date().toISOString()
    });
});
app.use("/api/supermarkets", supermarkets_1.default);
app.use("*", (_req, res) => {
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
app.use((error, _req, res, _next) => {
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
