import { redisClient, getRedis, setRedis } from '../src/redisConfig';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
  }));
});

describe('redisConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get a value from Redis', async () => {
    const mockGet = jest.fn().mockResolvedValue('mockValue');
    redisClient.get = mockGet;

    const result = await getRedis('mockKey');

    expect(mockGet).toHaveBeenCalledWith('mockKey');
    expect(result).toBe('mockValue');
  });

  it('should set a value in Redis with expiration', async () => {
    const mockSet = jest.fn().mockResolvedValue('OK');
    redisClient.set = mockSet;

    const result = await setRedis('mockKey', 'mockValue', 3600);

    expect(mockSet).toHaveBeenCalledWith('mockKey', 'mockValue', 'EX', 3600);
    expect(result).toBe('OK');
  });

  it('should handle errors in getRedis', async () => {
    const mockGet = jest.fn().mockRejectedValue(new Error('Redis error'));
    redisClient.get = mockGet;

    await expect(getRedis('mockKey')).rejects.toThrow('Redis error');
  });

  it('should handle errors in setRedis', async () => {
    const mockSet = jest.fn().mockRejectedValue(new Error('Redis error'));
    redisClient.set = mockSet;

    await expect(setRedis('mockKey', 'mockValue')).rejects.toThrow('Redis error');
  });
});