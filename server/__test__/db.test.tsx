process.env.DB_HOST = 'test-host';
process.env.DB_USER = 'test-user';
process.env.DB_PASSWORD = 'test-password';
process.env.DB_NAME = 'test-db';
process.env.DB_CONNECTION_LIMIT = '10';

const mPool = {
    query: jest.fn(),
    getConnection: jest.fn().mockResolvedValue({
        query: jest.fn(),
        release: jest.fn(),
    }),
};

// Mock mysql2/promise
jest.mock('mysql2/promise', () => ({
    createPool: jest.fn(() => mPool),
}));

import { initDatabase } from '../db.js';

// Mock dotenv
jest.mock('dotenv', () => ({
    config: jest.fn(),
}));

describe('Database Module', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    test('createPool is called with correct config', () => {
        require('../db.js');

        expect(require('mysql2/promise').createPool).toHaveBeenCalledWith({
            host: 'test-host',
            user: 'test-user',
            password: 'test-password',
            database: 'test-db',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    });

    test('initDatabase creates all required tables', async () => {
        const mockConnection = {
            query: jest.fn().mockResolvedValue({}),
            release: jest.fn(),
        };

        // Make mPool.getConnection return our mockConnection object
        mPool.getConnection.mockResolvedValue(mockConnection);

        // Directly mock the pool object used in initDatabase
        const dtModule = require('../db.js');
        dtModule.pool = mPool;

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await initDatabase();

        // Check if getConnection was called
        expect(mPool.getConnection).toHaveBeenCalled();

        // Check if queries contain expected table names
        const calls = mockConnection.query.mock.calls;
        expect(calls[0][0]).toContain('CREATE TABLE IF NOT EXISTS users');
        expect(calls[1][0]).toContain('CREATE TABLE IF NOT EXISTS habits');
        expect(calls[2][0]).toContain('CREATE TABLE IF NOT EXISTS habit_progress');
        expect(calls[3][0]).toContain('CREATE TABLE IF NOT EXISTS habit_instances');
        expect(calls[4][0]).toContain('CREATE TABLE IF NOT EXISTS habit_intervals');
        expect(calls[5][0]).toContain('CREATE TABLE IF NOT EXISTS habit_days');

        // Check if connection was released
        expect(mockConnection.release).toHaveBeenCalled();

        // Check for success log
        // expect(consoleSpy).toHaveBeenCalledWith('Database initialized successfully');

        consoleSpy.mockRestore();
    });

    test('initDatabase handles errors properly', async () => {
        const mockError = new Error('Connection error');

        mPool.getConnection.mockRejectedValue(mockError);

        // Directly mock the pool object used in initDatabase
        const dtModule = require('../db.js');
        dtModule.pool = mPool;

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        await initDatabase();

        // Check if error was logged
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error initializing database:', mockError);

        consoleErrorSpy.mockRestore();
    });
});
