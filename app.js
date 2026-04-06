import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './src/middleware/errorHandler.js';
import authRoutes from './src/modules/auth/auth.routes.js';
import shopRoutes from './src/modules/shop/shop.routes.js';
import productRoutes from './src/modules/product/product.routes.js';

const app = express();

// Body parser
app.use(express.json());

// CORS
app.use(cors());

// Logging (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Apni Dukaan API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/products', productRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
