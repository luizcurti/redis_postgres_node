import { CreateUserController } from '../src/controllers/CreateUserController';
import { Request, Response } from 'express';
import { createConnection } from '../src/postgres';
import { v4 as uuid } from 'uuid';
import { hash } from 'bcryptjs';

jest.mock('../src/postgres', () => ({
  createConnection: jest.fn(() => ({
    query: jest.fn(),
    end: jest.fn(),
  })),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => 'mocked-hash'),
}));

describe('CreateUserController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let controller: CreateUserController;
  let mockConnection: any;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    controller = new CreateUserController();
    mockConnection = {
      query: jest.fn(),
      end: jest.fn(),
    };
    (createConnection as jest.Mock).mockResolvedValue(mockConnection);
  });

  it('should return 400 if required fields are missing', async () => {
    req.body = {};

    await controller.handle(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields.' });
  });

  it('should return 409 if username already exists', async () => {
    req.body = {
      username: 'existinguser',
      name: 'Test User',
      password: 'password123',
      email: 'test@example.com',
    };

    mockConnection.query.mockResolvedValueOnce({ rows: [{}] });

    await controller.handle(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Username already taken.' });
  });

  it('should return 201 if user is created successfully', async () => {
    req.body = {
      username: 'newuser',
      name: 'Test User',
      password: 'password123',
      email: 'test@example.com',
    };

    mockConnection.query.mockResolvedValueOnce({ rows: [] });

    await controller.handle(req as Request, res as Response);

    expect(mockConnection.query).toHaveBeenCalledTimes(2);
    expect(mockConnection.query).toHaveBeenCalledWith(
      'INSERT INTO USERS (ID, NAME, USERNAME, PASSWORD, EMAIL) VALUES ($1, $2, $3, $4, $5)',
      ['mocked-uuid', 'Test User', 'newuser', 'mocked-hash', 'test@example.com']
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'User created successfully', userId: 'mocked-uuid' });
  });

  it('should return 500 if an error occurs', async () => {
    req.body = {
      username: 'newuser',
      name: 'Test User',
      password: 'password123',
      email: 'test@example.com',
    };

    mockConnection.query.mockRejectedValueOnce(new Error('Database error'));

    await controller.handle(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
