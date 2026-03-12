import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

export function authentication(
  request: Request,
  response: Response,
  next: NextFunction
): Response | void {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return response.status(401).json({ error: 'Token missing' });
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    return response.status(401).json({ error: 'Invalid token' });
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET as string) as {
      sub: string;
    };
    request.userId = decoded.sub;

    return next();
  } catch {
    return response.status(401).json({ error: 'Invalid token' });
  }
}
