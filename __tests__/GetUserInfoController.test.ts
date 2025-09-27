import { GetUserInfoController } from '../src/controllers/GetUserInfoController';
import { Request, Response } from 'express';
import { getRedis } from '../src/redisConfig';

jest.mock('../src/redisConfig', () => ({
  setRedis: jest.fn(),
  getRedis: jest.fn(),
}));

describe('GetUserInfoController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if user ID is missing', async () => {
    const req = { params: {} } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

    const controller = new GetUserInfoController();
    await controller.handle(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'User ID is required in the request.' });
  });



  it('should return 200 if user is found in Redis', async () => {
    const req = { params: { id: '123' } } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

    jest.mocked(getRedis).mockResolvedValueOnce(JSON.stringify({ id: '123', name: 'John Doe' }));

    const controller = new GetUserInfoController();
    await controller.handle(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: '123', name: 'John Doe' });
  });

  it('should return 500 if Redis throws an error', async () => {
    const req = { params: { id: '123' } } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

    // Mock Redis error
    jest.mocked(getRedis).mockRejectedValueOnce(new Error('Redis connection error'));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const controller = new GetUserInfoController();
    await controller.handle(req, res);

    expect(consoleSpy).toHaveBeenCalledWith('Error fetching user from Redis:', expect.any(Error));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error.' });

    consoleSpy.mockRestore();
  });

  it('should return 404 with specific message when user is not found in cache', async () => {
    const req = { params: { id: '123' } } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

    jest.mocked(getRedis).mockResolvedValueOnce(null);

    const controller = new GetUserInfoController();
    await controller.handle(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found in cache.' });
  });
});