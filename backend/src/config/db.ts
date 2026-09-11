import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aapdasetu';
  try {
    await mongoose.connect(uri);
    console.log(`[Database] MongoDB Connected to ${uri}`);
  } catch (err) {
    console.warn(`[Database] Initial MongoDB connection failed: ${(err as Error).message}`);
    console.warn('[Database] Running in resilient mode. Retrying connection in background...');
    setTimeout(connectDB, 5000);
  }
};
