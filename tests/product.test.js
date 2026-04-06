import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';

let sellerToken;
let seller2Token;

const setupSeller = async (email = 'seller@test.com') => {
  const signup = await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Seller', email, password: '123456', role: 'seller' });
  const token = signup.body.token;

  await request(app)
    .post('/api/shop')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: `Shop of ${email}`, status: 'open' });

  return token;
};

beforeAll(async () => {
  await connectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  sellerToken = await setupSeller('seller1@test.com');
  seller2Token = await setupSeller('seller2@test.com');
});

afterAll(async () => {
  await closeTestDB();
});

describe('Product Module', () => {
  // ---- CREATE PRODUCT ----
  describe('POST /api/products', () => {
    it('should create a product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Basmati Rice', price: 150, priceType: 'fixed', category: 'Grocery' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.product.name).toBe('Basmati Rice');
      expect(res.body.product.price).toBe(150);
      expect(res.body.product.priceType).toBe('fixed');
    });

    it('should create product with negotiable price', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Antique Vase', price: 5000, priceType: 'negotiable', category: 'Decor' });

      expect(res.status).toBe(201);
      expect(res.body.product.priceType).toBe('negotiable');
    });

    it('should reject product without name', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ price: 100, category: 'Test' });

      expect(res.status).toBe(400);
    });

    it('should reject product without price', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'No Price Item', category: 'Test' });

      expect(res.status).toBe(400);
    });

    it('should reject product without category', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'No Cat Item', price: 100 });

      expect(res.status).toBe(400);
    });

    it('should reject negative price', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Neg Price', price: -10, category: 'Test' });

      expect(res.status).toBe(400);
    });

    it('should reject invalid priceType', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Bad Type', price: 100, priceType: 'auction', category: 'Test' });

      expect(res.status).toBe(400);
    });

    it('should reject product without auth', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: 'No Auth', price: 100, category: 'Test' });

      expect(res.status).toBe(401);
    });
  });

  // ---- LIST PRODUCTS ----
  describe('GET /api/products', () => {
    it('should list own products', async () => {
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Item 1', price: 100, category: 'A' });
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Item 2', price: 200, category: 'B' });

      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      expect(res.body.products).toHaveLength(2);
    });

    it('should not list other seller products', async () => {
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Seller1 Item', price: 100, category: 'A' });

      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${seller2Token}`)
        .send({ name: 'Seller2 Item', price: 200, category: 'B' });

      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.body.count).toBe(1);
      expect(res.body.products[0].name).toBe('Seller1 Item');
    });

    it('should return empty list when no products', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.products).toHaveLength(0);
    });
  });

  // ---- GET SINGLE PRODUCT ----
  describe('GET /api/products/:id', () => {
    it('should get a product by id', async () => {
      const created = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Single Item', price: 300, category: 'C' });

      const res = await request(app)
        .get(`/api/products/${created.body.product._id}`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.product.name).toBe('Single Item');
    });

    it('should not get other seller product', async () => {
      const created = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Private Item', price: 300, category: 'C' });

      const res = await request(app)
        .get(`/api/products/${created.body.product._id}`)
        .set('Authorization', `Bearer ${seller2Token}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid product id', async () => {
      const res = await request(app)
        .get('/api/products/invalid-id')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ---- UPDATE PRODUCT ----
  describe('PUT /api/products/:id', () => {
    it('should update product price and name', async () => {
      const created = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Old Name', price: 100, category: 'A' });

      const res = await request(app)
        .put(`/api/products/${created.body.product._id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'New Name', price: 250 });

      expect(res.status).toBe(200);
      expect(res.body.product.name).toBe('New Name');
      expect(res.body.product.price).toBe(250);
    });

    it('should change priceType to negotiable', async () => {
      const created = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Fixed Item', price: 100, priceType: 'fixed', category: 'A' });

      const res = await request(app)
        .put(`/api/products/${created.body.product._id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ priceType: 'negotiable' });

      expect(res.status).toBe(200);
      expect(res.body.product.priceType).toBe('negotiable');
    });

    it('should not update other seller product', async () => {
      const created = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Not Yours', price: 100, category: 'A' });

      const res = await request(app)
        .put(`/api/products/${created.body.product._id}`)
        .set('Authorization', `Bearer ${seller2Token}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(404);
    });
  });

  // ---- DELETE PRODUCT (soft) ----
  describe('DELETE /api/products/:id', () => {
    it('should soft-delete a product', async () => {
      const created = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Delete Me', price: 50, category: 'A' });

      const delRes = await request(app)
        .delete(`/api/products/${created.body.product._id}`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.message).toContain('removed');

      // Product should not appear in list
      const listRes = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(listRes.body.count).toBe(0);
    });

    it('should not delete other seller product', async () => {
      const created = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Not Yours', price: 50, category: 'A' });

      const res = await request(app)
        .delete(`/api/products/${created.body.product._id}`)
        .set('Authorization', `Bearer ${seller2Token}`);

      expect(res.status).toBe(404);
    });
  });
});
