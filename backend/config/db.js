import mongoose from 'mongoose';

export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    return mongoose.connection.asPromise();
  }

  const mongoUri = process.env.MONGO_URI?.trim();

  if (!mongoUri) {
    throw new Error('MONGO_URI is missing in backend/.env');
  }

  console.log('Connecting to MongoDB...');

  await mongoose.connect(mongoUri);

  console.log('MongoDB Connected');
  return mongoose.connection;
};
