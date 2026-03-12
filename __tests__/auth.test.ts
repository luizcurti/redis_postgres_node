import { Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { authentication } from '../src/middleware/auth';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
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
    it('should call next() and set userId if token is valid', () => {
      const mockToken = 'valid.token.here';
      req.headers = { authorization: `Bearer ${mockToken}` };
      const mockDecoded = { sub: 'userId123' };

      (verify as jest.Mock).mockReturnValueOnce(mockDecoded);

      authentication(req as Request, res as Response, next);

      expect(verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
      expect((req as Request & { userId: string }).userId).toBe('userId123');
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if no authorization header is present', () => {
      authentication(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token missing' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header has no token (missing Bearer value)', () => {
      req.headers = { authorization: 'Bearer' };

      authentication(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token verification fails', () => {
      req.headers = { authorization: 'Bearer invalid.token.here' };

      (verify as jest.Mock).mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      authentication(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
