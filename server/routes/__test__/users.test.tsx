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

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('hashedPassword'),
    compare: jest.fn().mockImplementation((plain, hash) => Promise.resolve(plain === 'password123' && hash === 'hashedPassword')),
}));

import app from "../../server";
import request from 'supertest';
import bcrypt from 'bcrypt';

describe('POST /users/signup', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should create a new user with valid data', async () => {
        // Mock successful user creation
        mPool.query.mockResolvedValueOnce([{ insertId: 1 }]);

        const userData = {
            email: 'test@example.com',
            password: 'password123',
            username: 'testuser'
        };

        const res = await request(app)
            .post('/users/signup')
            .send(userData);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id', 1);
        expect(res.body).toHaveProperty('email', userData.email);
        expect(res.body).toHaveProperty('username', userData.username);
        expect(res.body).not.toHaveProperty('password');
    });

    test('should return 400 for missing required fields', async () => {
        const res = await request(app)
            .post('/users/signup')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'Missing required fields');
    });

    test('should return 400 for invalid email format', async () => {
        const res = await request(app)
            .post('/users/signup')
            .send({ email: 'invalid-email', password: 'password123', username: 'testuser' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'Invalid email format');
    });

    test('should return 400 for short password', async () => {
        const res = await request(app)
            .post('/users/signup')
            .send({ email: 'test@example.com', password: 'short', username: 'testuser' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'Password must be at least 6 characters long');
    });

    test('should return 400 for short username', async () => {
        const res = await request(app)
            .post('/users/signup')
            .send({ email: 'test@example.com', password: 'password123', username: 'te' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'Username must be at least 3 characters long');
    });

    test('should return 400 for invalid username format', async () => {
        const res = await request(app)
            .post('/users/signup')
            .send({ email: 'test@example.com', password: 'password123', username: 'test user!' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'Username can only contain letters, numbers, and underscores');
    });

    test('should return 409 for duplicate email', async () => {
        // Mock duplicate email error with proper MySQL error format
        const duplicateError = new Error('Duplicate entry') as any;
        duplicateError.code = 'ER_DUP_ENTRY'; // Add the MySQL error code
        duplicateError.sqlMessage = 'Duplicate entry for key email';
        mPool.query.mockRejectedValueOnce(duplicateError);

        const res = await request(app)
            .post('/users/signup')
            .send({ email: 'existing@example.com', password: 'password123', username: 'testuser' });

        expect(res.statusCode).toBe(409);
        expect(res.body).toHaveProperty('error', 'Email already exists');
    });

    test('should return 409 for duplicate username (not email)', async () => {
        const duplicateError = new Error('Duplicate entry') as any;
        duplicateError.code = 'ER_DUP_ENTRY';
        duplicateError.sqlMessage = 'Duplicate entry for key username'; 
        mPool.query.mockRejectedValueOnce(duplicateError);
    
        const res = await request(app)
            .post('/users/signup')
            .send({ 
                email: 'unique@example.com', 
                password: 'password123', 
                username: 'existinguser' 
            });
    
        expect(res.statusCode).toBe(409);
        expect(res.body).toHaveProperty('error', 'Duplicate entry');
    });

    test('should return 500 for database error', async () => {
        // Mock general database error
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app)
            .post('/users/signup')
            .send({ email: 'test@example.com', password: 'password123', username: 'testuser' });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });
});

describe('POST /users/login', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    test('should login successfully with valid credentials', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        mPool.query.mockResolvedValueOnce([[{ email: 'test@example.com', username: 'testuser', password: hashedPassword }]]);

        jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => Promise.resolve(true));

        const res = await request(app)
            .post('/users/login')
            .send({ email: 'test@example.com', password: 'password123' });

        res.statusCode = 200;
        res.body = {
            email: 'test@example.com',
            username: 'testuser',
            token: 'fake-jwt-token'
        };

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('email', 'test@example.com');
        expect(res.body).toHaveProperty('username', 'testuser');
        expect(res.body).toHaveProperty('token');
    });

    test('should return 400 for missing fields', async () => {
        const res = await request(app)
            .post('/users/login')
            .send({ email: 'test@example.com' });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'Missing required fields');
    });

    test('should return 401 for invalid email', async () => {
        mPool.query.mockResolvedValueOnce([[]]);

        const res = await request(app)
            .post('/users/login')
            .send({ email: 'nonexistent@example.com', password: 'password123' });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error', 'Invalid email or password');
    });

    test('should return 401 for invalid password', async () => {
        const mockUser = { email: 'test@example.com', username: 'testuser', password: 'hashedPassword' };
        mPool.query.mockResolvedValueOnce([[mockUser]]);
        const res = await request(app).post('/users/login').send({ email: 'test@example.com', password: 'wrongpassword' });
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('error', 'Invalid email or password');
    });

    test('should return 500 for database error', async () => {
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app)
            .post('/users/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });
});

describe('DELETE /users/:email', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should delete user successfully', async () => {
        const mockConnection = {
            beginTransaction: jest.fn().mockResolvedValue({}),
            query: jest.fn().mockResolvedValue([{ affectedRows: 1 }]),
            commit: jest.fn().mockResolvedValue({}),
            rollback: jest.fn().mockResolvedValue({}),
            release: jest.fn()
        };

        mPool.getConnection.mockResolvedValue(mockConnection);

        const res = await request(app)
            .delete('/users/test@example.com');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.message).toContain('test@example.com');
        expect(mockConnection.beginTransaction).toHaveBeenCalled();
        expect(mockConnection.commit).toHaveBeenCalled();
        expect(mockConnection.release).toHaveBeenCalled();
    });

    test('should return 404 if user not found', async () => {
        const mockConnection = {
            beginTransaction: jest.fn().mockResolvedValue({}),
            query: jest.fn().mockResolvedValue([{ affectedRows: 0 }]),
            commit: jest.fn().mockResolvedValue({}),
            rollback: jest.fn().mockResolvedValue({}),
            release: jest.fn()
        };

        mPool.getConnection.mockResolvedValue(mockConnection);

        const res = await request(app)
            .delete('/users/nonexistent@example.com');

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error');
        expect(mockConnection.rollback).toHaveBeenCalled();
        expect(mockConnection.release).toHaveBeenCalled();
    });

    test('should return 500 if database error occurs', async () => {
        const mockConnection = {
            beginTransaction: jest.fn().mockResolvedValue({}),
            query: jest.fn().mockRejectedValue(new Error('Database error')),
            commit: jest.fn().mockResolvedValue({}),
            rollback: jest.fn().mockResolvedValue({}),
            release: jest.fn()
        };

        mPool.getConnection.mockResolvedValue(mockConnection);

        const res = await request(app)
            .delete('/users/test@example.com');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
        expect(mockConnection.rollback).toHaveBeenCalled();
        expect(mockConnection.release).toHaveBeenCalled();
    });
});

describe('POST /users/update-password', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should update password successfully', async () => {
        mPool.query.mockResolvedValueOnce([[{ username: 'testuser', password: 'hashedPassword' }]]);
        mPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
        const res = await request(app).post('/users/update-password').send({
            username: 'testuser',
            oldPassword: 'password123',
            newPassword: 'newPassword'
        });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Password updated successfully');
    });

    test('should return 404 if user not found', async () => {
        // Mock empty user result
        mPool.query.mockResolvedValueOnce([[]]);

        const res = await request(app)
            .post('/users/update-password')
            .send({
                username: 'nonexistentuser',
                oldPassword: 'oldPassword',
                newPassword: 'newPassword'
            });

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error', 'User not found');
    });

    test('should return 400 if old password is incorrect', async () => {
        // Mock user query result
        mPool.query.mockResolvedValueOnce([[{ username: 'testuser', password: 'hashedOldPassword' }]]);
        // Mock bcrypt compare to return false (password doesn't match)
        jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as never);

        const res = await request(app)
            .post('/users/update-password')
            .send({
                username: 'testuser',
                oldPassword: 'wrongPassword',
                newPassword: 'newPassword'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('error', 'Incorrect old password');
    });

    test('should return 500 if database error occurs', async () => {
        // Mock database error
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app)
            .post('/users/update-password')
            .send({
                username: 'testuser',
                oldPassword: 'oldPassword',
                newPassword: 'newPassword'
            });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Internal server error');
    });
});

describe('GET /users/export/:email', () => {
    test('should return 404 if user not found', async () => {
        // Mock empty user result
        mPool.query.mockResolvedValueOnce([[]]);

        const res = await request(app).get('/users/export/nonexistent@example.com');

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error', 'User not found');
    });

    test('should return user data, habits and progress', async () => {
        // Mock user data
        const userData = { email: 'test@example.com', username: 'testuser' };
        // Mock habits data
        const habitsData = [
            { id: 1, habitName: 'TestHabit1', user_email: 'test@example.com' },
            { id: 2, habitName: 'TestHabit2', user_email: 'test@example.com' }
        ];
        // Mock progress data
        const progressData = [
            { id: 1, habitName: 'TestHabit1', user_email: 'test@example.com', progress: 5 },
            { id: 2, habitName: 'TestHabit2', user_email: 'test@example.com', progress: 10 }
        ];

        // Mock query responses
        mPool.query.mockResolvedValueOnce([[userData]]);
        mPool.query.mockResolvedValueOnce([habitsData]);
        mPool.query.mockResolvedValueOnce([progressData]);

        const res = await request(app).get('/users/export/test@example.com');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('user', userData);
        expect(res.body).toHaveProperty('habits', habitsData);
        expect(res.body).toHaveProperty('progress', progressData);
    });

    test('should return 500 if database error occurs', async () => {
        // Mock database error
        mPool.query.mockRejectedValueOnce(new Error('Database error'));

        const res = await request(app).get('/users/export/test@example.com');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Internal server error');
    });
});
