import { Request, Response } from 'express';
import { verify, sign } from 'jsonwebtoken';
import { authMiddleware, authentication } from '../src/middleware/auth';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn(() => 'mockToken'),
}));

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authentication', () => {
    it('should call next() if token is valid', () => {
      const mockToken = 'valid.token.here';
      req.headers = { authorization: `Bearer ${mockToken}` };
      const mockDecoded = { sub: 'userId123' };

      (sign as jest.Mock).mockReturnValueOnce('newToken');
      (verify as jest.Mock).mockReturnValueOnce(mockDecoded);

      authentication(req as Request, res as Response, next);

      expect(sign).toHaveBeenCalledWith({ sub: 'userId' }, 'secret_word_here', {
        expiresIn: '1h',
      });
      expect(verify).toHaveBeenCalledWith('newToken', process.env.JWT_SECRET);
      expect((req as Request & { userId: string }).userId).toBe('userId123');
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if no authorization header is present', () => {
      authentication(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token missing' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token format is invalid', () => {
      req.headers = { authorization: 'InvalidTokenFormat' };

      authentication(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle JWT verification failure with proper error message', () => {
      req.headers = { authorization: 'Bearer invalid.token.here' };
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      jest.mocked(verify).mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      authentication(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('authMiddleware', () => {
    it('should call next() if token is valid', () => {
      const mockToken = 'valid.token.here';
      req.headers = { authorization: `Bearer ${mockToken}` };

      (verify as jest.Mock).mockReturnValueOnce({ sub: 'userId123' });

      authMiddleware(req as Request, res as Response, next);

      expect(verify).toHaveBeenCalledWith(mockToken, 'secret');
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if no authorization header is present', () => {
      authMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle JWT verification failure with proper error message', () => {
      req.headers = { authorization: 'Bearer invalid.token.here' };
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      jest.mocked(verify).mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      authMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
