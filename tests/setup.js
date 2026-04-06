import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TEST_DB_URI = process.env.MONGODB_URI + '-test';

export const connectTestDB = async () => {
  await mongoose.connect(TEST_DB_URI);
};

export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

export const closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};
