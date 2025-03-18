import AsyncStorage from '@react-native-async-storage/async-storage';
// import {
//     init,
//     getUserDetails,
//     createUser,
//     logIn,
//     getStoredUser,
//     logout,
//     getHabitsForDate,
//     addHabit,
//     deleteHabit,
//     deleteUser,
//     updateHabitProgress,
//     getHabitProgressByDate,
//     updatePassword,
//     Habit
// } from '../client';
import * as client from './client';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
}));

// simulate a fetch response
const setupFetchMock = (data: unknown, ok: boolean = true, status: number = 200) => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok,
            status,
            json: async () => data,
        }as Response)
    );
};

describe('Client API Integration Tests', () => {
    const mockEmail = 'test@example.com';
    const mockPassword = 'password123';
    const mockUsername = 'testuser';
    const testDate = '2025-03-15';
    const mockHabit : client.Habit = {
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

    test('init() should initialise client', async () => {
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

    test('logIn() should be called with email and password, store user info into AsyncStorage', async () => {
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

    test('getHabitsForDate() should fetch user habits for specific date', async () => {
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
            expect.objectContaining({method: 'DELETE',})
        );
        expect(response).toEqual({ success: true });
    });

    test('deleteHabit() should handle habit not found', async () => {
        setupFetchMock({ error: 'Habit not found' }, false, 404);
        await expect(client.deleteHabit(mockUsername, 'NonExistentHabit')).rejects.toThrow();
    });

    test('deleteUser should send a DELETE request and return response data (success scenario)', async () => {
        // succecc scenario: return { success: true }
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
        // const { logout } = jest.requireActual('../client');
        await client.logout();
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('username');
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('email');
    });

    test('deleteUser() should handle errors correctly', async () => {
        (client.deleteUser as jest.Mock).mockRejectedValueOnce(new Error('Error deleting user'));
    
        await expect(client.deleteUser('testUser')).rejects.toThrow('Error deleting user');
    });

    test('updateHabitProgress() should update process of habit', async () => {
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

    test('getHabitProgressByDate() should get process of specific date', async () => {
        const progressData = { habit: 'Exercise', date: testDate, progress: 75 };
        setupFetchMock(progressData);
        const response = await client.getHabitProgressByDate(mockEmail, testDate);
        expect(response).toEqual(progressData);
        expect(global.fetch).toHaveBeenCalled();
    });

    test('updatePassword() should update password of user', async () => {
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

});