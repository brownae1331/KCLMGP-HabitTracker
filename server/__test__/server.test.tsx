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



import app, { generateIntervalInstances, generateDayInstances, getHabitsForDate, migrateInstances, syncHabits, getLastDate, fillMissedProgress, generateIntervalDates, generateWeeklyDates } from '../server';

// for ensuring the server is closed after all tests
beforeEach(() => {
    mPool.query.mockReset();
    mPool.getConnection.mockReset();
});

// describe('initDatabase', () => {
//     test('should log error when getConnection fails', async () => {
//       // mock getConnection to reject with an error
//       const originalGetConnection = mPool.getConnection;
//       mPool.getConnection.mockRejectedValueOnce(new Error('connection error'));

//       const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

//       await initDatabase();

//       expect(consoleErrorSpy).toHaveBeenCalledWith('Error initializing database:', expect.any(Error));

//       consoleErrorSpy.mockRestore();
//       mPool.getConnection = originalGetConnection;
//     });
// });

describe('getHabitsForDate', () => {
    test('should return rows for progress type', async () => {
        const fakeRows = [{ habitName: 'TestHabit' }];
        mPool.query.mockResolvedValueOnce([fakeRows]);
        const rows = await getHabitsForDate('test@example.com', '2023-08-10', 'progress');
        expect(rows).toEqual(fakeRows);
    });

    test('should return rows for instances type', async () => {
        const fakeRows = [{ habitName: 'TestHabitInstance' }];
        mPool.query.mockResolvedValueOnce([fakeRows]);
        const rows = await getHabitsForDate('test@example.com', '2023-08-10', 'instances');
        expect(rows).toEqual(fakeRows);
    });
});

// describe('syncHabits', () => {
//     beforeEach(() => {
//         mPool.query.mockReset();
//         // Set up default mocks for fillMissedProgress to prevent errors
//         mPool.query
//             .mockResolvedValueOnce() // Mock for the habits query in syncHabits
//             .mockResolvedValueOnce() // Mock for specific habit functions
//             // Add a default mock for fillMissedProgress queries
//             .mockResolvedValueOnce([[{ habitName: 'TestHabit', scheduleOption: 'interval' }]])
//             .mockResolvedValueOnce([[{ lastDate: '2023-01-01' }]]);
//     });

//     test('should successfully synchronize habits for a user', async () => {
//         // Reset mocks to ensure clean state
//         mPool.query.mockReset();

//         const intervalHabit = { habitName: 'IntervalHabit', scheduleOption: 'interval' };
//         const weeklyHabit = { habitName: 'WeeklyHabit', scheduleOption: 'weekly' };

//         // Mock for syncHabits initial habits query
//         mPool.query.mockResolvedValueOnce([[intervalHabit, weeklyHabit]]);

//         // Mock for generateIntervalInstances
//         mPool.query.mockResolvedValueOnce([[{ scheduleOption: 'interval', increment: 1 }]]);
//         mPool.query.mockResolvedValueOnce([[{ lastDate: '2023-01-01' }]]);
//         mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
//         mPool.query.mockResolvedValueOnce([[]]);

//         // Mock for generateDayInstances
//         mPool.query.mockResolvedValueOnce([[{ day: 'Monday' }]]);
//         mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

//         // Mock for fillMissedProgress (habits query)
//         mPool.query.mockResolvedValueOnce([[intervalHabit, weeklyHabit]]);

//         // Mock for the lastDate queries in fillMissedProgress
//         mPool.query.mockResolvedValueOnce([[{ lastDate: '2023-01-01' }]]);
//         mPool.query.mockResolvedValueOnce([[{ increment: 1 }]]);
//         mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

//         // Weekly habit mocks
//         mPool.query.mockResolvedValueOnce([[{ lastDate: '2023-01-01' }]]);
//         mPool.query.mockResolvedValueOnce([[{ day: 'Monday' }]]);
//         mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

//         await syncHabits('test@example.com');
//         expect(mPool.query).toHaveBeenCalled();
//     });

//     test('should handle the case when no habits are found', async () => {
//         mPool.query.mockReset();

//         // Mock empty array response for the habits query
//         mPool.query.mockResolvedValueOnce([[]]);

//         // Mock for fillMissedProgress (habits query) - empty array
//         mPool.query.mockResolvedValueOnce([[]]);

//         await syncHabits('test@example.com');

//         // Should have only called the query once to get habits
//         expect(mPool.query).toHaveBeenCalledWith(
//             expect.stringContaining('SELECT habitName, scheduleOption'),
//             ['test@example.com']
//         );
//     });

//     test('should throw error when habits data is not an array', async () => {
//         mPool.query.mockReset();

//         // Mock invalid response (not an array)
//         mPool.query.mockResolvedValueOnce([null]);

//         await expect(syncHabits('test@example.com')).rejects.toThrow('Invalid habits data');
//     });

//     test('should catch and propagate errors', async () => {
//         mPool.query.mockReset();

//         // Mock query to throw an error
//         mPool.query.mockRejectedValueOnce(new Error('Database error'));

//         const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

//         await expect(syncHabits('test@example.com')).rejects.toThrow('Database error');

//         expect(consoleErrorSpy).toHaveBeenCalledWith(
//             'Error synchronizing habits:',
//             expect.any(Error)
//         );

//         consoleErrorSpy.mockRestore();
//     });

//     test('should handle different habit schedule options correctly', async () => {
//         mPool.query.mockReset();

//         const intervalHabit = { habitName: 'IntervalHabit', scheduleOption: 'interval' };
//         const weeklyHabit = { habitName: 'WeeklyHabit', scheduleOption: 'weekly' };
//         const unknownHabit = { habitName: 'UnknownHabit', scheduleOption: 'unknown' };

//         // Mock the habits query
//         mPool.query.mockResolvedValueOnce([[intervalHabit, weeklyHabit, unknownHabit]]);

//         // Mock for generateIntervalInstances
//         mPool.query.mockResolvedValueOnce([[{ scheduleOption: 'interval', increment: 1 }]]);
//         mPool.query.mockResolvedValueOnce([[{ lastDate: '2023-01-01' }]]);
//         mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
//         mPool.query.mockResolvedValueOnce([[]]);

//         // Mock for generateDayInstances
//         mPool.query.mockResolvedValueOnce([[{ day: 'Monday' }]]);
//         mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

//         // Mock for fillMissedProgress (habits query)
//         mPool.query.mockResolvedValueOnce([[intervalHabit, weeklyHabit, unknownHabit]]);

//         // Mock for the lastDate queries in fillMissedProgress
//         mPool.query.mockResolvedValueOnce([[{ lastDate: '2023-01-01' }]]);
//         mPool.query.mockResolvedValueOnce([[{ increment: 1 }]]);
//         mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

//         // Weekly habit mocks
//         mPool.query.mockResolvedValueOnce([[{ lastDate: '2023-01-01' }]]);
//         mPool.query.mockResolvedValueOnce([[{ day: 'Monday' }]]);
//         mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

//         // Unknown habit (should skip it)
//         mPool.query.mockResolvedValueOnce([[{ lastDate: '2023-01-01' }]]);

//         await syncHabits('test@example.com');

//         expect(mPool.query).toHaveBeenCalled();
//     });
// });

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

        // Verify the query was called with the correct parameters
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT MAX(progressDate) as lastDate'),
            ['test@example.com', 'TestHabit']
        );

        // Check that the result is a Date object with the expected value
        expect(result).toBeInstanceOf(Date);
        expect(result.toISOString().split('T')[0]).toBe(lastDate);
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

        // Check that the result is the default date
        expect(result).toBeInstanceOf(Date);
        expect(result.toISOString().split('T')[0]).toBe(defaultDate);
    });

    test('should use different table and date column names as specified', async () => {
        mPool.query.mockResolvedValueOnce([[{ lastDate: null }]]);

        await getLastDate(
            'habit_instances',
            'test@example.com',
            'TestHabit',
            'dueDate',
            '2023-01-01'
        );

        // Verify the query used the correct table and column names
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT MAX(dueDate) as lastDate'),
            ['test@example.com', 'TestHabit']
        );
        expect(mPool.query).toHaveBeenCalledWith(
            expect.stringContaining('FROM habit_instances'),
            ['test@example.com', 'TestHabit']
        );
    });

    test('should handle database errors', async () => {
        // Mock a database error
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

        // Should include 2023-01-01, 2023-01-04, 2023-01-07, 2023-01-10
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

        // Should include Monday (2023-01-02), Wednesday (2023-01-04), Friday (2023-01-06)
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
        // Mock data
        const habits = [{ habitName: 'IntervalHabit', scheduleOption: 'interval' }];
        const interval = [{ increment: 2 }];
        const lastProgressDate = new Date('2023-06-10');

        // Mock queries
        mPool.query
            .mockResolvedValueOnce([[...habits]]) // SELECT habits query
            .mockResolvedValueOnce([[{ lastDate: lastProgressDate.toISOString().split('T')[0] }]]) // getLastDate query
            .mockResolvedValueOnce([[...interval]]) // SELECT increment query
            .mockResolvedValueOnce([{ affectedRows: 1 }]) // First INSERT query (2023-06-12)
            .mockResolvedValueOnce([{ affectedRows: 1 }]); // Second INSERT query (2023-06-14)

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
        // Mock data
        const habits = [{ habitName: 'WeeklyHabit', scheduleOption: 'weekly' }];
        const days = [{ day: 'Monday' }, { day: 'Wednesday' }];
        const lastProgressDate = new Date('2023-06-07'); // Wednesday

        // Mock queries
        mPool.query
            .mockResolvedValueOnce([[...habits]]) // SELECT habits query
            .mockResolvedValueOnce([[{ lastDate: lastProgressDate.toISOString().split('T')[0] }]]) // getLastDate query
            .mockResolvedValueOnce([[...days]]) // SELECT days query
            .mockResolvedValueOnce([{ affectedRows: 1 }]) // INSERT for Monday (2023-06-12)
            .mockResolvedValueOnce([{ affectedRows: 1 }]); // INSERT for Wednesday (2023-06-14)

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
        // Mock data
        const habits = [{ habitName: 'RecentHabit', scheduleOption: 'interval' }];
        const tomorrow = new Date('2023-06-16'); // After today

        // Mock queries
        mPool.query
            .mockResolvedValueOnce([[...habits]]) // SELECT habits query
            .mockResolvedValueOnce([[{ lastDate: tomorrow.toISOString().split('T')[0] }]]); // getLastDate query

        await fillMissedProgress('test@example.com');

        // Should only call the first two queries (habits + lastDate) then skip
        expect(mPool.query).toHaveBeenCalledTimes(2);
    });

    test('should skip interval habit if gapDays <= increment', async () => {
        // Mock data
        const habits = [{ habitName: 'IntervalHabit', scheduleOption: 'interval' }];
        const interval = [{ increment: 10 }]; // Large increment
        const yesterday = new Date('2023-06-14'); // 1 day before today

        // Mock queries
        mPool.query
            .mockResolvedValueOnce([[...habits]]) // SELECT habits query
            .mockResolvedValueOnce([[{ lastDate: yesterday.toISOString().split('T')[0] }]]) // getLastDate query
            .mockResolvedValueOnce([[...interval]]); // SELECT increment query

        await fillMissedProgress('test@example.com');

        // Should query habits, lastDate, and increment, but not insert anything
        expect(mPool.query).toHaveBeenCalledTimes(3);
    });

    test('should handle errors', async () => {
        // Mock query to throw an error
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        await expect(fillMissedProgress('test@example.com')).rejects.toThrow('Database error');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error filling missed progress:',
            expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
    });
});



// describe('Server API Endpoints', () => {

//     describe('GET /', () => {
//         test('should return running message', async () => {
//             const res = await request(app).get('/');

//             expect(res.statusCode).toBe(200);
//             expect(res.text).toContain('Habit Tracker API is running');
//         });
//     });


//     describe('GET /users', () => {
//         test('should return list of users', async () => {
//             const users = [{ email: 'test@example.com', username: 'testuser', password: 'hash' }];
//             mPool.query.mockResolvedValueOnce([users]);

//             const res = await request(app).get('/users');
//             expect(res.statusCode).toBe(200);
//             expect(res.body).toEqual(users);
//         });

//         test('should return 500 on database error', async () => {
//             mPool.query.mockRejectedValueOnce(new Error('db error'));
//             const res = await request(app).get('/users');
//             expect(res.statusCode).toBe(500);
//             expect(res.body).toHaveProperty('error', 'Database query failed');
//         });
//     });





//     describe('DELETE /users/:username', () => {

//         test('should delete user successfully', async () => {
//             mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
//             const res = await request(app).delete('/users/testuser');
//             expect(res.statusCode).toBe(200);
//             expect(res.body).toHaveProperty('success', true);
//         });

//         test('should return 404 if user not found', async () => {
//             mPool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
//             const res = await request(app).delete('/users/nonexistent');
//             expect(res.statusCode).toBe(404);
//             expect(res.body).toHaveProperty('error', 'User nonexistent not found.');
//         });

//         test('should return 500 on error', async () => {
//             mPool.query.mockRejectedValueOnce(new Error('delete error'));
//             const res = await request(app).delete('/users/testuser');
//             expect(res.statusCode).toBe(500);
//             expect(res.body).toHaveProperty('error', 'Error deleting user');
//         });
//     });



//     describe('DELETE /habits/:username/:name', () => {
//         it('should return 500 due to ReferenceError (bug in code)', async () => {
//             // as the erroneous use of an undefined variable 'habitName', this endpoint will inevitably enter the catch block and return a 500 error
//             const res = await request(app).delete('/habits/testuser/habit1');
//             expect(res.statusCode).toBe(500);
//             expect(res.body).toHaveProperty('error', 'Error deleting habit');
//         });
//     });

//     describe('POST /habit-progress', () => {
//         const today = new Date().toISOString().split('T')[0];

//         test('should insert new progress if none exists', async () => {
//             // mock no existing progress record, return empty array in first query
//             mPool.query.mockResolvedValueOnce([[]]);
//             // INSERT returns an object with insertId, indicating successful insert
//             mPool.query.mockResolvedValueOnce([{ insertId: 42 }]);

//             const res = await request(app)
//                 .post('/habit-progress')
//                 .send({ email: 'test@example.com', habitName: 'Habit1', progress: 5 });

//             expect(res.statusCode).toBe(200);
//             expect(res.body).toHaveProperty('message', 'Progress updated');
//         });

//         test('should update progress when existing progress exists and not completed', async () => {
//             const existingRow = { goalValue: 10, streak: 0 };
//             // mock existing progress record, and progress < goalValue
//             mPool.query.mockResolvedValueOnce([[existingRow]]);
//             // UPDATE returns an object with affectedRows: 1, indicating successful update
//             mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

//             const res = await request(app)
//                 .post('/habit-progress')
//                 .send({ email: 'test@example.com', habitName: 'Habit1', progress: 5 });

//             expect(res.statusCode).toBe(200);
//             expect(res.body).toHaveProperty('message', 'Progress updated');
//         });

//         test('should update progress with streak when completed', async () => {
//             const existingRow = { goalValue: 5, streak: 2 };
//             // mock existing progress record, and progress >= goalValue
//             mPool.query
//                 .mockResolvedValueOnce([[existingRow]])
//                 //mock query to return streak value
//                 .mockResolvedValueOnce([[{ streak: 2 }]])
//                 // UPDATE returns an object with affectedRows: 1, indicating successful update
//                 .mockResolvedValueOnce([{ affectedRows: 1 }]);

//             const res = await request(app)
//                 .post('/habit-progress')
//                 .send({ email: 'test@example.com', habitName: 'Habit1', progress: 5 });

//             expect(res.statusCode).toBe(200);
//             expect(res.body).toHaveProperty('message', 'Progress updated');
//         });

//         test('should return 500 on error', async () => {
//             mPool.query.mockRejectedValueOnce(new Error('query error'));
//             const res = await request(app)
//                 .post('/habit-progress')
//                 .send({ email: 'test@example.com', habitName: 'Habit1', progress: 5 });
//             expect(res.statusCode).toBe(500);
//             expect(res.body).toHaveProperty('error', 'Internal server error');
//         });
//     });


//     describe('GET /habit-progress/:email/:habitName', () => {

//         test('should return 404 if user not found', async () => {
//             mPool.query.mockResolvedValueOnce([[]]);
//             const res = await request(app).get('/habit-progress/test@example.com/Habit1?range=7');
//             expect(res.statusCode).toBe(404);
//             expect(res.body).toHaveProperty('error', 'User not found');
//         });

//         test('should return progress data for range 7', async () => {
//             const today = new Date().toISOString().split('T')[0];
//             const progressData = [{ progressDate: today, progress: 5 }];
//             mPool.query
//                 .mockResolvedValueOnce([[{ email: 'test@example.com' }]]) // user exists
//                 .mockResolvedValueOnce([progressData]); // query progress records
//             const res = await request(app).get('/habit-progress/test@example.com/Habit1?range=7');
//             expect(res.statusCode).toBe(200);
//             expect(res.body).toEqual(progressData);
//         });

//         test('should return 400 for invalid range parameter', async () => {
//             mPool.query.mockResolvedValueOnce([[{ email: 'test@example.com' }]]);
//             const res = await request(app).get('/habit-progress/test@example.com/Habit1?range=invalid');
//             expect(res.statusCode).toBe(400);
//             expect(res.body).toHaveProperty('error', 'Invalid range parameter (use 7, 30, month, or year)');
//         });

//         test('should return 500 for range "month" due to undefined startDate', async () => {
//             mPool.query.mockResolvedValueOnce([[{ email: 'test@example.com' }]]);
//             const res = await request(app).get('/habit-progress/test@example.com/Habit1?range=30');
//             expect(res.statusCode).toBe(500);
//             expect(res.body).toHaveProperty('error', 'Error fetching habit progress data');
//         });
//     });

//     describe('GET /habit-progress-by-date/:email/:date', () => {

//         test('should return 404 if user not found', async () => {
//             mPool.query.mockResolvedValueOnce([[]]);
//             const res = await request(app).get('/habit-progress-by-date/test@example.com/2000-01-01');
//             expect(res.statusCode).toBe(404);
//             expect(res.body).toHaveProperty('error', 'User not found');
//         });

//         test('should return progress data', async () => {
//             const progressData = [{ progress: 5, completed: false, streak: 0, goalValue: 10, habitType: 'build' }];
//             mPool.query
//                 .mockResolvedValueOnce([[{ email: 'test@example.com' }]])
//                 .mockResolvedValueOnce([progressData]);
//             const res = await request(app).get('/habit-progress-by-date/test@example.com/2000-01-01');
//             expect(res.statusCode).toBe(200);
//             expect(res.body).toEqual(progressData);
//         });

//         test('should return 500 on error', async () => {
//             mPool.query.mockRejectedValueOnce(new Error('query error'));
//             const res = await request(app).get('/habit-progress-by-date/test@example.com/2000-01-01');
//             expect(res.statusCode).toBe(500);
//             expect(res.body).toHaveProperty('error', 'Error fetching habit progress data');
//         });
//     });

//     describe('GET /habit-progress/:email/:habitName with range "month"', () => {
//         test('should return progress data for month range', async () => {
//             // mock user exists
//             mPool.query.mockResolvedValueOnce([[{ email: 'test@example.com' }]]);
//             //mock month branch SELECT query returns correct summary data
//             mPool.query.mockResolvedValueOnce([[{ year: 2023, month: 8, avg_value: 5 }]]);

//             const res = await request(app).get('/habit-progress/test@example.com/Habit1?range=month');
//             expect(res.statusCode).toBe(200);
//             expect(res.body).toEqual([{ year: 2023, month: 8, avg_value: 5 }]);
//         });
//     });


//     describe('POST /habits', () => {

//         test('should add habit successfully for weekly schedule', async () => {
//             mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
//             mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // insert habit_days for first day
//             mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // insert habit_days for second day

//             mPool.query.mockResolvedValueOnce([[]]);
//             mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
//             mPool.query.mockResolvedValueOnce([[]]);
//             mPool.query.mockResolvedValueOnce([[]]);

//             const res = await request(app)
//                 .post('/habits')
//                 .send({
//                     email: 'test@example.com',
//                     habitName: 'HabitWeekly',
//                     habitDescription: 'desc',
//                     habitType: 'build',
//                     habitColor: '#000000',
//                     scheduleOption: 'weekly',
//                     selectedDays: ['Monday', 'Tuesday'],
//                     goalValue: '10',
//                     goalUnit: 'units'
//                 });
//             expect(res.statusCode).toBe(201);
//             expect(res.body).toHaveProperty('message', 'Habit added successfully');
//         });

//         test('should add habit successfully for interval schedule', async () => {
//             mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
//             mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
//             mPool.query.mockResolvedValueOnce([[{ scheduleOption: 'interval', increment: 1 }]]);
//             mPool.query.mockResolvedValueOnce([[{ lastDate: null }]]);
//             mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
//             mPool.query.mockResolvedValueOnce([[]]);

//             const res = await request(app)
//                 .post('/habits')
//                 .send({
//                     email: 'test@example.com',
//                     habitName: 'HabitInterval',
//                     habitDescription: 'desc',
//                     habitType: 'build',
//                     habitColor: '#000000',
//                     scheduleOption: 'interval',
//                     intervalDays: '1',
//                     selectedDays: [],
//                     goalValue: '10',
//                     goalUnit: 'units'
//                 });
//             expect(res.statusCode).toBe(201);
//             expect(res.body).toHaveProperty('message', 'Habit added successfully');
//         });

//         test('should return 500 if error occurs during habit addition', async () => {
//             mPool.query.mockRejectedValueOnce(new Error('insert error'));
//             const res = await request(app)
//                 .post('/habits')
//                 .send({
//                     email: 'test@example.com',
//                     habitName: 'HabitError',
//                     habitDescription: 'desc',
//                     habitType: 'build',
//                     habitColor: '#000000',
//                     scheduleOption: 'interval',
//                     intervalDays: '1',
//                     selectedDays: [],
//                     goalValue: '10',
//                     goalUnit: 'units'
//                 });
//             expect(res.statusCode).toBe(500);
//             expect(res.body).toHaveProperty('error', 'Error adding habit');
//         });
//     });


//     describe('POST /users/update-password', () => {

//         test('should return 404 if user not found', async () => {
//             mPool.query.mockResolvedValueOnce([[]]);
//             const res = await request(app)
//                 .post('/users/update-password')
//                 .send({ username: 'testuser', oldPassword: 'old', newPassword: 'newpassword' });
//             expect(res.statusCode).toBe(404);
//             expect(res.body).toHaveProperty('error', 'User not found');
//         });

//         test('should return 400 if old password is incorrect', async () => {
//             const user = { username: 'testuser', password: await bcrypt.hash('correct', 10) };
//             mPool.query.mockResolvedValueOnce([[user]]);
//             const res = await request(app)
//                 .post('/users/update-password')
//                 .send({ username: 'testuser', oldPassword: 'wrong', newPassword: 'newpassword' });
//             expect(res.statusCode).toBe(400);
//             expect(res.body).toHaveProperty('error', 'Incorrect old password');
//         });

//         test('should update password successfully', async () => {
//             const user = { username: 'testuser', password: await bcrypt.hash('oldpassword', 10) };
//             mPool.query.mockResolvedValueOnce([[user]]);
//             mPool.query.mockResolvedValueOnce([{}]); // UPDATE
//             const res = await request(app)
//                 .post('/users/update-password')
//                 .send({ username: 'testuser', oldPassword: 'oldpassword', newPassword: 'newpassword' });
//             expect(res.statusCode).toBe(200);
//             expect(res.body).toHaveProperty('message', 'Password updated successfully');
//         });

//         test('should return 500 on error', async () => {
//             mPool.query.mockRejectedValueOnce(new Error('update error'));
//             const res = await request(app)
//                 .post('/users/update-password')
//                 .send({ username: 'testuser', oldPassword: 'old', newPassword: 'newpassword' });
//             expect(res.statusCode).toBe(500);
//             expect(res.body).toHaveProperty('error', 'Internal server error');
//         });
//     });

//     describe('generateIntervalInstances', () => {
//         beforeEach(() => {
//             mPool.query.mockReset();
//         });

//         test('should return immediately if no habit rows', async () => {
//             // mock query to return no habit rows
//             mPool.query.mockResolvedValueOnce([[]]);
//             await generateIntervalInstances('test@example.com', 'Habit1', 7);
//             // only the first query is executed, the subsequent ones are not
//             expect(mPool.query).toHaveBeenCalledTimes(1);
//         });

//         test('should return immediately if scheduleOption is not "interval" or increment is missing', async () => {
//             // mock returning a single row, but scheduleOption is not "interval"
//             mPool.query.mockResolvedValueOnce([[{ scheduleOption: 'weekly' }]]);
//             await generateIntervalInstances('test@example.com', 'Habit1', 7);
//             expect(mPool.query).toHaveBeenCalledTimes(1);
//         });

//         test('should attempt to generate instances when valid habit row exists', async () => {
//             // mock habit query to return a valid habit row
//             mPool.query
//                 // first query: get habitRows
//                 .mockResolvedValueOnce([[{ scheduleOption: 'interval', increment: 1 }]])
//                 // second query: get MAX(dueDate), simulate no instances exist
//                 .mockResolvedValueOnce([[{ lastDate: null }]])
//                 // third query: simulate INSERT IGNORE operation
//                 .mockResolvedValueOnce([{ affectedRows: 1 }])
//                 // fourth query: simulate empty array returned by query inside migrateInstances
//                 .mockResolvedValueOnce([[]]);

//             await generateIntervalInstances('test@example.com', 'Habit1', 7);
//             // 3 query calls (1st: get habitRows; 2nd: get lastDate; 3rd: INSERT) + query inside migrateInstances
//             expect(mPool.query).toHaveBeenCalled();
//         });
//     });

//     describe('generateDayInstances', () => {
//         beforeEach(() => {
//             mPool.query.mockReset();
//         });

//         test('should do nothing if no scheduled days', async () => {
//             // mock SELECT returning empty array
//             mPool.query.mockResolvedValueOnce([[]]);
//             await generateDayInstances('test@example.com', 'Habit1', 7);
//             // only the SELECT query is executed
//             expect(mPool.query).toHaveBeenCalledTimes(1);
//         });

//         test('should insert instances for scheduled days', async () => {
//             // mock returning a single scheduled day, e.g. "Monday"
//             const dayRows = [{ day: 'Monday' }];
//             mPool.query.mockResolvedValueOnce([dayRows]);
//             // mock INSERT returning success
//             mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
//             await generateDayInstances('test@example.com', 'Habit1', 7);
//             // at least SELECT and INSERT calls (number of calls depends on the number of matching days)
//             expect(mPool.query).toHaveBeenCalled();
//         });
//     });

//     describe('migratInstances', () => {
//         beforeEach(() => {
//             mPool.query.mockReset();
//         });

//         test('should do nothing if no instances found', async () => {
//             // mock SELECT returning empty array
//             mPool.query.mockResolvedValueOnce([[]]);
//             await migrateInstances('test@example.com');
//             expect(mPool.query).toHaveBeenCalledTimes(1);
//         });

//         test('should migrate instances if found', async () => {
//             const today = new Date().toISOString().split('T')[0];
//             // mock SELECT returning an instance
//             mPool.query
//                 .mockResolvedValueOnce([[{ habitName: 'Habit1' }]]) // SELECT habitName from habit_instances
//                 // mock INSERT into habit_progress returning an object
//                 .mockResolvedValueOnce([{ affectedRows: 1 }])
//                 // mock DELETE from habit_instances
//                 .mockResolvedValueOnce([{ affectedRows: 1 }]);
//             await migrateInstances('test@example.com');
//             expect(mPool.query).toHaveBeenCalledTimes(3);
//         });
//     });
// });
