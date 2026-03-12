import { createConnection } from '../src/postgres';

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({
      query: jest.fn(),
      release: jest.fn(),
    }),
  })),
}));

describe('Postgres Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a client instance with expected methods', async () => {
    const client = await createConnection();

    expect(client.query).toBeDefined();
    expect(typeof client.query).toBe('function');

    expect(client.release).toBeDefined();
    expect(typeof client.release).toBe('function');
  });
});
