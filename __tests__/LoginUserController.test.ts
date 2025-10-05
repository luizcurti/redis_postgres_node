import { LoginUserController } from '../src/controllers/LoginUserController';
import { Request, Response } from 'express';
import { createConnection } from '../src/postgres';
import { getRedis, setRedis } from '../src/redisConfig';
import { Pool } from 'pg';
import { sign } from 'jsonwebtoken';
import { compare } from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../src/postgres', () => ({
  createConnection: jest.fn(() =>
    Promise.resolve({
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            id: '123',
            name: 'John Doe',
            username: 'test',
            password: 'hashedpassword',
            email: 'test@example.com',
          },
        ],
      }),
      end: jest.fn(),
    } as unknown as Pool)
  ),
}));

jest.mock('../src/redisConfig', () => ({
  setRedis: jest.fn().mockResolvedValue('OK'),
  getRedis: jest.fn().mockResolvedValue(null),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => {
    if (!secret) throw new Error('JWT_SECRET is required');
    return 'mockToken';
  }),
}));

describe('LoginUserController', () => {
  let controller: LoginUserController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
    controller = new LoginUserController();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should return 400 if username or password is missing', async () => {
    req = { body: {} };
    await controller.handle(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Username and password are required.',
    });
  });

  it('should return 404 if user is not found', async () => {
    req = { body: { username: 'nonexistent', password: 'testpass' } };
    const mockQuery = jest.fn().mockResolvedValueOnce({ rows: [] });
    jest
      .mocked(createConnection)
      .mockReturnValueOnce(
        Promise.resolve({ query: mockQuery, end: jest.fn() } as unknown as Pool)
      );

    await controller.handle(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials.' });
  });

  it('should return 401 if password does not match', async () => {
    req = { body: { username: 'test', password: 'wrongpass' } };
    (compare as jest.Mock).mockImplementationOnce(() => Promise.resolve(false));

    await controller.handle(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials.' });
  });

  it('should return 200 if login is successful', async () => {
    req = { body: { username: 'test', password: 'correctpassword' } };
    (compare as jest.Mock).mockImplementationOnce(() => Promise.resolve(true));

    await controller.handle(req as Request, res as Response);

    expect(sign).toHaveBeenCalledWith({}, 'test_secret', {
      subject: '123',
      expiresIn: '1h',
    });

    expect(setRedis).toHaveBeenCalledWith(
      'user-123',
      JSON.stringify({
        id: '123',
        name: 'John Doe',
        username: 'test',
        email: 'test@example.com',
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      token: 'mockToken',
      user: {
        id: '123',
        name: 'John Doe',
        username: 'test',
        email: 'test@example.com',
      },
      message: 'Login successful',
    });
  });

  it('should handle database errors gracefully', async () => {
    req = { body: { username: 'test', password: 'testpass' } };
    const mockQuery = jest
      .fn()
      .mockRejectedValueOnce(new Error('Database error'));
    jest
      .mocked(createConnection)
      .mockReturnValueOnce(
        Promise.resolve({ query: mockQuery, end: jest.fn() } as unknown as Pool)
      );

    await controller.handle(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error.' });
  });

  it('should handle Redis errors gracefully', async () => {
    req = { body: { username: 'test', password: 'correctpassword' } };
    (compare as jest.Mock).mockImplementationOnce(() => Promise.resolve(true));
    jest.mocked(setRedis).mockRejectedValueOnce(new Error('Redis error'));

    await controller.handle(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error.' });
  });
});
