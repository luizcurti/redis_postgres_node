import Redis from "ioredis";

const redisClient = new Redis();

async function getRedis(value: string) {
  return redisClient.get(value);
}

async function setRedis(key: string, value: string, expiration: number = 3600) {
  return redisClient.set(key, value, 'EX', expiration); 
}

export { redisClient, getRedis, setRedis };
