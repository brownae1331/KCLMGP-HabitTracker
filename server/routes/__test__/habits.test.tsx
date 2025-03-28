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

describe('POST /habits', () => {
    test('should add habit successfully for weekly schedule', async () => {
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // insert habit_days for first day
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // insert habit_days for second day

        mPool.query.mockResolvedValueOnce([[]]);
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
        mPool.query.mockResolvedValueOnce([[]]);
        mPool.query.mockResolvedValueOnce([[]]);

        const res = await request(app)
            .post('/habits')
            .send({
                email: 'test@example.com',
                habitName: 'HabitWeekly',
                habitDescription: 'desc',
                habitType: 'build',
                habitColor: '#000000',
                scheduleOption: 'weekly',
                selectedDays: ['Monday', 'Tuesday'],
                goalValue: '10',
                goalUnit: 'units'
            });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'Habit added successfully');
    });

    test('should add habit successfully for interval schedule', async () => {
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
        mPool.query.mockResolvedValueOnce([[{ scheduleOption: 'interval', increment: 1 }]]);
        mPool.query.mockResolvedValueOnce([[{ lastDate: null }]]);
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
        mPool.query.mockResolvedValueOnce([[]]);

        const res = await request(app)
            .post('/habits')
            .send({
                email: 'test@example.com',
                habitName: 'HabitInterval',
                habitDescription: 'desc',
                habitType: 'build',
                habitColor: '#000000',
                scheduleOption: 'interval',
                intervalDays: '1',
                selectedDays: [],
                goalValue: '10',
                goalUnit: 'units'
            });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'Habit added successfully');
    });

    test('should add habit successfully with no description, goal value, or goal units', async () => {
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // insert habit_days for first day
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // insert habit_days for second day

        mPool.query.mockResolvedValueOnce([[]]);
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
        mPool.query.mockResolvedValueOnce([[]]);
        mPool.query.mockResolvedValueOnce([[]]);

        const res = await request(app)
            .post('/habits')
            .send({
                email: 'test@example.com',
                habitName: 'HabitWeekly',
                habitType: 'build',
                habitColor: '#000000',
                scheduleOption: 'weekly',
                selectedDays: ['Monday', 'Tuesday']
            });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'Habit added successfully');
    });

    test('should return 500 if error occurs during habit addition', async () => {
        mPool.query.mockRejectedValueOnce(new Error('insert error'));
        const res = await request(app)
            .post('/habits')
            .send({
                email: 'test@example.com',
                habitName: 'HabitError',
                habitDescription: 'desc',
                habitType: 'build',
                habitColor: '#000000',
                scheduleOption: 'interval',
                intervalDays: '1',
                selectedDays: [],
                goalValue: '10',
                goalUnit: 'units'
            });
        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Error adding habit');
    });

    test('should return 409 for duplicate habit name', async () => {
        const duplicateError = new Error('Duplicate entry') as any;
        duplicateError.code = 'ER_DUP_ENTRY';
        duplicateError.sqlMessage = 'Duplicate entry for key habitName';
        mPool.query.mockRejectedValueOnce(duplicateError);

        const res = await request(app)
            .post('/habits')
            .send({
                email: 'test@example.com',
                habitName: 'HabitInterval',
                habitDescription: 'desc',
                habitType: 'build',
                habitColor: '#000000',
                scheduleOption: 'interval',
                intervalDays: '1',
                selectedDays: [],
                goalValue: '10',
                goalUnit: 'units'
            });

        expect(res.statusCode).toBe(409);
        expect(res.body).toHaveProperty('error', 'Habit already exists for this user');
    });
});

describe('PUT /habits', () => {
    test('should update habit successfully for weekly schedule', async () => {
        // Mock successful updates
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Update habits table
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Delete from habit_days
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Delete from habit_intervals
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Insert first day
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Insert second day

        const res = await request(app)
            .put('/habits')
            .send({
                email: 'test@example.com',
                habitName: 'HabitWeekly',
                habitDescription: 'updated desc',
                habitType: 'build',
                habitColor: '#111111',
                scheduleOption: 'weekly',
                selectedDays: ['Monday', 'Wednesday'],
                goalValue: '15',
                goalUnit: 'minutes'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Habit updated successfully');
    });

    test('should update habit successfully for interval schedule', async () => {
        // Mock successful updates
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Update habits table
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Delete from habit_days
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Delete from habit_intervals
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Insert into habit_intervals

        const res = await request(app)
            .put('/habits')
            .send({
                email: 'test@example.com',
                habitName: 'HabitInterval',
                habitDescription: 'updated desc',
                habitType: 'break',
                habitColor: '#222222',
                scheduleOption: 'interval',
                intervalDays: '3',
                selectedDays: [],
                goalValue: '5',
                goalUnit: 'times'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Habit updated successfully');
    });

    test('should update habit successfully with no description, goal value, or goal units', async () => {
        // Mock successful updates
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Update habits table
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Delete from habit_days
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Delete from habit_intervals
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Insert first day
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Insert second day

        const res = await request(app)
            .put('/habits')
            .send({
                email: 'test@example.com',
                habitName: 'HabitWeekly',
                habitType: 'build',
                habitColor: '#111111',
                scheduleOption: 'weekly',
                selectedDays: ['Monday', 'Wednesday']
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Habit updated successfully');
    });

    test('should handle case when today is removed from schedule', async () => {
        // Mock successful updates
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Update habits table
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Delete from habit_days
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Delete from habit_intervals
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Insert day
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // Delete from habit_progress for today

        const res = await request(app)
            .put('/habits')
            .send({
                email: 'test@example.com',
                habitName: 'HabitWeekly',
                habitDescription: 'updated desc',
                habitType: 'build',
                habitColor: '#333333',
                scheduleOption: 'weekly',
                selectedDays: ['Friday'], // Assuming today is not Friday
                goalValue: '20',
                goalUnit: 'reps'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Habit updated successfully');
    });

    test('should return 500 if error occurs during habit update', async () => {
        mPool.query.mockRejectedValueOnce(new Error('update error'));

        const res = await request(app)
            .put('/habits')
            .send({
                email: 'test@example.com',
                habitName: 'HabitError',
                habitDescription: 'desc',
                habitType: 'build',
                habitColor: '#000000',
                scheduleOption: 'weekly',
                selectedDays: ['Monday'],
                goalValue: '10',
                goalUnit: 'units'
            });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Error updating habit');
    });
});

describe('GET /habits/:email/:date', () => {
    test('should fetch habits for future date (instances)', async () => {
        const fakeRows = [{ habitName: 'Habit1' }];
        mPool.query.mockResolvedValueOnce([[]]);
        mPool.query.mockResolvedValueOnce([fakeRows]);
        const res = await request(app).get('/habits/test@example.com/2050-01-01');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(fakeRows);
    });

    test('should fetch habits for past date (progress)', async () => {
        const fakeRows = [{ habitName: 'Habit2' }];
        mPool.query.mockResolvedValueOnce([[]]);
        mPool.query.mockResolvedValueOnce([fakeRows]);
        const res = await request(app).get('/habits/test@example.com/2000-01-01');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(fakeRows);
    });

    test('should return 500 on error', async () => {
        mPool.query.mockRejectedValueOnce(new Error('query error'));
        const res = await request(app).get('/habits/test@example.com/2000-01-01');
        expect(res.statusCode).toBe(500);
        expect(res.text).toBe('Server error');
    });

    test('should return 400 for invalid date format', async () => {
        const email = 'test@example.com';
        const invalidDate = 'invalid-date';
        const res = await request(app).get(`/habits/${email}/${invalidDate}`);
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'Invalid date format');
    });
});

describe('GET /habits/:email', () => {
    test('should return habit names and types for a user', async () => {
        const fakeHabits = [
            { habitName: 'Habit1', habitType: 'build', goalValue: 10 },
            { habitName: 'Habit2', habitType: 'quit', goalValue: 0 }
        ];
        mPool.query.mockResolvedValueOnce([fakeHabits]);

        const res = await request(app).get('/habits/test@example.com');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(fakeHabits);
    });

    test('should return empty array when user has no habits', async () => {
        mPool.query.mockResolvedValueOnce([[]]);

        const res = await request(app).get('/habits/test@example.com');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('should return 500 on database error', async () => {
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app).get('/habits/test@example.com');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Error fetching habit names and types');
    });
});

describe('DELETE /habits/:email/:habitName', () => {
    test('should delete habit successfully', async () => {
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

        const res = await request(app).delete('/habits/test@example.com/TestHabit');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message', 'Habit deleted successfully');
    });

    test('should return 500 on database error', async () => {
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app).delete('/habits/test@example.com/TestHabit');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Error deleting habit');
    });
});

describe('GET /habits/days/:email/:habitName', () => {
    test('should return habit days successfully', async () => {
        const fakeDays = [
            { day: 'Monday' },
            { day: 'Wednesday' },
            { day: 'Friday' }
        ];
        mPool.query.mockResolvedValueOnce([fakeDays]);

        const res = await request(app).get('/habits/days/test@example.com/TestHabit');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(fakeDays);
    });

    test('should return empty array when habit has no days', async () => {
        mPool.query.mockResolvedValueOnce([[]]);

        const res = await request(app).get('/habits/days/test@example.com/TestHabit');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('should return 500 on database error', async () => {
        mPool.query.mockRejectedValueOnce(new Error('Error fetching habit days'));

        const res = await request(app).get('/habits/days/test@example.com/TestHabit');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Internal server error');
    });
});

describe('GET /habits/interval/:email/:habitName', () => {
    test('should return interval data successfully', async () => {
        const fakeInterval = { increment: 3 };
        mPool.query.mockResolvedValueOnce([[fakeInterval]]);

        const res = await request(app).get('/habits/interval/test@example.com/TestHabit');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(fakeInterval);
    });

    test('should return default object when no interval data exists', async () => {
        mPool.query.mockResolvedValueOnce([[]]);

        const res = await request(app).get('/habits/interval/test@example.com/TestHabit');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({ increment: null });
    });

    test('should return 500 on database error', async () => {
        mPool.query.mockRejectedValueOnce(new Error('Error fetching habit interval'));

        const res = await request(app).get('/habits/interval/test@example.com/TestHabit');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Internal server error');
    });
});
