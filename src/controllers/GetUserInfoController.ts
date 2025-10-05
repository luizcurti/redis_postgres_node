import { Request, Response } from 'express';
import { getRedis } from '../redisConfig';

export class GetUserInfoController {
  async handle(request: Request, response: Response) {
    const { id } = request.params;

    if (!id) {
      return response
        .status(400)
        .json({ error: 'User ID is required in the request.' });
    }

    try {
      const userRedis = await getRedis(`user-${id}`);

      if (!userRedis) {
        return response.status(404).json({ error: 'User not found in cache.' });
      }

      const user = JSON.parse(userRedis);

      return response.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user from Redis:', error);
      return response.status(500).json({ error: 'Internal server error.' });
    }
  }
}
