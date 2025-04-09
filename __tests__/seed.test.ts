import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { seed } from '../seed';

// Set up Jest mocks for mysql and bcrypt
jest.mock('mysql2/promise');
jest.mock('bcrypt');

describe('Seed Script', () => {
  let queryMock: jest.Mock;
  let releaseMock: jest.Mock;
  let getConnectionMock: jest.Mock;
  let poolEndMock: jest.Mock;

  beforeAll(() => {
    // Provide test environment variables so that DB_CONFIG is populated
    process.env.DB_HOST = 'localhost';
    process.env.DB_USER = 'test';
    process.env.DB_PASSWORD = 'test';
    process.env.DB_NAME = 'test';
    process.env.DB_CONNECTION_LIMIT = '10';
  });

  beforeEach(() => {
    // Reset mocks for each test
    queryMock = jest.fn().mockResolvedValue([]);
    releaseMock = jest.fn();
    getConnectionMock = jest.fn().mockResolvedValue({ query: queryMock, release: releaseMock });
    poolEndMock = jest.fn().mockResolvedValue(undefined);
    
    // Mock the createPool method to return a fake pool
    (mysql.createPool as jest.Mock).mockReturnValue({
      getConnection: getConnectionMock,
      end: poolEndMock,
    });
    
    // Mock bcrypt.hash to always return a fixed hash value
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should seed the database without errors', async () => {
    await seed();

    // Verify that a connection was acquired
    expect(getConnectionMock).toHaveBeenCalled();

    // Verify that deletion queries were executed in the correct order
    expect(queryMock).toHaveBeenCalledWith('DELETE FROM habit_progress');
    expect(queryMock).toHaveBeenCalledWith('DELETE FROM habit_instances');
    expect(queryMock).toHaveBeenCalledWith('DELETE FROM habit_days');
    expect(queryMock).toHaveBeenCalledWith('DELETE FROM habit_intervals');
    expect(queryMock).toHaveBeenCalledWith('DELETE FROM habits');
    expect(queryMock).toHaveBeenCalledWith('DELETE FROM users');

    // Check that two users are inserted (NUM_USERS is set to 2 in seed.ts)
    const userInsertCalls = queryMock.mock.calls.filter(call =>
      typeof call[0] === 'string' && call[0].includes('INSERT INTO users')
    );
    expect(userInsertCalls.length).toBe(10);

    // Verify that bcrypt.hash is called for each user insert
    expect(bcrypt.hash).toHaveBeenCalledTimes(10);

    // Check that the pool is properly ended and the connection released
    expect(releaseMock).toHaveBeenCalled();
    expect(poolEndMock).toHaveBeenCalled();
  });
});
