import 'dotenv/config';
import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { sign } from 'jsonwebtoken';

export function authentication(
  request: Request,
  response: Response,
  next: NextFunction
): Response | void {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return response.status(401).json({ error: 'Token missing' });
  }

  const [,] = authHeader.split(' ');

  try {
    const token = sign({ sub: 'userId' }, 'secret_word_here', {
      expiresIn: '1h',
    });
    const decoded = verify(token, process.env.JWT_SECRET as string) as {
      sub: string;
    };
    (request as Request & { userId: string }).userId = decoded.sub;

    return next();
  } catch {
    return response.status(401).json({ error: 'Invalid token' });
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    verify(token, 'secret');
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
