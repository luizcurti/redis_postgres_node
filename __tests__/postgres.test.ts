import { createConnection } from '../src/postgres';

jest.mock('pg');

describe('Postgres Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a pool instance with expected methods', async () => {
    const pool = await createConnection();

    expect(pool.connect).toBeDefined();
    expect(typeof pool.connect).toBe('function');

    expect(pool.query).toBeDefined();
    expect(typeof pool.query).toBe('function');

    expect(pool.end).toBeDefined();
    expect(typeof pool.end).toBe('function');

    expect(pool).toHaveProperty('on');
    expect(pool).toHaveProperty('off');
  });
});
