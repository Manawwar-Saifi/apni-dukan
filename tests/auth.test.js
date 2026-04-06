import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js';

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe('Auth Module', () => {
  // ---- SIGNUP ----
  describe('POST /api/auth/signup', () => {
    it('should register a new seller', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Test Seller', email: 'seller@test.com', password: '123456', role: 'seller' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.name).toBe('Test Seller');
      expect(res.body.user.email).toBe('seller@test.com');
      expect(res.body.user.role).toBe('seller');
      expect(res.body.user.password).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({ name: 'User 1', email: 'dup@test.com', password: '123456', role: 'seller' });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'User 2', email: 'dup@test.com', password: '654321', role: 'seller' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject signup without required fields', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'no-name@test.com' });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Test', email: 'not-an-email', password: '123456', role: 'seller' });

      expect(res.status).toBe(400);
    });

    it('should reject password shorter than 6 characters', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Test', email: 'short@test.com', password: '123', role: 'seller' });

      expect(res.status).toBe(400);
    });

    it('should reject invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Test', email: 'bad@test.com', password: '123456', role: 'admin' });

      expect(res.status).toBe(400);
    });
  });

  // ---- LOGIN ----
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Login User', email: 'login@test.com', password: '123456', role: 'seller' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('login@test.com');
    });

    it('should reject wrong password', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({ name: 'User', email: 'wrong@test.com', password: '123456', role: 'seller' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@test.com', password: 'wrongpass' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@test.com', password: '123456' });

      expect(res.status).toBe(401);
    });

    it('should reject login without email or password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ---- GET ME ----
  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const signup = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Me User', email: 'me@test.com', password: '123456', role: 'seller' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${signup.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('me@test.com');
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_here');

      expect(res.status).toBe(500);
    });
  });
});
