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


import request from 'supertest';
import bcrypt from 'bcrypt';
import app, { initDatabase, generateIntervalInstances, generateDayInstances, getHabitsForDate, migrateInstances } from '../server';

// for ensuring the server is closed after all tests
beforeEach(() => {
    mPool.query.mockReset();
    mPool.getConnection.mockReset();
});

describe('initDatabase', () => {
    test('should log error when getConnection fails', async () => {
      // mock getConnection to reject with an error
      const originalGetConnection = mPool.getConnection;
      mPool.getConnection.mockRejectedValueOnce(new Error('connection error'));
  
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
      await initDatabase();
  
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error initializing database:', expect.any(Error));
  
      consoleErrorSpy.mockRestore();
      mPool.getConnection = originalGetConnection;
    });
});

describe('Server API Endpoints', () => {

    describe('GET /', () => {
        test('should return running message', async () => {
            const res = await request(app).get('/');

            expect(res.statusCode).toBe(200);
            expect(res.text).toContain('Habit Tracker API is running');
        });
    });


    describe('GET /users', () => {
        test('should return list of users', async () => {
            const users = [{ email: 'test@example.com', username: 'testuser', password: 'hash' }];
            mPool.query.mockResolvedValueOnce([users]);

            const res = await request(app).get('/users');
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(users);
        });

        test('should return 500 on database error', async () => {
            mPool.query.mockRejectedValueOnce(new Error('db error'));
            const res = await request(app).get('/users');
            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('error', 'Database query failed');
        });
    });


    describe('POST /users/login', () => {
        test('should return 401 for non-existing user', async () => {
            mPool.query.mockResolvedValueOnce([[]]);
            const res = await request(app)
                .post('/users/login')
                .send({ email: 'nonexistent@example.com', password: 'password' });
            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid email or password');
        });

        test('should return 400 for missing password', async () => {
            // mock query to return a user
            const user = { email: 'test@example.com', username: 'testuser', password: 'hash' };
            mPool.query.mockResolvedValueOnce([[user]]);
            const res = await request(app)
                .post('/users/login')
                .send({ email: 'test@example.com' }); // password not provided
            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('error', 'Missing required fields');
        });

        test('should return 401 for incorrect password', async () => {
            const plainPassword = 'wrongpassword';
            const hash = await bcrypt.hash('correctpassword', 10);
            const user = { email: 'test@example.com', username: 'testuser', password: hash };

            mPool.query.mockResolvedValueOnce([[user]]);
            const res = await request(app)
                .post('/users/login')
                .send({ email: 'test@example.com', password: plainPassword });
            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty('error', 'Invalid email or password');
        });

        test('should return user without password on successful login', async () => {
            const plainPassword = 'correctpassword';
            const hash = await bcrypt.hash(plainPassword, 10);
            const user = { email: 'test@example.com', username: 'testuser', password: hash };
        
            mPool.query.mockResolvedValueOnce([[user]]);
            mPool.query.mockResolvedValueOnce([[]]);
            mPool.query.mockResolvedValueOnce([[]]);
        
            const res = await request(app)
                .post('/users/login')
                .send({ email: 'test@example.com', password: plainPassword });
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual({ email: 'test@example.com', username: 'testuser' });
        });
        
        test('should return 500 on query error', async () => {
            mPool.query.mockRejectedValueOnce(new Error('query error'));

            const res = await request(app)
                .post('/users/login')
                .send({ email: 'test@example.com', password: 'password' });

            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('error', 'Error retrieving user');
        });
    });


    describe('POST /users/signup', () => {
        test('should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/users/signup')
                .send({ email: 'test@example.com', password: 'password' });
            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('error', 'Missing required fields');
        });

        test('should return 400 for invalid email format', async () => {
            const res = await request(app)
                .post('/users/signup')
                .send({ email: 'invalidemail', password: 'password', username: 'user123' });
            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('error', 'Invalid email format');
        });

        test('should return 400 for short password', async () => {
            const res = await request(app)
                .post('/users/signup')
                .send({ email: 'test@example.com', password: '123', username: 'user123' });
            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('error', 'Password must be at least 6 characters long');
        });

        test('should return 400 for short username', async () => {
            const res = await request(app)
                .post('/users/signup')
                .send({ email: 'test@example.com', password: 'password', username: 'ab' });
            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('error', 'Username must be at least 3 characters long');
        });

        test('should return 400 for invalid username characters', async () => {
            const res = await request(app)
                .post('/users/signup')
                .send({ email: 'test@example.com', password: 'password', username: 'invalid#name' });
            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('error', 'Username can only contain letters, numbers, and underscores');
        });

        test('should create a new user successfully', async () => {
            const fakeResult = { insertId: 1 };
            mPool.query.mockResolvedValueOnce([fakeResult]);
            const res = await request(app)
                .post('/users/signup')
                .send({ email: 'test@example.com', password: 'password', username: 'user123' });
            expect(res.statusCode).toBe(201);
            expect(res.body).toMatchObject({ email: 'test@example.com', username: 'user123' });
        });

        test('should return 409 for duplicate email', async () => {
            const dupError = new Error() as any;
            dupError.code = 'ER_DUP_ENTRY';
            dupError.sqlMessage = 'Duplicate entry for email';
            mPool.query.mockRejectedValueOnce(dupError);
            const res = await request(app)
                .post('/users/signup')
                .send({ email: 'test@example.com', password: 'password', username: 'user123' });
            expect(res.statusCode).toBe(409);
            expect(res.body).toHaveProperty('error', 'Email already exists');
        });

        test('should return 409 for duplicate entry not related to email', async () => {
            // mock error with message not containing "email" to trigger the else branch
            const dupError = new Error() as any;
            dupError.code = 'ER_DUP_ENTRY';
            dupError.sqlMessage = 'Duplicate entry for username';
            mPool.query.mockRejectedValueOnce(dupError);
            const res = await request(app)
              .post('/users/signup')
              .send({ email: 'other@example.com', password: 'password', username: 'user123' });
            expect(res.statusCode).toBe(409);
            expect(res.body).toHaveProperty('error', 'Duplicate entry');
        });

        test('should return 500 for other errors', async () => {
            mPool.query.mockRejectedValueOnce(new Error('unknown error'));
            const res = await request(app)
                .post('/users/signup')
                .send({ email: 'test@example.com', password: 'password', username: 'user123' });
            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('error', 'Internal server error while creating user');
        });
    });


    describe('DELETE /users/:username', () => {

        test('should delete user successfully', async () => {
            mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            const res = await request(app).delete('/users/testuser');
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });

        test('should return 404 if user not found', async () => {
            mPool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
            const res = await request(app).delete('/users/nonexistent');
            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'User nonexistent not found.');
        });

        test('should return 500 on error', async () => {
            mPool.query.mockRejectedValueOnce(new Error('delete error'));
            const res = await request(app).delete('/users/testuser');
            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('error', 'Error deleting user');
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
    });

    describe('GET /habits/:username (habit names)', () => {

        test('should return 404 if user not found', async () => {
            mPool.query.mockResolvedValueOnce([[]]); // user query returns empty array
            const res = await request(app).get('/habits/nonexistent');
            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'User not found');
        });

        test('should return habit names', async () => {
            mPool.query
                .mockResolvedValueOnce([[{ email: 'test@example.com' }]]) // user query
                .mockResolvedValueOnce([[{ habitName: 'Habit1' }, { habitName: 'Habit2' }]]); // habits query
            const res = await request(app).get('/habits/testuser');
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([{ habitName: 'Habit1' }, { habitName: 'Habit2' }]);
        });

        test('should return empty array if no habits found', async () => {
            mPool.query
                .mockResolvedValueOnce([[{ email: 'test@example.com' }]])
                .mockResolvedValueOnce([[]]);
            const res = await request(app).get('/habits/testuser');
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual([]);
        });

        test('should return 500 on error', async () => {
            mPool.query.mockRejectedValueOnce(new Error('query error'));
            const res = await request(app).get('/habits/testuser');
            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('error', 'Error fetching habit names');
        });
    });


    describe('DELETE /habits/:username/:name', () => {
        it('should return 500 due to ReferenceError (bug in code)', async () => {
            // as the erroneous use of an undefined variable 'habitName', this endpoint will inevitably enter the catch block and return a 500 error
            const res = await request(app).delete('/habits/testuser/habit1');
            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('error', 'Error deleting habit');
        });
    });

    describe('POST /habit-progress', () => {
        const today = new Date().toISOString().split('T')[0];

        test('should insert new progress if none exists', async () => {
            // mock no existing progress record, return empty array in first query
            mPool.query.mockResolvedValueOnce([[]]);
            // INSERT returns an object with insertId, indicating successful insert
            mPool.query.mockResolvedValueOnce([{ insertId: 42 }]);

            const res = await request(app)
                .post('/habit-progress')
                .send({ email: 'test@example.com', habitName: 'Habit1', progress: 5 });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('message', 'Progress updated');
        });

        test('should update progress when existing progress exists and not completed', async () => {
            const existingRow = { goalValue: 10, streak: 0 };
            // mock existing progress record, and progress < goalValue
            mPool.query.mockResolvedValueOnce([[existingRow]]);
            // UPDATE returns an object with affectedRows: 1, indicating successful update
            mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app)
                .post('/habit-progress')
                .send({ email: 'test@example.com', habitName: 'Habit1', progress: 5 });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('message', 'Progress updated');
        });

        test('should update progress with streak when completed', async () => {
            const existingRow = { goalValue: 5, streak: 2 };
            // mock existing progress record, and progress >= goalValue
            mPool.query
            .mockResolvedValueOnce([[existingRow]])
            //mock query to return streak value
            .mockResolvedValueOnce([[{ streak: 2 }]])
            // UPDATE returns an object with affectedRows: 1, indicating successful update
            .mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app)
                .post('/habit-progress')
                .send({ email: 'test@example.com', habitName: 'Habit1', progress: 5 });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('message', 'Progress updated');
        });

        test('should return 500 on error', async () => {
            mPool.query.mockRejectedValueOnce(new Error('query error'));
            const res = await request(app)
                .post('/habit-progress')
                .send({ email: 'test@example.com', habitName: 'Habit1', progress: 5 });
            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('error', 'Internal server error');
        });
    });


    describe('GET /habit-progress/:email/:habitName', () => {

        test('should return 404 if user not found', async () => {
            mPool.query.mockResolvedValueOnce([[]]);
            const res = await request(app).get('/habit-progress/test@example.com/Habit1?range=7');
            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'User not found');
        });

        test('should return progress data for range 7', async () => {
            const today = new Date().toISOString().split('T')[0];
            const progressData = [{ progressDate: today, progress: 5 }];
            mPool.query
                .mockResolvedValueOnce([[{ email: 'test@example.com' }]]) // user exists
                .mockResolvedValueOnce([progressData]); // query progress records
            const res = await request(app).get('/habit-progress/test@example.com/Habit1?range=7');
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(progressData);
        });

        test('should return 400 for invalid range parameter', async () => {
            mPool.query.mockResolvedValueOnce([[{ email: 'test@example.com' }]]);
            const res = await request(app).get('/habit-progress/test@example.com/Habit1?range=invalid');
            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('error', 'Invalid range parameter (use 7, 30, or month)');
        });

        test('should return 500 for range "month" due to undefined startDate', async () => {
            mPool.query.mockResolvedValueOnce([[{ email: 'test@example.com' }]]);
            const res = await request(app).get('/habit-progress/test@example.com/Habit1?range=30');
            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('error', 'Error fetching habit progress data');
        });
    });

    describe('GET /habit-progress-by-date/:email/:date', () => {

        test('should return 404 if user not found', async () => {
            mPool.query.mockResolvedValueOnce([[]]);
            const res = await request(app).get('/habit-progress-by-date/test@example.com/2000-01-01');
            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'User not found');
        });

        test('should return progress data', async () => {
            const progressData = [{ progress: 5, completed: false, streak: 0, goalValue: 10, habitType: 'build' }];
            mPool.query
                .mockResolvedValueOnce([[{ email: 'test@example.com' }]])
                .mockResolvedValueOnce([progressData]);
            const res = await request(app).get('/habit-progress-by-date/test@example.com/2000-01-01');
            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(progressData);
        });

        test('should return 500 on error', async () => {
            mPool.query.mockRejectedValueOnce(new Error('query error'));
            const res = await request(app).get('/habit-progress-by-date/test@example.com/2000-01-01');
            expect(res.statusCode).toBe(500);
            expect(res.body).toHaveProperty('error', 'Error fetching habit progress data');
        });
    });

    describe('GET /habit-progress/:email/:habitName with range "month"', () => {
        test('should return progress data for month range', async () => {
          // mock user exists
          mPool.query.mockResolvedValueOnce([[{ email: 'test@example.com' }]]);
          //mock month branch SELECT query returns correct summary data
          mPool.query.mockResolvedValueOnce([[{ year: 2023, month: 8, avg_value: 5 }]]);
          
          const res = await request(app).get('/habit-progress/test@example.com/Habit1?range=month');
          expect(res.statusCode).toBe(200);
          expect(res.body).toEqual([{ year: 2023, month: 8, avg_value: 5 }]);
        });
      });
      

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
    });


    describe('POST /users/update-password', () => {

        test('should return 404 if user not found', async () => {
            mPool.query.mockResolvedValueOnce([[]]);
            const res = await request(app)
                .post('/users/update-password')
                .send({ username: 'testuser', oldPassword: 'old', newPassword: 'newpassword' });
            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error', 'User not found');
        });

        test('should return 400 if old password is incorrect', async () => {
            const user = { username: 'testuser', password: await bcrypt.hash('correct', 10) };
            mPool.query.mockResolvedValueOnce([[user]]);
            const res = await request(app)
                .post('/users/update-password')
                .send({ username: 'testuser', oldPassword: 'wrong', newPassword: 'newpassword' });
            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('error', 'Incorrect old password');
        });
        
        test('should update password successfully', async () => {
            const user = { username: 'testuser', password: await bcrypt.hash('oldpassword', 10) };
            mPool.query.mockResolvedValueOnce([[user]]);
            mPool.query.mockResolvedValueOnce([{}]); // UPDATE
            const res = await request(app)
                .post('/users/update-password')
                .send({ username: 'testuser', oldPassword: 'oldpassword', newPassword: 'newpassword' });
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('message', 'Password updated successfully');
        });

        test('should return 500 on error', async () => {
        mPool.query.mockRejectedValueOnce(new Error('update error'));
        const res = await request(app)
            .post('/users/update-password')
            .send({ username: 'testuser', oldPassword: 'old', newPassword: 'newpassword' });
        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Internal server error');
        });
    });

    describe('generateIntervalInstances', () => {
        beforeEach(() => {
          mPool.query.mockReset();
        });
      
        test('should return immediately if no habit rows', async () => {
          // mock query to return no habit rows
          mPool.query.mockResolvedValueOnce([[]]);
          await generateIntervalInstances('test@example.com', 'Habit1', 7);
          // only the first query is executed, the subsequent ones are not
          expect(mPool.query).toHaveBeenCalledTimes(1);
        });
      
        test('should return immediately if scheduleOption is not "interval" or increment is missing', async () => {
          // mock returning a single row, but scheduleOption is not "interval"
          mPool.query.mockResolvedValueOnce([[{ scheduleOption: 'weekly' }]]);
          await generateIntervalInstances('test@example.com', 'Habit1', 7);
          expect(mPool.query).toHaveBeenCalledTimes(1);
        });
      
        test('should attempt to generate instances when valid habit row exists', async () => {
          // mock habit query to return a valid habit row
          mPool.query
            // first query: get habitRows
            .mockResolvedValueOnce([[{ scheduleOption: 'interval', increment: 1 }]])
            // second query: get MAX(dueDate), simulate no instances exist
            .mockResolvedValueOnce([[{ lastDate: null }]])
            // third query: simulate INSERT IGNORE operation
            .mockResolvedValueOnce([{ affectedRows: 1 }])
            // fourth query: simulate empty array returned by query inside migrateInstances
            .mockResolvedValueOnce([[]]);
      
          await generateIntervalInstances('test@example.com', 'Habit1', 7);
          // 3 query calls (1st: get habitRows; 2nd: get lastDate; 3rd: INSERT) + query inside migrateInstances
          expect(mPool.query).toHaveBeenCalled();
        });
    });

    describe('getHabitsForDate', () => {
        beforeEach(() => {
            mPool.query.mockReset();
        });
        
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

    describe('generateDayInstances', () => {
        beforeEach(() => {
            mPool.query.mockReset();
        });

        test('should do nothing if no scheduled days', async () => {
            // mock SELECT returning empty array
            mPool.query.mockResolvedValueOnce([[]]);
            await generateDayInstances('test@example.com', 'Habit1', 7);
            // only the SELECT query is executed
            expect(mPool.query).toHaveBeenCalledTimes(1);
        });

        test('should insert instances for scheduled days', async () => {
            // mock returning a single scheduled day, e.g. "Monday"
            const dayRows = [{ day: 'Monday' }];
            mPool.query.mockResolvedValueOnce([dayRows]);
            // mock INSERT returning success
            mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
            await generateDayInstances('test@example.com', 'Habit1', 7);
            // at least SELECT and INSERT calls (number of calls depends on the number of matching days)
            expect(mPool.query).toHaveBeenCalled();
        });
    });
    
    describe('migratInstances', () => {
        beforeEach(() => {
          mPool.query.mockReset();
        });
      
        test('should do nothing if no instances found', async () => {
          // mock SELECT returning empty array
          mPool.query.mockResolvedValueOnce([[]]);
          await migrateInstances('test@example.com');
          expect(mPool.query).toHaveBeenCalledTimes(1);
        });
      
        test('should migrate instances if found', async () => {
          const today = new Date().toISOString().split('T')[0];
          // mock SELECT returning an instance
          mPool.query
            .mockResolvedValueOnce([[{ habitName: 'Habit1' }]]) // SELECT habitName from habit_instances
            // mock INSERT into habit_progress returning an object
            .mockResolvedValueOnce([{ affectedRows: 1 }])
            // mock DELETE from habit_instances
            .mockResolvedValueOnce([{ affectedRows: 1 }]);
          await migrateInstances('test@example.com');
          expect(mPool.query).toHaveBeenCalledTimes(3);
        });
      });
});
