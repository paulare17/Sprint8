"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectFromDatabase = exports.connectToDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
let isConnected = false;
const connectToDatabase = async () => {
    if (isConnected) {
        return;
    }
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI no está configurada en las variables de entorno');
        }
        await mongoose_1.default.connect(mongoUri);
        isConnected = true;
        console.log('✅ Connectat a MongoDB');
    }
    catch (error) {
        console.error('❌ Error connectant a MongoDB:', error);
        throw error;
    }
};
exports.connectToDatabase = connectToDatabase;
const disconnectFromDatabase = async () => {
    if (isConnected) {
        await mongoose_1.default.disconnect();
        isConnected = false;
        console.log('🔌 Desconnectat de MongoDB');
    }
};
exports.disconnectFromDatabase = disconnectFromDatabase;
