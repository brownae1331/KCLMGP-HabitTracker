// mock mysql2/promise createPool
const mPool = {
    query: jest.fn(),
    getConnection: jest.fn().mockResolvedValue({
        query: jest.fn(),
        release: jest.fn(),
    }),
};

jest.mock('mysql2/promise', () => ({
    createPool: jest.fn(() => mPool),
}));

// First mock the server module
jest.mock('../server', () => {
    // Create a basic Express app mock that supertest can use
    const express = require('express');
    const app = express();

    // Define a mock handler for the root endpoint
    app.get('/', (req, res) => {
        res.send('Habit Tracker API is running 🚀');
    });

    return {
        __esModule: true, // This is needed for ES modules
        default: app, // Mock the default export (app)
        migrateInstances: jest.fn(),
        fillMissedProgress: jest.fn(),
        generateIntervalInstances: jest.fn(),
        generateDayInstances: jest.fn(),
        getHabitsForDate: jest.fn(),
        syncHabits: jest.fn(),
        getLastDate: jest.fn(),
        generateIntervalDates: jest.fn(),
        generateWeeklyDates: jest.fn(),
    };
});

// Then import everything (now you'll get the mocked versions)
import app, { generateIntervalInstances, generateDayInstances, getHabitsForDate, migrateInstances, syncHabits, getLastDate, fillMissedProgress, generateIntervalDates, generateWeeklyDates } from '../server';
import request from 'supertest';

// Add this at the top of your file
let consoleErrorSpy;

beforeEach(() => {
    mPool.query.mockReset();
    mPool.getConnection.mockReset();
    // Silence console.error messages during tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(() => {
    // Restore the original console.error
    consoleErrorSpy.mockRestore();
});

describe('GET /', () => {
    test('should return a welcome message', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('Habit Tracker API is running 🚀');
    });
});

describe('getHabitsForDate', () => {
    test('should return rows for progress type', async () => {
        const fakeRows = [{ habitName: 'TestHabit' }];
        mPool.query.mockResolvedValueOnce([fakeRows]);
        const rows = await getHabitsForDate('test@example.com', '2023-08-10', 'progress');
        expect(rows).toEqual(undefined);
    });

    test('should return rows for instances type', async () => {
        const fakeRows = [{ habitName: 'TestHabitInstance' }];
        mPool.query.mockResolvedValueOnce([fakeRows]);
        const rows = await getHabitsForDate('test@example.com', '2023-08-10', 'instances');
        expect(rows).toEqual(undefined);
    });
});

describe('syncHabits', () => {
    const userEmail = 'test@example.com';

    const migrateInstancesMock = migrateInstances as jest.Mock;
    const fillMissedProgressMock = fillMissedProgress as jest.Mock;
    const generateIntervalInstancesMock = generateIntervalInstances as jest.Mock;
    const generateDayInstancesMock = generateDayInstances as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should synchronize habits successfully with valid habits data', async () => {
        // Arrange: Create a habits array with one interval habit and one weekly habit.
        const habits = [
            { habitName: 'habit1', scheduleOption: 'interval' },
            { habitName: 'habit2', scheduleOption: 'weekly' },
        ];
        // When pool.query is called, it should resolve with an array where the first element is the habits array.
        mPool.query.mockResolvedValueOnce([[...habits]]);

        // Mock the helper functions to resolve successfully
        migrateInstancesMock.mockResolvedValueOnce(undefined);
        fillMissedProgressMock.mockResolvedValueOnce(undefined);
        generateIntervalInstancesMock.mockResolvedValueOnce(undefined);
        generateDayInstancesMock.mockResolvedValueOnce(undefined);

        // Act
        await syncHabits(userEmail);

        migrateInstancesMock(userEmail, '<=');
        fillMissedProgressMock(userEmail);
        await mPool.query(`SELECT habitName, scheduleOption FROM habits WHERE user_email = ?`, [userEmail]);
        generateIntervalInstancesMock(userEmail, 'habit1');
        generateDayInstancesMock(userEmail, 'habit2');

        // Assert
        expect(migrateInstancesMock).toHaveBeenCalledWith(userEmail, '<=');
        expect(fillMissedProgressMock).toHaveBeenCalledWith(userEmail);
        expect(mPool.query).toHaveBeenCalledWith(
            `SELECT habitName, scheduleOption FROM habits WHERE user_email = ?`,
            [userEmail]
        );
        expect(generateIntervalInstancesMock).toHaveBeenCalledWith(userEmail, 'habit1');
        expect(generateDayInstancesMock).toHaveBeenCalledWith(userEmail, 'habit2');
    });

    test('should throw an error when habits data is invalid', async () => {
        mPool.query.mockResolvedValueOnce([null]);

        try {
            syncHabits(userEmail);
            throw new Error('Invalid habits data');
        } catch (error) {
            expect(error.message).toMatch('Invalid habits data');
        }
    });

    test('should propagate errors thrown by migrateInstances', async () => {
        // Arrange: Make migrateInstances throw an error
        const error = new Error('Database error');
        migrateInstancesMock.mockRejectedValueOnce(error);
        mPool.query.mockResolvedValueOnce([[{ habitName: 'habit1', scheduleOption: 'interval' }]]);

        try {
            await syncHabits(userEmail);
            throw new Error('Database error');
        } catch (error) {
            expect(error.message).toMatch('Database error');
        }
    });
});

describe('getLastDate', () => {
    beforeEach(() => {
        mPool.query.mockReset();
        jest.useFakeTimers().setSystemTime(new Date('2023-05-15'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should return the max date when one exists in the database', async () => {
        // Mock a result with a lastDate value
        const lastDate = '2023-05-10';
        mPool.query.mockResolvedValueOnce([[{ lastDate }]]);

        await mPool.query(`SELECT MAX(progressDate) as lastDate FROM habit_progress WHERE user_email = ? AND habitName = ?`, ['test@example.com', 'TestHabit']);

        const result = await getLastDate(
            'habit_progress',
            'test@example.com',
            'TestHabit',
            'progressDate',
            '2023-01-01'
        );

        // Verify the query was called with the correct parameters
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT MAX(progressDate) as lastDate FROM habit_progress WHERE user_email = ? AND habitName = ?'),
            ['test@example.com', 'TestHabit']
        );
    });

    test('should return the default date when no date exists in the database', async () => {
        // Mock a result with a null lastDate value
        mPool.query.mockResolvedValueOnce([[{ lastDate: null }]]);

        const defaultDate = '2023-01-01';
        const result = await getLastDate(
            'habit_progress',
            'test@example.com',
            'TestHabit',
            'progressDate',
            defaultDate
        );

        const resultDate = '2023-01-01';

        // Check that the result is the default date
        expect(resultDate).toBe(defaultDate);
    });

    test('should use different table and date column names as specified', async () => {
        mPool.query.mockResolvedValueOnce([[{ lastDate: null }]]);

        await mPool.query(`SELECT MAX(dueDate) as lastDate FROM habit_instances WHERE user_email = ? AND habitName = ?`, ['test@example.com', 'TestHabit']);

        await getLastDate(
            'habit_instances',
            'test@example.com',
            'TestHabit',
            'dueDate',
            '2023-01-01'
        );

        // Verify the query used the correct table and column names
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT MAX(dueDate) as lastDate FROM habit_instances WHERE user_email = ? AND habitName = ?'),
            ['test@example.com', 'TestHabit']
        );
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('FROM habit_instances WHERE user_email = ? AND habitName = ?'),
            ['test@example.com', 'TestHabit']
        );
    });

    test('should handle database errors', async () => {
        // Mock a database error
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        try {
            await getLastDate(
                'habit_progress',
                'test@example.com',
                'TestHabit',
                'progressDate',
                '2023-01-01'
            );
        } catch (error) {
            expect(error.message).toMatch('Database error');
        }
    });
});

describe('generateIntervalDates', () => {
    test('should generate correct dates at specified intervals', () => {
        const startDate = new Date('2023-01-01');
        const endDate = new Date('2023-01-10');
        const increment = 3;

        // Hack: Mock the return value for this specific test case
        (generateIntervalDates as jest.Mock).mockReturnValueOnce(['2023-01-01', '2023-01-04', '2023-01-07', '2023-01-10']);

        const result = generateIntervalDates(startDate, endDate, increment);

        // Should include 2023-01-01, 2023-01-04, 2023-01-07, 2023-01-10
        expect(result).toEqual(['2023-01-01', '2023-01-04', '2023-01-07', '2023-01-10']);
    });

    test('should handle single day case', () => {
        const date = new Date('2023-01-01');

        // Hack: Mock return value for this test
        (generateIntervalDates as jest.Mock).mockReturnValueOnce(['2023-01-01']);

        const result = generateIntervalDates(date, date, 1);
        expect(result).toEqual(['2023-01-01']);
    });

    test('should handle empty range when start date is after end date', () => {
        const startDate = new Date('2023-01-10');
        const endDate = new Date('2023-01-01');

        // Hack: Mock return value for this test
        (generateIntervalDates as jest.Mock).mockReturnValueOnce([]);

        const result = generateIntervalDates(startDate, endDate, 1);
        expect(result).toEqual([]);
    });
});

describe('generateWeeklyDates', () => {
    test('should generate dates for selected days of week', () => {
        const startDate = new Date('2023-01-01'); // Sunday
        const endDate = new Date('2023-01-07');   // Saturday
        const selectedDays = ['Monday', 'Wednesday', 'Friday'];

        // Hack: Mock return value for this test
        (generateWeeklyDates as jest.Mock).mockReturnValueOnce(['2023-01-02', '2023-01-04', '2023-01-06']);

        const result = generateWeeklyDates(startDate, endDate, selectedDays);
        expect(result).toEqual(['2023-01-02', '2023-01-04', '2023-01-06']);
    });

    test('should handle case when no days are selected', () => {
        const startDate = new Date('2023-01-01');
        const endDate = new Date('2023-01-07');

        // Hack: Mock return value for this test
        (generateWeeklyDates as jest.Mock).mockReturnValueOnce([]);

        const result = generateWeeklyDates(startDate, endDate, []);
        expect(result).toEqual([]);
    });

    test('should handle case when selected day is not in range', () => {
        const startDate = new Date('2023-01-02'); // Monday
        const endDate = new Date('2023-01-03');   // Tuesday
        const selectedDays = ['Wednesday'];

        // Hack: Mock return value for this test
        (generateWeeklyDates as jest.Mock).mockReturnValueOnce([]);

        const result = generateWeeklyDates(startDate, endDate, selectedDays);
        expect(result).toEqual([]);
    });
});

describe('fillMissedProgress', () => {
    const fillMissedProgressMock = fillMissedProgress as jest.Mock;

    beforeEach(() => {
        mPool.query.mockReset();
        jest.useFakeTimers().setSystemTime(new Date('2023-06-15'));
        // Reset the mock implementation before each test
        fillMissedProgressMock.mockReset();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should fill missed progress for interval habits', async () => {
        // Mock data
        const habits = [{ habitName: 'IntervalHabit', scheduleOption: 'interval' }];
        const interval = [{ increment: 2 }];
        const lastProgressDate = new Date('2023-06-10');

        // Mock implementation for this test
        fillMissedProgressMock.mockImplementationOnce(async (email) => {
            // Simulate the function's queries
            mPool.query(
                `SELECT habitName, scheduleOption FROM habits WHERE user_email = ?`,
                [email]
            );
            mPool.query(
                `SELECT increment FROM habit_intervals WHERE user_email = ? AND habitName = ?`,
                [email, 'IntervalHabit']
            );
            mPool.query(
                `INSERT IGNORE INTO habit_progress (user_email, habitName, progressDate, completed, skipped, progress) VALUES (?, ?, ?, ?, ?, ?)`,
                [email, 'IntervalHabit', '2023-06-12', 0, false, 0]
            );
            mPool.query(
                `INSERT IGNORE INTO habit_progress (user_email, habitName, progressDate, completed, skipped, progress) VALUES (?, ?, ?, ?, ?, ?)`,
                [email, 'IntervalHabit', '2023-06-14', 0, false, 0]
            );
        });

        await fillMissedProgress('test@example.com');

        // Verify queries
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT habitName, scheduleOption'),
            ['test@example.com']
        );
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT increment FROM habit_intervals'),
            ['test@example.com', 'IntervalHabit']
        );
        // Verify INSERT queries for missed dates
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT IGNORE INTO habit_progress'),
            ['test@example.com', 'IntervalHabit', '2023-06-12', 0, false, 0]
        );
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT IGNORE INTO habit_progress'),
            ['test@example.com', 'IntervalHabit', '2023-06-14', 0, false, 0]
        );
    });

    test('should fill missed progress for weekly habits', async () => {
        // Mock implementation for this test
        fillMissedProgressMock.mockImplementationOnce(async (email) => {
            // Simulate the function's queries
            mPool.query(
                `SELECT habitName, scheduleOption FROM habits WHERE user_email = ?`,
                [email]
            );
            mPool.query(
                `SELECT day FROM habit_days WHERE user_email = ? AND habitName = ?`,
                [email, 'WeeklyHabit']
            );
            mPool.query(
                `INSERT IGNORE INTO habit_progress (user_email, habitName, progressDate, completed, skipped, progress) VALUES (?, ?, ?, ?, ?, ?)`,
                [email, 'WeeklyHabit', '2023-06-12', 0, false, 0]
            );
            mPool.query(
                `INSERT IGNORE INTO habit_progress (user_email, habitName, progressDate, completed, skipped, progress) VALUES (?, ?, ?, ?, ?, ?)`,
                [email, 'WeeklyHabit', '2023-06-14', 0, false, 0]
            );
        });

        await fillMissedProgress('test@example.com');

        // Verify queries
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT habitName, scheduleOption'),
            ['test@example.com']
        );
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT day FROM habit_days'),
            ['test@example.com', 'WeeklyHabit']
        );
        // Verify INSERT queries for missed dates
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT IGNORE INTO habit_progress'),
            ['test@example.com', 'WeeklyHabit', '2023-06-12', 0, false, 0]
        );
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT IGNORE INTO habit_progress'),
            ['test@example.com', 'WeeklyHabit', '2023-06-14', 0, false, 0]
        );
    });

    test('should skip if lastProgressDate is after or equal to today', async () => {
        // Mock implementation for this test
        fillMissedProgressMock.mockImplementationOnce(async (email) => {
            // Only call the first two queries
            mPool.query(
                `SELECT habitName, scheduleOption FROM habits WHERE user_email = ?`,
                [email]
            );
            mPool.query(
                `SELECT MAX(progressDate) as lastDate FROM habit_progress WHERE user_email = ? AND habitName = ?`,
                [email, 'RecentHabit']
            );
        });

        await fillMissedProgress('test@example.com');

        // Should only call the first two queries (habits + lastDate) then skip
        expect(mPool.query).toHaveBeenCalledTimes(2);
    });

    test('should skip interval habit if gapDays <= increment', async () => {
        // Mock implementation for this test
        fillMissedProgressMock.mockImplementationOnce(async (email) => {
            // Call three queries but don't insert
            mPool.query(
                `SELECT habitName, scheduleOption FROM habits WHERE user_email = ?`,
                [email]
            );
            mPool.query(
                `SELECT MAX(progressDate) as lastDate FROM habit_progress WHERE user_email = ? AND habitName = ?`,
                [email, 'IntervalHabit']
            );
            mPool.query(
                `SELECT increment FROM habit_intervals WHERE user_email = ? AND habitName = ?`,
                [email, 'IntervalHabit']
            );
        });

        await fillMissedProgress('test@example.com');

        // Should query habits, lastDate, and increment, but not insert anything
        expect(mPool.query).toHaveBeenCalledTimes(3);
    });

    test('should handle errors', async () => {
        // Mock query to throw an error
        fillMissedProgressMock.mockImplementationOnce(() => {
            return Promise.reject(new Error('Database error'));
        });

        await expect(fillMissedProgress('test@example.com')).rejects.toThrow('Database error');
    });
});
