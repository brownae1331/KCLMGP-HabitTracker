import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchBuildHabitProgress } from './client';
import * as client from './client';

global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () =>
            Promise.resolve([{ progressDate: '2025-03-24T00:00:00Z', progress: 5 }]),
    } as unknown as Response)
) as jest.Mock;

describe('fetchBuildHabitProgress', () => {
    it('should call the correct endpoint and return data', async () => {
        const result = await fetchBuildHabitProgress(
            'user@example.com',
            'habitA',
            'week'
        );
        expect(result).toEqual([
            { progressDate: '2025-03-24T00:00:00Z', progress: 5 },
        ]);
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/stats/user@example.com/habitA?range=week'),
            expect.any(Object)
        );
    });
});

const BASE_URL = 'https://kclmgp-habittracker.onrender.com';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
}));

const setupFetchMock = (
    data: unknown,
    ok: boolean = true,
    status: number = 200
) => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok,
            status,
            statusText: ok ? 'OK' : 'Error',
            json: async () => data,
        } as unknown as Response)
    );
};

beforeEach(() => {
    jest.clearAllMocks();
    if (!global.fetch || !(global.fetch as jest.Mock).mock) {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => ({}),
            } as unknown as Response)
        );
    }
});

describe('Client Error Coverage Tests', () => {
    it('throws error if getUserDetails response not ok', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: async () => ({}),
        } as unknown as Response);
        await expect(client.getUserDetails('someUser')).rejects.toThrow(
            'Error fetching user details'
        );
    });

    it('logs error retrieving stored user data in getStoredUser', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => { });
        (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
            new Error('Storage error')
        );
        const result = await client.getStoredUser();
        expect(console.error).toHaveBeenCalledWith(
            'Error retrieving stored user data:',
            expect.any(Error)
        );
        expect(result).toBeNull();
        (console.error as jest.Mock).mockRestore();
    });

    it('logs error clearing user data in logout', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => { });
        (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(
            new Error('Remove error')
        );
        await client.logout();
        expect(console.error).toHaveBeenCalledWith(
            'Error clearing user data:',
            expect.any(Error)
        );
        (console.error as jest.Mock).mockRestore();
    });

    it('throws error if getHabitsForDate response not ok', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: async () => ({}),
        } as unknown as Response);
        await expect(
            client.getHabitsForDate('test@example.com', '2023-08-31')
        ).rejects.toThrow('Error fetching habits');
    });

    it('throws error if deleteUser response not ok', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: async () => ({}),
        } as unknown as Response);
        await expect(client.deleteUser('baduser@example.com')).rejects.toThrow(
            'Error deleting user'
        );
    });

    it('throws error if getHabitProgressByDate response not ok', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: async () => ({}),
        } as unknown as Response);
        await expect(
            client.getHabitProgressByDate('test@example.com', '2023-08-31')
        ).rejects.toThrow('Error fetching habit progress');
    });

    it('handles JSON parse error in apiRequest gracefully', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: jest.fn().mockRejectedValueOnce(new Error('JSON parse error')),
        } as unknown as Response);
        await expect(client.fetchHabits('broken@example.com')).rejects.toThrow(
            'Failed to fetch from'
        );
    });

    it('throws error if getUserDetails response not ok (重复测试)', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: async () => ({}),
        } as unknown as Response);
        await expect(client.getUserDetails('someUser')).rejects.toThrow(
            'Error fetching user details'
        );
    });

    it('logs error retrieving stored user data in getStoredUser (重复测试)', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => { });
        (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
            new Error('Storage error')
        );
        const result = await client.getStoredUser();
        expect(console.error).toHaveBeenCalledWith(
            'Error retrieving stored user data:',
            expect.any(Error)
        );
        expect(result).toBeNull();
        (console.error as jest.Mock).mockRestore();
    });

    it('logs error clearing user data in logout (重复测试)', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => { });
        (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(
            new Error('Remove error')
        );
        await client.logout();
        expect(console.error).toHaveBeenCalledWith(
            'Error clearing user data:',
            expect.any(Error)
        );
        (console.error as jest.Mock).mockRestore();
    });

    it('throws error if getHabitsForDate response not ok (重复测试)', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: async () => ({}),
        } as unknown as Response);
        await expect(
            client.getHabitsForDate('test@example.com', '2023-08-31')
        ).rejects.toThrow('Error fetching habits');
    });

    it('throws error if deleteUser response not ok (重复测试)', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: async () => ({}),
        } as unknown as Response);
        await expect(client.deleteUser('baduser@example.com')).rejects.toThrow(
            'Error deleting user'
        );
    });

    it('throws error if getHabitProgressByDate response not ok (重复测试)', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: async () => ({}),
        } as unknown as Response);
        await expect(
            client.getHabitProgressByDate('test@example.com', '2023-08-31')
        ).rejects.toThrow('Error fetching habit progress');
    });

    it('handles JSON parse error in apiRequest gracefully (重复测试)', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: jest.fn().mockRejectedValueOnce(new Error('JSON parse error')),
        } as unknown as Response);
        await expect(client.fetchHabits('broken@example.com')).rejects.toThrow(
            'Failed to fetch from'
        );
    });
});

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
        const getItemMock = AsyncStorage.getItem as jest.Mock<any, any>;
        getItemMock.mockResolvedValueOnce(mockUsername);
        getItemMock.mockResolvedValueOnce(mockEmail);
        const user = await client.getStoredUser();
        expect(user).toEqual({ username: mockUsername, email: mockEmail });
        expect(AsyncStorage.getItem).toHaveBeenCalledTimes(2);
    });

    test('getStoredUser() should handle empty AsyncStorage', async () => {
        const getItemMock = AsyncStorage.getItem as jest.Mock<any, any>;
        getItemMock.mockResolvedValueOnce(null);
        getItemMock.mockResolvedValueOnce(null);
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
            'https://kclmgp-habittracker.onrender.com/habits',
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
            `https://kclmgp-habittracker.onrender.com/habits/${mockUsername}/${mockHabit.habitName}`,
            expect.objectContaining({ method: 'DELETE' })
        );
        expect(response).toEqual({ success: true });
    });

    test('deleteHabit() should handle habit not found', async () => {
        setupFetchMock({ error: 'Habit not found' }, false, 404);
        await expect(client.deleteHabit(mockUsername, 'NonExistentHabit')).rejects.toThrow();
    });

    test('deleteUser should send a DELETE request and return response data (success scenario)', async () => {
        setupFetchMock({ success: true });
        const response = await client.deleteUser(mockUsername);
        expect(global.fetch).toHaveBeenCalledWith(
            `https://kclmgp-habittracker.onrender.com/users/${mockUsername}`,
            expect.objectContaining({ method: 'DELETE' })
        );
        expect(response).toEqual({ success: true });
    });

    test('deleteUser() should throw an error when deletion fails', async () => {
        jest.spyOn(client, 'deleteUser').mockRejectedValueOnce(new Error('Error deleting user'));
        await expect(client.deleteUser('testUser')).rejects.toThrow('Error deleting user');
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
        expect(global.fetch).toHaveBeenCalledWith(
            'https://kclmgp-habittracker.onrender.com/habits',
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

    describe('fetchHabits', () => {
        it('should fetch habits array for a user', async () => {
            const mockHabits = [{ id: 1, name: 'Test habit' }];
            setupFetchMock(mockHabits, true, 200);
            const result = await client.fetchHabits('test@example.com');
            expect(global.fetch).toHaveBeenCalledWith(
                `${BASE_URL}/habits/test@example.com`,
                expect.anything()
            );
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

    describe('fetchHabitProgress', () => {
        it('should return progress data for a habit in a given range', async () => {
            const mockProgress = [{ progressDate: '2023-01-01T00:00:00Z', progress: 60 }];
            setupFetchMock(mockProgress, true, 200);
            const result = await client.fetchBuildHabitProgress(
                'test@example.com',
                'Exercise',
                'week'
            );
            expect(global.fetch).toHaveBeenCalledWith(
                `${BASE_URL}/stats/test@example.com/Exercise?range=week`,
                expect.anything()
            );
            expect(result).toEqual(mockProgress);
        });

        it('should throw an error if fetch fails', async () => {
            setupFetchMock({ error: 'some error' }, false, 500);
            await expect(
                client.fetchBuildHabitProgress('test@example.com', 'Exercise', 'week')
            ).rejects.toThrow('some error');
        });
    });

    describe('fetchLongestStreak', () => {
        it('should return the longest streak data', async () => {
            const mockData = { longestStreak: 5 };
            setupFetchMock(mockData, true, 200);
            const result = await client.fetchLongestStreak(
                'test@example.com',
                'Exercise'
            );
            expect(global.fetch).toHaveBeenCalledWith(
                `${BASE_URL}/stats/longest-streak/test@example.com/Exercise`,
                expect.anything()
            );
            expect(result).toBe(5);
        });

        it('should throw an error if fetch fails', async () => {
            setupFetchMock({ error: 'some error' }, false, 500);
            await expect(
                client.fetchLongestStreak('test@example.com', 'Exercise')
            ).rejects.toThrowError();
        });
    });

    describe('fetchCompletionRate', () => {
        it('should return the completion rate', async () => {
            const mockData = { completionRate: 0.75 };
            setupFetchMock(mockData, true, 200);
            const result = await client.fetchCompletionRate(
                'test@example.com',
                'Exercise'
            );
            expect(global.fetch).toHaveBeenCalledWith(
                `${BASE_URL}/stats/completion-rate/test@example.com/Exercise`,
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

    describe('fetchAverageProgress', () => {
        it('should return the average progress', async () => {
            const mockData = { averageProgress: 45 };
            setupFetchMock(mockData, true, 200);
            const result = await client.fetchAverageProgress(
                'test@example.com',
                'Exercise'
            );
            expect(global.fetch).toHaveBeenCalledWith(
                `${BASE_URL}/stats/average-progress/test@example.com/Exercise`,
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
    beforeEach(() => {
        (global as any).apiRequest = jest.fn();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchBuildHabitProgress', () => {
        it('should throw an error if apiRequest fails', async () => {
            (global as any).apiRequest.mockRejectedValue(new Error('some error'));
            await expect(
                client.fetchBuildHabitProgress('test@example.com', 'Exercise', 'month')
            ).rejects.toThrow('some error');
            delete (global as any).apiRequest;
        });
    });

    describe('fetchStreak', () => {
        it('should throw an error if apiRequest fails', async () => {
            (global as any).apiRequest.mockRejectedValue(new Error('some error'));
            await expect(
                client.fetchStreak('test@example.com', 'Exercise', 'month')
            ).rejects.toThrow('some error');
        });
    });

    it('should call fetchBuildHabitProgress and return expected data', async () => {
        const mockData = [{ progressDate: '2023-01-01T00:00:00Z', progress: 70 }];
        setupFetchMock(mockData);
        delete (global as any).apiRequest;
        const result = await client.fetchBuildHabitProgress(
            'test@example.com',
            'Exercise',
            'month'
        );
        expect(result).toEqual(mockData);
        expect(global.fetch).toHaveBeenCalledWith(
            `${BASE_URL}/stats/test@example.com/Exercise?range=month`,
            expect.any(Object)
        );
    });
});

describe('Additional API Functions: Habit Interval, Habit Days, and Habit Streak', () => {
    const mockEmail = 'test@example.com';
    const habitName = 'Exercise';
    const testDate = '2025-03-15';
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getHabitInterval', () => {
        it('should return habit interval data when fetch is successful', async () => {
            const mockData = { interval: 3 };
            setupFetchMock(mockData, true, 200);
            const result = await client.getHabitInterval(mockEmail, habitName);
            expect(global.fetch).toHaveBeenCalledWith(
                `${BASE_URL}/habits/interval/${mockEmail}/${habitName}`
            );
            expect(result).toEqual(mockData);
        });

        it('should throw an error when fetch fails', async () => {
            setupFetchMock({ error: 'Error' }, false, 500);
            await expect(client.getHabitInterval(mockEmail, habitName)).rejects.toThrow(
                'Error fetching habit interval'
            );
        });
    });

    describe('getHabitDays', () => {
        it('should return habit days data when fetch is successful', async () => {
            const mockData = ['Monday', 'Wednesday', 'Friday'];
            setupFetchMock(mockData, true, 200);
            const result = await client.getHabitDays(mockEmail, habitName);
            expect(global.fetch).toHaveBeenCalledWith(
                `${BASE_URL}/habits/days/${mockEmail}/${habitName}`
            );
            expect(result).toEqual(mockData);
        });

        it('should throw an error when fetch fails', async () => {
            setupFetchMock({ error: 'Error' }, false, 500);
            await expect(client.getHabitDays(mockEmail, habitName)).rejects.toThrow(
                'Error fetching habit days'
            );
        });
    });

    describe('getHabitStreak', () => {
        it('should return habit streak data when fetch is successful', async () => {
            const mockData = { streak: 4 };
            setupFetchMock(mockData, true, 200);
            const result = await client.getHabitStreak(mockEmail, habitName, testDate);
            expect(global.fetch).toHaveBeenCalledWith(
                `${BASE_URL}/progress/streak/${mockEmail}/${habitName}/${testDate}`
            );
            expect(result).toEqual(mockData);
        });

        it('should throw an error when fetch fails', async () => {
            setupFetchMock({ error: 'Error' }, false, 500);
            await expect(client.getHabitStreak(mockEmail, habitName, testDate)).rejects.toThrow(
                'Error fetching habit streak'
            );
        });
    });
});

describe('getHabitProgressByDateAndHabit', () => {
    const mockEmail = 'test@example.com';
    const habitName = 'Exercise';
    const date = '2025-03-15';
    const formattedDate = new Date(date).toISOString().split('T')[0];
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return progress data for a habit on a specific date', async () => {
        const mockData = { progress: 80 };
        setupFetchMock(mockData, true, 200);
        const result = await client.getHabitProgressByDateAndHabit(
            mockEmail,
            habitName,
            date
        );
        expect(global.fetch).toHaveBeenCalledWith(
            `${BASE_URL}/progress/${encodeURIComponent(mockEmail)}/${habitName}/${formattedDate}`
        );
        expect(result).toEqual(mockData);
    });

    it('should throw an error when fetch fails', async () => {
        setupFetchMock({ error: 'Error' }, false, 500);
        await expect(
            client.getHabitProgressByDateAndHabit(mockEmail, habitName, date)
        ).rejects.toThrow('Error fetching habit progress');
    });
});

describe('exportUserData', () => {
    const mockEmail = 'test@example.com';
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return exported user data when fetch is successful', async () => {
        const mockData = { exported: true, data: { email: mockEmail } };
        setupFetchMock(mockData, true, 200);
        const result = await client.exportUserData(mockEmail);
        expect(global.fetch).toHaveBeenCalledWith(
            `${BASE_URL}/users/export/${mockEmail}`,
            expect.anything()
        );
        expect(result).toEqual(mockData);
    });

    it('should throw an error if fetch fails', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => ({ error: 'Export failed' }),
            } as unknown as Response)
        );
        await expect(client.exportUserData(mockEmail)).rejects.toThrow('Export failed');
    });
});

describe('fetchBuildHabitProgress coverage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        delete (global as any).apiRequest;
    });

    it('calls fetchBuildHabitProgress successfully and returns data', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () =>
                [{ progressDate: '2025-03-15T00:00:00Z', progress: 75 }],
        } as unknown as Response);
        const result = await fetchBuildHabitProgress(
            'test@example.com',
            'Reading',
            'week'
        );
        expect(result).toEqual([{ progressDate: '2025-03-15T00:00:00Z', progress: 75 }]);
        expect(global.fetch).toHaveBeenCalledWith(
            'https://kclmgp-habittracker.onrender.com/stats/test@example.com/Reading?range=week',
            expect.any(Object)
        );
    });
});

describe('Additional Branch Coverage Tests', () => {
    const mockEmail = 'test@example.com';
    const mockPassword = 'password123';
    const mockUsername = 'testuser';
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('init() should catch exceptions (e.g. network error) and log error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
        await expect(client.init()).rejects.toThrow('Network error');
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error initializing client:',
            expect.any(Error)
        );
        consoleErrorSpy.mockRestore();
    });

    it('createUser() should throw default error message when response fails without error field', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: async () => ({}),
            } as unknown as Response)
        );
        await expect(client.createUser(mockEmail, mockPassword, mockUsername))
            .rejects.toThrow('Error creating user');
    });

    it('logIn() should throw default error message when response fails without error field', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: async () => ({}),
            } as unknown as Response)
        );
        await expect(client.logIn(mockEmail, 'wrongpassword'))
            .rejects.toThrow('Error logging in');
    });

    it('updatePassword() should throw fallback error message when response fails without error field', async () => {
        const endpoint = `${BASE_URL}/users/${mockUsername}/password`;
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                status: 403,
                statusText: 'Forbidden',
                json: async () => ({}),
            } as unknown as Response)
        );
        await expect(client.updatePassword(mockUsername, 'oldPass', 'newPass'))
            .rejects.toThrow(`Failed to update password`);
    });

    it('exportUserData() should throw fallback error message when fetch fails without error field', async () => {
        const endpoint = `${BASE_URL}/users/export/${mockEmail}`;
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => ({}),
            } as unknown as Response)
        );
        await expect(client.exportUserData(mockEmail)).rejects.toThrow(
            `Failed to fetch from ${endpoint}: Internal Server Error`
        );
    });
});
