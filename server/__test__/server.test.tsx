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
jest.mock('../db.js', () => ({
    initDatabase: jest.fn(),
    pool: mPool,
}));
jest.mock('../routes/users.js', () => jest.fn());
jest.mock('../routes/habits.js', () => jest.fn());
jest.mock('../routes/progress.js', () => jest.fn());
jest.mock('../routes/stats.js', () => jest.fn());
jest.mock('dotenv', () => ({
    config: jest.fn(),
}));

import app, { generateIntervalInstances, generateDayInstances, 
    getHabitsForDate, syncHabits, getLastDate, 
    fillMissedProgress, generateIntervalDates, generateWeeklyDates } from '../server';
import request from 'supertest';

let consoleErrorSpy;
let consoleLogSpy;

beforeEach(() => {
    mPool.query.mockReset();
    mPool.getConnection.mockReset();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    jest.restoreAllMocks();
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
        const rows = await getHabitsForDate('test@example.com', new Date('2023-08-10'), 'progress');
        expect(rows).toEqual(fakeRows);
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('FROM habit_progress hp'),
            ['test@example.com', '2023-08-10']
        );
    });

    test('should return rows for instances type', async () => {
        const fakeRows = [{ habitName: 'TestHabitInstance' }];
        mPool.query.mockResolvedValueOnce([fakeRows]);
        const rows = await getHabitsForDate('test@example.com', new Date('2023-08-10'), 'instances');
        expect(rows).toEqual(fakeRows);
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('FROM habit_instances hi'),
            ['test@example.com', '2023-08-10']
        );
    });
});

describe('syncHabits', () => {
    const userEmail = 'test@example.com';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers().setSystemTime(new Date('2023-01-02'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should synchronize habits successfully with valid habits data', async () => {
        const habits = [
            { habitName: 'habit1', scheduleOption: 'interval' },
            { habitName: 'habit2', scheduleOption: 'weekly' },
        ];

        mPool.query
            .mockResolvedValueOnce([habits]) // For syncHabits: SELECT habitName, scheduleOption
            .mockResolvedValueOnce([]) // For migrateInstances: SELECT habitName, dueDate
            .mockResolvedValueOnce([habits]) // For fillMissedProgress: SELECT habitName, scheduleOption
            .mockResolvedValueOnce([[{ lastDate: '2023-01-01' }]]) // For fillMissedProgress: getLastDate for habit1
            .mockResolvedValueOnce([[{ increment: 2 }]]) // For fillMissedProgress: SELECT increment for habit1
            .mockResolvedValueOnce([[{ lastDate: '2023-01-01' }]]) // For fillMissedProgress: getLastDate for habit2
            .mockResolvedValueOnce([[{ day: 'Monday' }]]) // For fillMissedProgress: SELECT day for habit2
            .mockResolvedValueOnce([[{ lastDate: '2023-01-01' }]]) // For generateIntervalInstances: getLastDate for habit1
            .mockResolvedValueOnce([[{ scheduleOption: 'interval', increment: 2 }]]) // For generateIntervalInstances: SELECT scheduleOption, increment for habit1
            .mockResolvedValueOnce([[{ lastDate: '2023-01-01' }]]) // For generateDayInstances: getLastDate for habit2
            .mockResolvedValueOnce([[{ day: 'Monday' }]]); // For generateDayInstances: SELECT day for habit2

        await expect(syncHabits(userEmail)).resolves.toBeUndefined();

        expect(mPool.query).toHaveBeenCalledWith(
            `SELECT habitName, scheduleOption FROM habits WHERE user_email = ?`,
            [userEmail]
        );
    });

    test('should throw an error when habits data is invalid', async () => {
        mPool.query
            .mockResolvedValueOnce([null]);
        await expect(syncHabits(userEmail)).rejects.toThrow('Invalid habits data');
    });

    test('should handle errors in the try-catch block', async () => {
        mPool.query
            .mockRejectedValueOnce(new Error('Database error')); 

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await expect(syncHabits(userEmail)).rejects.toThrow('Database error');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error synchronizing habits:', expect.any(Error));
        consoleErrorSpy.mockRestore();
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

        const result = await getLastDate(
            'habit_progress',
            'test@example.com',
            'TestHabit',
            'progressDate',
            '2023-01-01'
        );

        expect(result).toEqual(new Date(lastDate));
        expect(mPool.query).toHaveBeenCalledWith(
            `SELECT MAX(progressDate) as lastDate\n     FROM habit_progress\n     WHERE user_email = ? AND habitName = ?`,
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

        expect(result).toEqual(new Date(defaultDate));
    });

    test('should use different table and date column names as specified', async () => {
        mPool.query.mockResolvedValueOnce([[{ lastDate: null }]]);

        const result = await getLastDate(
            'habit_instances',
            'test@example.com',
            'TestHabit',
            'dueDate',
            '2023-01-01'
          );
        
        expect(result).toEqual(new Date('2023-01-01'));
        expect(mPool.query).toHaveBeenCalledWith(
            `SELECT MAX(dueDate) as lastDate\n     FROM habit_instances\n     WHERE user_email = ? AND habitName = ?`,
            ['test@example.com', 'TestHabit']
        );
    });

    test('should handle database errors', async () => {
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        await expect(getLastDate(
            'habit_progress',
            'test@example.com',
            'TestHabit',
            'progressDate',
            '2023-01-01'
        )).rejects.toThrow('Database error');
    });
});

describe('generateIntervalDates', () => {
    test('should generate correct dates at specified intervals', () => {
        const startDate = new Date('2023-01-01');
        const endDate = new Date('2023-01-10');
        const increment = 3;

        const result = generateIntervalDates(startDate, endDate, increment);

        expect(result).toEqual(['2023-01-01', '2023-01-04', '2023-01-07', '2023-01-10']);
    });

    test('should handle single day case', () => {
        const date = new Date('2023-01-01');
        const result = generateIntervalDates(date, date, 1);
        expect(result).toEqual(['2023-01-01']);
    });

    test('should handle empty range when start date is after end date', () => {
        const startDate = new Date('2023-01-10');
        const endDate = new Date('2023-01-01');
        const result = generateIntervalDates(startDate, endDate, 1);
        expect(result).toEqual([]);
    });
});

describe('generateWeeklyDates', () => {
    test('should generate dates for selected days of week', () => {
        const startDate = new Date('2023-01-01'); // Sunday
        const endDate = new Date('2023-01-07');   // Saturday
        const selectedDays = ['Monday', 'Wednesday', 'Friday'];

        const result = generateWeeklyDates(startDate, endDate, selectedDays);
        expect(result).toEqual(['2023-01-02', '2023-01-04', '2023-01-06']);
    });

    test('should handle case when no days are selected', () => {
        const startDate = new Date('2023-01-01');
        const endDate = new Date('2023-01-07');
        const result = generateWeeklyDates(startDate, endDate, []);
        expect(result).toEqual([]);
    });

    test('should handle case when selected day is not in range', () => {
        const startDate = new Date('2023-01-02'); // Monday
        const endDate = new Date('2023-01-03');   // Tuesday
        const selectedDays = ['Wednesday'];
        const result = generateWeeklyDates(startDate, endDate, selectedDays);
        expect(result).toEqual([]);
    });
});

describe('fillMissedProgress', () => {
    beforeEach(() => {
        mPool.query.mockReset();
        jest.useFakeTimers().setSystemTime(new Date('2023-06-15'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('should fill missed progress for interval habits', async () => {
        const habits = [{ habitName: 'IntervalHabit', scheduleOption: 'interval' }];
        const interval = [{ increment: 2 }];
        const lastProgressDate = '2023-06-10';

        mPool.query
            .mockResolvedValueOnce([habits]) // SELECT habitName, scheduleOption
            .mockResolvedValueOnce([[{ lastDate: lastProgressDate }]]) // SELECT MAX(progressDate)
            .mockResolvedValueOnce([interval]); // SELECT increment

        await fillMissedProgress('test@example.com');

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
        const habits = [{ habitName: 'WeeklyHabit', scheduleOption: 'weekly' }];
        const days = [{ day: 'Monday' }, { day: 'Wednesday' }];
        const lastProgressDate = '2023-06-10';

        mPool.query
            .mockResolvedValueOnce([habits]) // SELECT habitName, scheduleOption
            .mockResolvedValueOnce([[{ lastDate: lastProgressDate }]]) // SELECT MAX(progressDate)
            .mockResolvedValueOnce([days]); // SELECT day

        await fillMissedProgress('test@example.com');

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
        const habits = [{ habitName: 'RecentHabit', scheduleOption: 'interval' }];
        mPool.query
            .mockResolvedValueOnce([habits]) // SELECT habitName, scheduleOption
            .mockResolvedValueOnce([[{ lastDate: '2023-06-15' }]]); // SELECT MAX(progressDate)

        await fillMissedProgress('test@example.com');

        expect(mPool.query).toHaveBeenCalledTimes(2);
    });

    test('should skip interval habit if gapDays <= increment', async () => {
        const habits = [{ habitName: 'IntervalHabit', scheduleOption: 'interval' }];
        const interval = [{ increment: 5 }];
        mPool.query
            .mockResolvedValueOnce([habits]) // SELECT habitName, scheduleOption
            .mockResolvedValueOnce([[{ lastDate: '2023-06-12' }]]) // SELECT MAX(progressDate)
            .mockResolvedValueOnce([interval]); // SELECT increment

        await fillMissedProgress('test@example.com');

        expect(mPool.query).toHaveBeenCalledTimes(3);
    });

    test('should handle errors', async () => {
        mPool.query.mockRejectedValueOnce(new Error('Database error'));
        await expect(fillMissedProgress('test@example.com')).rejects.toThrow('Database error');
    });
});

describe('generateIntervalInstances', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2023-01-03'));
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    test('should generate interval instances for a habit', async () => {
        mPool.query
            .mockResolvedValueOnce([[{ lastDate: '2023-01-01' }]]) // getLastDate
            .mockResolvedValueOnce([[{ scheduleOption: 'interval', increment: 2 }]]) // SELECT scheduleOption, increment
            .mockResolvedValueOnce([]); // INSERT IGNORE INTO habit_instances
        await expect(generateIntervalInstances('test@example.com', 'TestHabit')).resolves.toBeUndefined();
        expect(mPool.query).toHaveBeenCalled();
        expect(mPool.query.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
    test('should skip if habit is not an interval habit', async () => {
        mPool.query
            .mockResolvedValueOnce([[{ lastDate: '2023-01-01' }]]) // getLastDate
            .mockResolvedValueOnce([[{ scheduleOption: 'weekly', increment: null }]]); // SELECT scheduleOption, increment
        await expect(generateIntervalInstances('test@example.com', 'TestHabit')).resolves.toBeUndefined();
        expect(mPool.query).toHaveBeenCalledTimes(1);
    });
    test('should handle errors during generation', async () => {
        mPool.query
            .mockRejectedValueOnce(new Error('Database error')); // getLastDate fails
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await expect(generateIntervalInstances('test@example.com', 'TestHabit')).resolves.toBeUndefined();
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating missing interval instances:', expect.any(Error));
        consoleErrorSpy.mockRestore();
    });
});

describe('generateDayInstances', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2023-01-02')); // Monday
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    test('should generate daily instances for a habit', async () => {
        mPool.query
            .mockResolvedValueOnce([[{ lastDate: '2023-01-01' }]]) // getLastDate
            .mockResolvedValueOnce([[{ day: 'Monday' }]]) // SELECT day
            .mockResolvedValueOnce([]); // INSERT IGNORE INTO habit_instances
        await expect(generateDayInstances('test@example.com', 'TestHabit')).resolves.toBeUndefined();
        expect(mPool.query).toHaveBeenCalled();
        expect(mPool.query.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
    test('should skip if no scheduled days are found', async () => {
        mPool.query
            .mockResolvedValueOnce([[{ lastDate: '2023-01-01' }]]) // getLastDate
            .mockResolvedValueOnce([]); // SELECT day (no days)
        await expect(generateDayInstances('test@example.com', 'TestHabit')).resolves.toBeUndefined();
        expect(mPool.query).toHaveBeenCalledTimes(1);
    });
    test('should handle errors during generation', async () => {
        mPool.query
            .mockRejectedValueOnce(new Error('Database error')); // getLastDate fails
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await expect(generateDayInstances('test@example.com', 'TestHabit')).resolves.toBeUndefined();
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating missing day instances:', expect.any(Error));
        consoleErrorSpy.mockRestore();
    });
});