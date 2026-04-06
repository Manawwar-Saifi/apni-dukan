import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './src/modules/auth/auth.model.js';

const adminData = {
  name: 'Admin',
  email: 'admin@apnidukan.com',
  password: 'admin123',
  role: 'admin',
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const existing = await User.findOne({ email: adminData.email });
    if (existing) {
      console.log('Admin user already exists — skipping');
    } else {
      await User.create(adminData);
      console.log('Admin user created successfully');
    }

    console.log('\n  Email:    admin@apnidukan.com');
    console.log('  Password: admin123\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
