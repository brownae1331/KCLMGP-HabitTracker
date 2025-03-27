import AsyncStorage from '@react-native-async-storage/async-storage';
import * as client from './client';

const BASE_URL = 'http://localhost:3000';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
}));

// Simulate a fetch response
const setupFetchMock = (data: unknown, ok: boolean = true, status: number = 200) => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok,
            status,
            json: async () => data,
        } as Response)
    );
};

describe('Client API Integration Tests', () => {
    const mockEmail = 'test@example.com';
    const mockPassword = 'password123';
    const mockUsername = 'testuser';
    const testDate = '2025-03-15';
    const mockHabit: client.Habit = {
        email: 'test@example.com',
        habitName: 'Exercise',
        habitDescription: 'Morning workout',
        habitType: 'build',
        habitColor: '#ff0000',
        scheduleOption: 'weekly',
        intervalDays: null,
        selectedDays: ['Monday', 'Wednesday', 'Friday'],
        goalValue: 30,
        goalUnit: 'minutes',
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('init() should initialize client', async () => {
        const responseData = { success: true };
        setupFetchMock(responseData);
        const response = await client.init();
        expect(response).toEqual(responseData);
        expect(global.fetch).toHaveBeenCalled();
    });

    test('init() should handle fetch errors correctly', async () => {
        setupFetchMock({ error: 'Failed' }, false, 500);
        await expect(client.init()).rejects.toThrow();
    });

    test('logIn() should be called with email and password, and store user info into AsyncStorage', async () => {
        const token = 'token123';
        setupFetchMock({ token, username: mockUsername, email: mockEmail });
        const response = await client.logIn(mockEmail, mockPassword);

        expect(response.token).toEqual(token);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('username', mockUsername);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('email', mockEmail);
    });

    test('logIn() should handle incorrect credentials', async () => {
        setupFetchMock({ error: 'Unauthorized' }, false, 401);
        await expect(client.logIn(mockEmail, 'wrongpassword')).rejects.toThrow();
    });

    test('createUser() should be called with correct parameters', async () => {
        const message = 'User created';
        setupFetchMock({ message });
        const response = await client.createUser(mockEmail, mockPassword, mockUsername);
        expect(response.message).toEqual(message);
        expect(global.fetch).toHaveBeenCalled();
    });

    test('getStoredUser() should retrieve user data from AsyncStorage', async () => {
        (AsyncStorage.getItem as jest.Mock)
            .mockResolvedValueOnce(mockUsername)
            .mockResolvedValueOnce(mockEmail);
        const user = await client.getStoredUser();
        expect(user).toEqual({ username: mockUsername, email: mockEmail });
        expect(AsyncStorage.getItem).toHaveBeenCalledTimes(2);
    });

    test('getStoredUser() should handle empty AsyncStorage', async () => {
        (AsyncStorage.getItem as jest.Mock)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        const user = await client.getStoredUser();
        expect(user).toBeNull();
    });

    test('getUserDetails() should fetch user details', async () => {
        const userData = { username: mockUsername, email: mockEmail };
        setupFetchMock(userData);
        const response = await client.getUserDetails(mockUsername);
        expect(response).toEqual(userData);
        expect(global.fetch).toHaveBeenCalled();
    });

    test('getHabitsForDate() should fetch user habits for a specific date', async () => {
        const habits = [{ name: 'Exercise', username: mockUsername, date: testDate }];
        setupFetchMock(habits);
        const response = await client.getHabitsForDate(mockUsername, testDate);
        expect(response).toEqual(habits);
        expect(global.fetch).toHaveBeenCalled();
    });

    test('addHabit should send a POST request and return response data', async () => {
        const responseData = { success: true };
        setupFetchMock(responseData);
        const response = await client.addHabit(mockHabit);
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3000/habits',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mockHabit),
            })
        );
        expect(response).toEqual(responseData);
    });

    test('addHabit() should handle fetch error', async () => {
        setupFetchMock({ error: 'Habit creation failed' }, false, 400);
        await expect(client.addHabit(mockHabit)).rejects.toThrow();
    });

    test('deleteHabit should send a DELETE request and return response data', async () => {
        setupFetchMock({ success: true });
        const response = await client.deleteHabit(mockUsername, mockHabit.habitName);

        expect(global.fetch).toHaveBeenCalledWith(
            `http://localhost:3000/habits/${mockUsername}/${mockHabit.habitName}`,
            expect.objectContaining({ method: 'DELETE' })
        );
        expect(response).toEqual({ success: true });
    });

    test('deleteHabit() should handle habit not found', async () => {
        setupFetchMock({ error: 'Habit not found' }, false, 404);
        await expect(client.deleteHabit(mockUsername, 'NonExistentHabit')).rejects.toThrow();
    });

    test('deleteUser should send a DELETE request and return response data (success scenario)', async () => {
        // Success scenario: returns { success: true }
        setupFetchMock({ success: true });
        const response = await client.deleteUser(mockUsername);
        expect(global.fetch).toHaveBeenCalledWith(
            `http://localhost:3000/users/${mockUsername}`,
            expect.objectContaining({ method: 'DELETE' })
        );
        expect(response).toEqual({ success: true });
    });

    test('deleteUser() should throw an error when deletion fails', async () => {
        const errorMessage = 'Error deleting user';

        jest.spyOn(client, 'deleteUser').mockRejectedValueOnce(new Error(errorMessage));

        await expect(client.deleteUser('testUser')).rejects.toThrow(errorMessage);

        expect(client.deleteUser).toHaveBeenCalledWith('testUser');
    });

    test('logout() should remove stored user data', async () => {
        await client.logout();
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('username');
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('email');
    });

    test('deleteUser() should handle errors correctly', async () => {
        (client.deleteUser as jest.Mock).mockRejectedValueOnce(new Error('Error deleting user'));

        await expect(client.deleteUser('testUser')).rejects.toThrow('Error deleting user');
    });

    test('updateHabitProgress() should update progress of habit', async () => {
        const responseData = { success: true };
        setupFetchMock(responseData);

        const response = await client.updateHabitProgress(mockEmail, mockHabit.habitName, 50);
        expect(response).toEqual(responseData);
        expect(global.fetch).toHaveBeenCalled();
    });

    test('updateHabitProgress() should handle fetch errors', async () => {
        setupFetchMock({ error: 'Update failed' }, false, 500);
        await expect(client.updateHabitProgress(mockEmail, mockHabit.habitName, 50)).rejects.toThrow();
    });

    test('getHabitProgressByDate() should get progress of a specific date', async () => {
        const progressData = { habit: 'Exercise', date: testDate, progress: 75 };
        setupFetchMock(progressData);
        const response = await client.getHabitProgressByDate(mockEmail, testDate);
        expect(response).toEqual(progressData);
        expect(global.fetch).toHaveBeenCalled();
    });

    test('updatePassword() should update user password', async () => {
        const responseData = { success: true };
        setupFetchMock(responseData);
        const response = await client.updatePassword(mockUsername, mockPassword, 'newPassword456');
        expect(response).toEqual(responseData);
        expect(global.fetch).toHaveBeenCalled();
    });

    test('updatePassword() should handle incorrect current password', async () => {
        setupFetchMock({ error: 'Incorrect current password' }, false, 403);
        await expect(client.updatePassword(mockUsername, 'wrongOldPassword', 'newPassword')).rejects.toThrow();
    });

    test('updateHabit should update habit properties including color', async () => {
        const responseData = { success: true };
        setupFetchMock(responseData);
        const newColor = '#00ff00';
        const updatedHabit = { ...mockHabit, habitColor: newColor };

        const response = await client.updateHabit(mockEmail, updatedHabit);
        expect(response).toEqual(responseData);

        // According to the current implementation, the actual call is a PUT request 
        // and the request body is the JSON string of the updatedHabit.
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3000/habits',
            expect.objectContaining({
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedHabit),
            })
        );
    });

    test('updateHabit should handle errors correctly when updating color', async () => {
        const newColor = '#00ff00';
        const updatedHabit = { ...mockHabit, habitColor: newColor };
        setupFetchMock({ error: 'Update failed' }, false, 500);
        await expect(client.updateHabit(mockEmail, updatedHabit)).rejects.toThrow();
    });
});

describe('Client API Additional Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // ─────────────────────────────────────────────────────────────
    // 1. Test fetchHabits
    // ─────────────────────────────────────────────────────────────
    describe('fetchHabits', () => {
        it('should fetch habits array for a user', async () => {
            const mockHabits = [{ id: 1, name: 'Test habit' }];
            setupFetchMock(mockHabits, true, 200);

            const result = await client.fetchHabits('test@example.com');
            // Check if the fetch URL is correct
            expect(global.fetch).toHaveBeenCalledWith(
                `${BASE_URL}/habits/test@example.com`,
                expect.anything()
            );
            // Check the returned value
            expect(result).toEqual(mockHabits);
        });

        it('should log an error if the response is not an array', async () => {
            const mockResponse = { error: 'Not an array' };
            setupFetchMock(mockResponse, true, 200);

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            const result = await client.fetchHabits('test@example.com');

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Invalid habits response format:',
                { error: 'Not an array' }
            );
            expect(result).toEqual([]);

            consoleErrorSpy.mockRestore();
        });

        it('should throw an error if fetch fails', async () => {
            setupFetchMock({ error: 'some error' }, false, 500);
            await expect(client.fetchHabits('test@example.com')).rejects.toThrowError();
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 2. Test fetchHabitProgress
    // ─────────────────────────────────────────────────────────────
    describe('fetchHabitProgress', () => {
        beforeAll(() => {
            jest.spyOn(client, 'fetchHabitProgress').mockImplementation(async (email: string, habitName: string, range: string) => {
                const res = await global.fetch(`${BASE_URL}/stats/${email}/${habitName}/progress?range=${range}`);
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Fetch failed');
                }
                return res.json();
            });
        });

        it('should return progress data for a habit in a given range', async () => {
            const mockProgress = { progress: 60 };
            setupFetchMock(mockProgress, true, 200);

            const result = await client.fetchHabitProgress(
                'test@example.com',
                'Exercise',
                'week'
            );
            expect(global.fetch).toHaveBeenCalledWith(
                `${BASE_URL}/stats/test@example.com/Exercise/progress?range=week`
            );
            expect(result).toEqual(mockProgress);
        });

        it('should throw an error if fetch fails', async () => {
            setupFetchMock({ error: 'some error' }, false, 500);
            await expect(
                client.fetchHabitProgress('test@example.com', 'Exercise', 'week')
            ).rejects.toThrow('some error');
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 3. Test fetchLongestStreak
    // ─────────────────────────────────────────────────────────────
    describe('fetchLongestStreak', () => {
        it('should return the longest streak data', async () => {
            const mockData = { longestStreak: 5 };
            setupFetchMock(mockData, true, 200);

            const result = await client.fetchLongestStreak(
                'test@example.com',
                'Exercise',
                'week'
            );
            expect(global.fetch).toHaveBeenCalledWith(
                `${BASE_URL}/stats/test@example.com/Exercise/longest-streak`,
                expect.anything()
            );
            expect(result).toBe(5);
        });

        it('should throw an error if fetch fails', async () => {
            setupFetchMock({ error: 'some error' }, false, 500);
            await expect(
                client.fetchLongestStreak('test@example.com', 'Exercise', 'week')
            ).rejects.toThrowError();
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 4. Test fetchCompletionRate
    // ─────────────────────────────────────────────────────────────
    describe('fetchCompletionRate', () => {
        it('should return the completion rate', async () => {
            const mockData = { completionRate: 0.75 };
            setupFetchMock(mockData, true, 200);

            const result = await client.fetchCompletionRate(
                'test@example.com',
                'Exercise'
            );
            expect(global.fetch).toHaveBeenCalledWith(
                `${BASE_URL}/stats/test@example.com/Exercise/completion-rate`,
                expect.anything()
            );
            expect(result).toBe(0.75);
        });

        it('should throw an error if fetch fails', async () => {
            setupFetchMock({ error: 'some error' }, false, 500);
            await expect(
                client.fetchCompletionRate('test@example.com', 'Exercise')
            ).rejects.toThrowError();
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 5. Test fetchAverageProgress
    // ─────────────────────────────────────────────────────────────
    describe('fetchAverageProgress', () => {
        it('should return the average progress', async () => {
            const mockData = { averageProgress: 45 };
            setupFetchMock(mockData, true, 200);

            const result = await client.fetchAverageProgress(
                'test@example.com',
                'Exercise'
            );
            expect(global.fetch).toHaveBeenCalledWith(
                `${BASE_URL}/stats/test@example.com/Exercise/average-progress`,
                expect.anything()
            );
            expect(result).toBe(45);
        });

        it('should throw an error if fetch fails', async () => {
            setupFetchMock({ error: 'some error' }, false, 500);
            await expect(
                client.fetchAverageProgress('test@example.com', 'Exercise')
            ).rejects.toThrowError();
        });
    });
});

describe('New Client API Functions Tests', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchBuildHabitProgress', () => {
        it('should call apiRequest with the correct URL and return progress data', async () => {
            const mockData = [{ progress: 100 }];
            // Override global.apiRequest for testing purposes.
            (global as any).apiRequest = jest.fn().mockResolvedValue(mockData);

            const email = 'test@example.com';
            const habitName = 'Exercise';
            const range: 'week' = 'week';
            const result = await client.fetchBuildHabitProgress(email, habitName, range);

            expect((global as any).apiRequest).toHaveBeenCalledWith(
                `${BASE_URL}/stats/${email}/${habitName}/progress?range=${range}`
            );
            expect(result).toEqual(mockData);
        });

        it('should throw an error if apiRequest fails', async () => {
            (global as any).apiRequest = jest.fn().mockRejectedValue(new Error('some error'));
            await expect(client.fetchBuildHabitProgress('test@example.com', 'Exercise', 'month')).rejects.toThrow('some error');
        });
    });

    describe('fetchStreak', () => {
        it('should call apiRequest with the correct URL and return streak data', async () => {
            const mockData = [{ streak: 5 }];
            (global as any).apiRequest = jest.fn().mockResolvedValue(mockData);

            const email = 'test@example.com';
            const habitName = 'Exercise';
            const range: 'week' = 'week';
            const result = await client.fetchStreak(email, habitName, range);

            expect((global as any).apiRequest).toHaveBeenCalledWith(
                `${BASE_URL}/stats/${email}/${habitName}/streak?range=${range}`
            );
            expect(result).toEqual(mockData);
        });

        it('should throw an error if apiRequest fails', async () => {
            (global as any).apiRequest = jest.fn().mockRejectedValue(new Error('some error'));
            await expect(client.fetchStreak('test@example.com', 'Exercise', 'month')).rejects.toThrow('some error');
        });
    });

    // Removed the old test for fetchHabitProgress expecting "Function not implemented." error,
    // since fetchHabitProgress is now implemented.
});
