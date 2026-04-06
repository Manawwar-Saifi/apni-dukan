import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';

let sellerToken;
let buyerToken;

const createSeller = async () => {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Shop Owner', email: 'shopowner@test.com', password: '123456', role: 'seller' });
  return res.body.token;
};

const createBuyer = async () => {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Buyer', email: 'buyer@test.com', password: '123456', role: 'buyer' });
  return res.body.token;
};

beforeAll(async () => {
  await connectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  sellerToken = await createSeller();
  buyerToken = await createBuyer();
});

afterAll(async () => {
  await closeTestDB();
});

describe('Shop Module', () => {
  // ---- CREATE SHOP ----
  describe('POST /api/shop', () => {
    it('should create a shop for seller', async () => {
      const res = await request(app)
        .post('/api/shop')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          name: 'My Dukaan',
          description: 'Fresh groceries',
          address: { street: 'MG Road', city: 'Delhi', state: 'Delhi', pincode: '110001' },
          status: 'open',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.shop.name).toBe('My Dukaan');
      expect(res.body.shop.status).toBe('open');
      expect(res.body.shop.address.city).toBe('Delhi');
    });

    it('should reject duplicate shop for same seller', async () => {
      await request(app)
        .post('/api/shop')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Shop 1', status: 'open' });

      const res = await request(app)
        .post('/api/shop')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Shop 2', status: 'open' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already have a shop');
    });

    it('should reject shop creation by buyer', async () => {
      const res = await request(app)
        .post('/api/shop')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ name: 'Buyer Shop', status: 'open' });

      expect(res.status).toBe(403);
    });

    it('should reject shop without name', async () => {
      const res = await request(app)
        .post('/api/shop')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ description: 'No name shop' });

      expect(res.status).toBe(400);
    });

    it('should reject shop without auth token', async () => {
      const res = await request(app)
        .post('/api/shop')
        .send({ name: 'No Auth Shop' });

      expect(res.status).toBe(401);
    });
  });

  // ---- GET SHOP ----
  describe('GET /api/shop', () => {
    it('should return seller own shop', async () => {
      await request(app)
        .post('/api/shop')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Get Test Shop', status: 'closed' });

      const res = await request(app)
        .get('/api/shop')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.shop.name).toBe('Get Test Shop');
    });

    it('should return 404 if seller has no shop', async () => {
      const res = await request(app)
        .get('/api/shop')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(404);
    });
  });

  // ---- UPDATE SHOP ----
  describe('PUT /api/shop', () => {
    it('should update shop name and status', async () => {
      await request(app)
        .post('/api/shop')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Old Name', status: 'closed' });

      const res = await request(app)
        .put('/api/shop')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'New Name', status: 'open' });

      expect(res.status).toBe(200);
      expect(res.body.shop.name).toBe('New Name');
      expect(res.body.shop.status).toBe('open');
    });

    it('should update status to ASP with schedule', async () => {
      await request(app)
        .post('/api/shop')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'ASP Shop', status: 'closed' });

      const res = await request(app)
        .put('/api/shop')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          status: 'asp',
          schedule: [
            { day: 'mon', open: '09:00', close: '21:00' },
            { day: 'wed', open: '10:00', close: '18:00' },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.shop.status).toBe('asp');
      expect(res.body.shop.schedule).toHaveLength(2);
    });

    it('should reject ASP status without schedule', async () => {
      await request(app)
        .post('/api/shop')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'No Schedule Shop', status: 'closed' });

      const res = await request(app)
        .put('/api/shop')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'asp' });

      expect(res.status).toBe(500);
    });

    it('should update address partially', async () => {
      await request(app)
        .post('/api/shop')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          name: 'Address Shop',
          address: { city: 'Mumbai', state: 'MH' },
        });

      const res = await request(app)
        .put('/api/shop')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ address: { city: 'Pune' } });

      expect(res.status).toBe(200);
      expect(res.body.shop.address.city).toBe('Pune');
      expect(res.body.shop.address.state).toBe('MH');
    });

    it('should return 404 when updating non-existent shop', async () => {
      const res = await request(app)
        .put('/api/shop')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'Ghost Shop' });

      expect(res.status).toBe(404);
    });
  });
});
