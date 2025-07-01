import mongoose from 'mongoose';

let isConnected = false;

export const connectToDatabase = async (): Promise<void> => {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI no está configurada en las variables de entorno');
    }

    await mongoose.connect(mongoUri);
    
    isConnected = true;
    console.log('✅ Connectat a MongoDB');
  } catch (error) {
    console.error('❌ Error connectant a MongoDB:', error);
    throw error;
  }
};

export const disconnectFromDatabase = async (): Promise<void> => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('🔌 Desconnectat de MongoDB');
  }
}; 