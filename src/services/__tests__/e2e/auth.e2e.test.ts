//
// Validates full HTTP stack — no mocks, real in-memory SQLite.
// Each describe block is independent — register/login state
// does NOT leak between blocks because users accumulate in DB
// but we use unique emails per block to avoid conflicts.

import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import {
  createTestApp,
  teardownTestApp,
  type TestContext
} from '../../../e2e/setup.js';

// Setup

let ctx: TestContext;

beforeAll(async () => {
  ctx = await createTestApp();
});

afterAll(async () => {
  await teardownTestApp(ctx);
});

// Helpers

async function register(email: string, password: string) {
  return request(ctx.app)
    .post('/api/v1/auth/register')
    .send({ email, password });
}

async function login(email: string, password: string) {
  return request(ctx.app).post('/api/v1/auth/login').send({ email, password });
}

async function registerAndLogin(email: string, password = 'Password123!') {
  await register(email, password);
  const res = await login(email, password);
  return res.body.data as { accessToken: string; refreshToken: string };
}

// Tests

describe('Auth E2E', () => {
  //  POST /auth/register

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return 201 with id, email, role', async () => {
      const res = await register(
        'register.success@example.com',
        'Password123!'
      );

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        email: 'register.success@example.com',
        role: 'user'
      });
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).not.toHaveProperty('password');
      expect(res.body.data).not.toHaveProperty('refreshToken');
    });

    it('should return 400 when email already exists', async () => {
      await register('register.duplicate@example.com', 'Password123!');

      const res = await register(
        'register.duplicate@example.com',
        'Password123!'
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email already exists');
    });

    it('should return 400 for invalid email format', async () => {
      const res = await register('not-an-email', 'Password123!');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 when password is too short (< 6 chars)', async () => {
      const res = await register('register.short@example.com', '123');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(ctx.app).post('/api/v1/auth/register').send({});

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  //  POST /auth/login

  describe('POST /api/v1/auth/login', () => {
    beforeAll(async () => {
      await register('login.user@example.com', 'Password123!');
    });

    it('should return accessToken and refreshToken on valid credentials', async () => {
      const res = await login('login.user@example.com', 'Password123!');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should return 400 for wrong password', async () => {
      const res = await login('login.user@example.com', 'wrongpassword');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 400 for non-existent user', async () => {
      const res = await login('nobody@example.com', 'Password123!');

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 400 when email is missing', async () => {
      const res = await request(ctx.app)
        .post('/api/v1/auth/login')
        .send({ password: 'Password123!' });

      expect(res.status).toBe(400);
    });
  });

  //  POST /auth/refresh

  describe('POST /api/v1/auth/refresh', () => {
    it('should return a new accessToken for a valid refreshToken', async () => {
      const { refreshToken } = await registerAndLogin(
        'refresh.valid@example.com'
      );

      const res = await request(ctx.app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).not.toHaveProperty('refreshToken');
    });

    it('should return 400 for an invalid refresh token', async () => {
      const res = await request(ctx.app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when refreshToken field is missing', async () => {
      const res = await request(ctx.app).post('/api/v1/auth/refresh').send({});

      expect(res.status).toBe(400);
    });
  });

  //  POST /auth/logout

  describe('POST /api/v1/auth/logout', () => {
    it('should logout and return 204 No Content', async () => {
      const { accessToken } = await registerAndLogin(
        'logout.success@example.com'
      );

      const res = await request(ctx.app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    it('should return 401 without Authorization header', async () => {
      const res = await request(ctx.app).post('/api/v1/auth/logout');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 with an invalid token', async () => {
      const res = await request(ctx.app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
    });

    it('should invalidate the refresh token after logout', async () => {
      const { accessToken, refreshToken } = await registerAndLogin(
        'logout.invalidate@example.com'
      );

      // logout
      await request(ctx.app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      // refresh should now fail — token removed from DB
      const res = await request(ctx.app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(400);
    });
  });
});
