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

import app from "../../server";
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

describe('GET /stats/longest-streak/:email/:habitName', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return longest streak for a habit', async () => {
        // Mock database response with a streak value
        mPool.query.mockResolvedValueOnce([[{ longestStreak: 5 }]]);

        const res = await request(app)
            .get('/stats/longest-streak/test@example.com/TestHabit');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('longestStreak', 5);
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT MAX(streak) as longestStreak'),
            ['test@example.com', 'TestHabit']
        );
    });

    test('should return 0 when no streak exists', async () => {
        // Mock database response with null streak
        mPool.query.mockResolvedValueOnce([[{ longestStreak: null }]]);

        const res = await request(app)
            .get('/stats/longest-streak/test@example.com/TestHabit');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('longestStreak', 0);
    });

    test('should handle server errors', async () => {
        // Mock database error
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app)
            .get('/stats/longest-streak/test@example.com/TestHabit');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Server error');
    });
});

describe('GET /stats/completion-rate/:email/:habitName', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return completion rate for a habit', async () => {
        // Mock database response with completion data
        mPool.query.mockResolvedValueOnce([[{ completedDays: 7, totalDays: 10 }]]);

        const res = await request(app)
            .get('/stats/completion-rate/test@example.com/TestHabit');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('completionRate', 70); // (7/10) * 100 = 70
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT'),
            ['test@example.com', 'TestHabit']
        );
    });

    test('should return 0 when no days exist', async () => {
        // Mock database response with no days
        mPool.query.mockResolvedValueOnce([[{ completedDays: 0, totalDays: 0 }]]);

        const res = await request(app)
            .get('/stats/completion-rate/test@example.com/TestHabit');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('completionRate', 0);
    });

    test('should handle server errors', async () => {
        // Mock database error
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app)
            .get('/stats/completion-rate/test@example.com/TestHabit');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Server error');
    });
});

describe('GET /stats/average-progress/:email/:habitName', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return average progress for a habit', async () => {
        // Mock database response with average progress data
        mPool.query.mockResolvedValueOnce([[{ averageProgress: 7.5 }]]);

        const res = await request(app)
            .get('/stats/average-progress/test@example.com/TestHabit');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('averageProgress', 8); // Math.round(7.5) = 8
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT'),
            ['test@example.com', 'TestHabit']
        );
    });

    test('should return 0 when no progress data exists', async () => {
        // Mock database response with no progress data
        mPool.query.mockResolvedValueOnce([[{ averageProgress: null }]]);

        const res = await request(app)
            .get('/stats/average-progress/test@example.com/TestHabit');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('averageProgress', 0);
    });

    test('should handle server errors', async () => {
        // Mock database error
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app)
            .get('/stats/average-progress/test@example.com/TestHabit');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Server error');
    });
});

describe('GET /stats/streak/:email/:habitName', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return streak data for week range', async () => {
        // Mock database response with streak data
        mPool.query.mockResolvedValueOnce([[
            { progressDate: '2023-01-01', streak: 3 },
            { progressDate: '2023-01-02', streak: 4 }
        ]]);

        const res = await request(app)
            .get('/stats/streak/test@example.com/TestHabit?range=week');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0]).toHaveProperty('progressDate', '2023-01-01');
        expect(res.body[0]).toHaveProperty('streak', 3);
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT progressDate, streak'),
            expect.arrayContaining(['test@example.com', 'TestHabit'])
        );
    });

    test('should return streak data for month range', async () => {
        // Mock database response with streak data
        mPool.query.mockResolvedValueOnce([[
            { progressDate: '2023-01-01', streak: 5 },
            { progressDate: '2023-01-15', streak: 8 }
        ]]);

        const res = await request(app)
            .get('/stats/streak/test@example.com/TestHabit?range=month');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[1]).toHaveProperty('progressDate', '2023-01-15');
        expect(res.body[1]).toHaveProperty('streak', 8);
    });

    test('should return 400 for invalid range', async () => {
        const res = await request(app)
            .get('/stats/streak/test@example.com/TestHabit?range=year');

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'Invalid range: use "week" or "month"');
    });

    test('should handle server errors', async () => {
        // Mock database error
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app)
            .get('/stats/streak/test@example.com/TestHabit?range=week');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Server error');
    });
});

describe('GET /stats/:email/:habitName', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return progress data for week range', async () => {
        // Mock database response with progress data
        mPool.query.mockResolvedValueOnce([[
            { progressDate: '2023-01-01', progress: 75 },
            { progressDate: '2023-01-02', progress: 80 }
        ]]);

        const res = await request(app)
            .get('/stats/test@example.com/TestHabit?range=week');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0]).toHaveProperty('progressDate', '2023-01-01');
        expect(res.body[0]).toHaveProperty('progress', 75);
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT progressDate, progress'),
            expect.arrayContaining(['test@example.com', 'TestHabit'])
        );
    });

    test('should return progress data for month range', async () => {
        // Mock database response with progress data
        mPool.query.mockResolvedValueOnce([[
            { progressDate: '2023-01-01', progress: 60 },
            { progressDate: '2023-01-15', progress: 90 }
        ]]);

        const res = await request(app)
            .get('/stats/test@example.com/TestHabit?range=month');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[1]).toHaveProperty('progressDate', '2023-01-15');
        expect(res.body[1]).toHaveProperty('progress', 90);
    });

    test('should return monthly average progress data for year range', async () => {
        // Mock database response with monthly average progress data
        mPool.query.mockResolvedValueOnce([[
            { month: 1, avgProgress: 75.5 },
            { month: 2, avgProgress: 82.3 }
        ]]);

        const res = await request(app)
            .get('/stats/test@example.com/TestHabit?range=year');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(2);
        expect(res.body[0]).toHaveProperty('month', 1);
        expect(res.body[0]).toHaveProperty('avgProgress', 75.5);
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT MONTH(progressDate) as month, AVG(progress) as avgProgress'),
            expect.arrayContaining(['test@example.com', 'TestHabit'])
        );
    });

    test('should return 400 for invalid range', async () => {
        const res = await request(app)
            .get('/stats/test@example.com/TestHabit?range=invalid');

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'Invalid range');
    });

    test('should handle server errors', async () => {
        // Mock database error
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app)
            .get('/stats/test@example.com/TestHabit?range=week');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Server error: Database error');
    });
});