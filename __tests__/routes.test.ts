import request from 'supertest';
import app from '../src/server';
import { createConnection } from '../src/postgres';
import { sign } from 'jsonwebtoken';
import { setRedis, getRedis } from '../src/redisConfig';
import { hash } from 'bcryptjs';

jest.mock('../src/postgres', () => ({
  createConnection: jest.fn()
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn((password) => Promise.resolve(password === 'password123')),
  hash: jest.fn(() => Promise.resolve('hashedpassword'))
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mockToken'),
  verify: jest.fn(() => ({ sub: '123' }))
}));

jest.mock('../src/redisConfig', () => ({
  setRedis: jest.fn(() => Promise.resolve('OK')),
  getRedis: jest.fn((key) => {
    if (key === 'user-123') {
      return Promise.resolve(JSON.stringify({
        id: '123',
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com'
      }));
    }
    return Promise.resolve(null);
  })
}));

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
});

describe('Routes Endpoints', () => {
  let mockPool;
  
  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
      end: jest.fn()
    };

    const loginQueryMock = jest.fn((sql, params) => {
      if (sql.toLowerCase().includes('select id, name, username, password, email from users where username')) {
        return Promise.resolve({
          rows: [{
            id: '123',
            name: 'Test User',
            username: 'testuser',
            email: 'test@example.com',
            password: 'hashedpassword'
          }]
        });
      }
      return Promise.resolve({ rows: [] });
    });

    const checkUserQueryMock = jest.fn((sql, params) => {
      if (sql.toLowerCase().includes('select 1 from users where username')) {
        return Promise.resolve({ rows: params[0] === 'testuser' ? [{ exists: true }] : [] });
      }
      return Promise.resolve({ rows: [] });
    });

    const createUserQueryMock = jest.fn((sql, params) => {
      return Promise.resolve({ rows: [{ id: '123' }] });
    });

    const getUserProfileQueryMock = jest.fn((sql, params) => {
      if (params?.[0] === '123') {
        return Promise.resolve({
          rows: [{
            id: '123',
            name: 'Test User',
            username: 'testuser',
            email: 'test@example.com'
          }]
        });
      }
      return Promise.resolve({ rows: [] });
    });

    mockPool.query.mockImplementation((sql, params) => {
      const sqlLower = sql.toLowerCase();

      if (sqlLower.includes('select 1 from users where username = $1 limit 1')) {
        return checkUserQueryMock(sql, params);
      }
      
      if (sqlLower.includes('insert into users')) {
        return createUserQueryMock(sql, params);
      }
      
      if (sqlLower.includes('select id, name, username, password, email from users where username = $1 limit 1')) {
        if (params?.[0] === 'testuser') {
          return loginQueryMock(sql, params);
        }
        return Promise.resolve({ rows: [] });
      }
      
      if (sqlLower.includes('select * from users where id')) {
        return getUserProfileQueryMock(sql, params);
      }

      return Promise.resolve({ rows: [] });
    });

    jest.mocked(createConnection).mockResolvedValue(mockPool as any);
  });
  describe('POST /users', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/users')
        .send({
          name: 'Test User',
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message', 'User created successfully');
      expect(res.body).toHaveProperty('userId');
    });

    it('should return 409 if username already exists', async () => {
      const res = await request(app)
        .post('/users')
        .send({
          name: 'Test User',
          username: 'testuser',
          email: 'testuser2@example.com',
          password: 'password123',
        });
      expect(res.statusCode).toEqual(409);
      expect(res.body).toHaveProperty('error', 'Username already taken.');
    });
  });

  describe('POST /login', () => {
    it('should login a user with valid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Login successful');
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        });
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Invalid credentials.');
    });
  });

  describe('GET /users/profile/:id', () => {
    it('should return user profile for valid token', async () => {
      const loginRes = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      const token = loginRes.body.token;
      const userId = loginRes.body.user.id;

      const res = await request(app)
        .get(`/users/profile/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', userId);
      expect(res.body).toHaveProperty('username', 'testuser');
    });

    it('should return 401 for missing token', async () => {
      const res = await request(app).get('/users/profile/invalid-id');
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Token missing');
    });

    it('should return 404 for non-existent user', async () => {
      const loginRes = await request(app)
        .post('/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      const token = loginRes.body.token;

      const res = await request(app)
        .get('/users/profile/non-existent-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('error', 'User not found in cache.');
    });
  });
});