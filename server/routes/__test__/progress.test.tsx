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


describe('POST /progress', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return 404 if habit not found', async () => {
        // Mock empty result for existing progress query
        mPool.query.mockResolvedValueOnce([[]]);

        const res = await request(app)
            .post('/progress')
            .send({ email: 'test@example.com', habitName: 'NonExistentHabit', progress: 5 });

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error', 'Habit not found');
    });

    test('should update progress when habit exists', async () => {
        const existingProgress = [{ goalValue: 10, streak: 0 }];

        // Mock existing progress record
        mPool.query.mockResolvedValueOnce([existingProgress]);
        // Mock update query result
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

        const res = await request(app)
            .post('/progress')
            .send({ email: 'test@example.com', habitName: 'ExistingHabit', progress: 5 });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Progress updated');
    });

    test('should update progress with streak when completed', async () => {
        const existingProgress = [{ goalValue: 5, streak: 0 }];

        // Mock existing progress record with progress >= goalValue
        mPool.query.mockResolvedValueOnce([existingProgress]);
        // Mock query to get recent progress
        mPool.query.mockResolvedValueOnce([[{ completed: true, streak: 2 }]]);
        // Mock update query result
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

        const res = await request(app)
            .post('/progress')
            .send({ email: 'test@example.com', habitName: 'ExistingHabit', progress: 5 });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Progress updated');
    });

    test('should update completed when goalValue is null', async () => {
        const existingProgress = [{ goalValue: null, streak: 0 }];

        mPool.query.mockResolvedValueOnce([existingProgress]);
        mPool.query.mockResolvedValueOnce([[{ completed: true, streak: 2 }]]);
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

        const res = await request(app)
            .post('/progress')
            .send({ email: 'test@example.com', habitName: 'ExistingHabit', progress: 1 });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Progress updated');
    });

    test('should update streak to 1 when most recent day isnt completed', async () => {
        const existingProgress = [{ goalValue: null, completed: false, streak: 0 }];

        mPool.query.mockResolvedValueOnce([existingProgress]);
        mPool.query.mockResolvedValueOnce([[{ completed: false, streak: 0 }]]);
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

        const res = await request(app)
            .post('/progress')
            .send({ email: 'test@example.com', habitName: 'ExistingHabit', progress: 1 });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Progress updated');
    });

    test('should handle database errors', async () => {
        // Mock database error
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app)
            .post('/progress')
            .send({ email: 'test@example.com', habitName: 'ExistingHabit', progress: 5 });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Internal server error');
    });
});


describe('GET /progress/:email/:date', () => {
    test('should return 404 if user not found', async () => {
        // Mock empty user result
        mPool.query.mockResolvedValueOnce([[]]);

        const res = await request(app).get('/progress/nonexistent@example.com/2023-01-01');

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error', 'User not found');
    });

    test('should return progress data for a specific date', async () => {
        const progressData = [
            { progress: 5, completed: false, streak: 0, goalValue: 10, habitType: 'build' }
        ];

        // Mock user exists
        mPool.query.mockResolvedValueOnce([[{ email: 'test@example.com' }]]);
        // Mock progress data
        mPool.query.mockResolvedValueOnce([progressData]);

        const res = await request(app).get('/progress/test@example.com/2023-01-01');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(progressData);
    });

    test('should handle database errors', async () => {
        // Mock database error
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app).get('/progress/test@example.com/2023-01-01');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Error fetching habit progress data');
    });
});

describe('GET /progress/:email/:habitName/:date', () => {
    test('should return progress data for a specific habit and date', async () => {
        const progressData = { progress: 5 };

        mPool.query.mockResolvedValueOnce([[progressData]]);

        const res = await request(app).get('/progress/test@example.com/TestHabit/2023-01-01');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(progressData);
    });

    test('should return default progress when no data exists', async () => {
        mPool.query.mockResolvedValueOnce([[]]);

        const res = await request(app).get('/progress/test@example.com/TestHabit/2023-01-01');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ progress: 0 });
    });

    test('should handle database errors', async () => {
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app).get('/progress/test@example.com/TestHabit/2023-01-01');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Error fetching habit progress data');
    });
});

describe('GET /progress/streak/:email/:habitName/:date', () => {
    test('should return streak data for a specific habit and date', async () => {
        const streakData = { streak: 5 };

        mPool.query.mockResolvedValueOnce([[streakData]]);

        const res = await request(app).get('/progress/streak/test@example.com/TestHabit/2023-01-01');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(streakData);
    });

    test('should return default streak when no data exists', async () => {
        mPool.query.mockResolvedValueOnce([[]]);

        const res = await request(app).get('/progress/streak/test@example.com/TestHabit/2023-01-01');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ streak: 0 });
    });

    test('should handle database errors', async () => {
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app).get('/progress/streak/test@example.com/TestHabit/2023-01-01');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Error fetching habit streak data');
    });
});
