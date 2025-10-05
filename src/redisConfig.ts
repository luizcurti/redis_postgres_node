import Redis from 'ioredis';

const redisClient = new Redis();

async function getRedis(value: string): Promise<string | null> {
  return redisClient.get(value);
}

async function setRedis(
  key: string,
  value: string,
  expiration = 3600
): Promise<'OK'> {
  return redisClient.set(key, value, 'EX', expiration);
}

export { redisClient, getRedis, setRedis };
