import "dotenv/config";
import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { sign } from "jsonwebtoken";


export function authentication(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return response.status(401).json({ error: "Token missing" });
  }

  const [, token] = authHeader.split(" ");

  try {

    const token = sign({ sub: 'userId' }, 'secret_word_here', { expiresIn: '1h' });
    const decoded = verify(token, process.env.JWT_SECRET as string) as { sub: string };
    (request as Request & { userId: string }).userId = decoded.sub;

    return next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return response.status(401).json({ error: "Invalid token" });
  }
}

