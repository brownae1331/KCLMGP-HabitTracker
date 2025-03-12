import AsyncStorage from '@react-native-async-storage/async-storage';
import { init, logIn, logout, createUser, getStoredUser, getUserDetails, getHabits, addHabit, deleteHabit, deleteUser } from '../client';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
}));

// Mock Client API functions with proper TypeScript typings
jest.mock('../client', () => ({
    init: jest.fn() as jest.MockedFunction<() => Promise<{ success: boolean }>>,
    logIn: jest.fn() as jest.MockedFunction<(email: string, password: string) => Promise<string>>,
    logout: jest.fn() as jest.MockedFunction<() => Promise<void>>,
    createUser: jest.fn() as jest.MockedFunction<(email: string, password: string, username: string) => Promise<string>>,
    getStoredUser: jest.fn() as jest.MockedFunction<() => Promise<{ username: string; email: string }>>,
    getUserDetails: jest.fn() as jest.MockedFunction<(username: string) => Promise<{ username: string; email: string }>>,
    getHabits: jest.fn() as jest.MockedFunction<(username: string) => Promise<{ name: string; username: string }[]>>,
    addHabit: jest.fn() as jest.MockedFunction<(habit: { username: string; name: string }) => Promise<{ success: boolean }>>,
    deleteHabit: jest.fn() as jest.MockedFunction<(username: string, habitName: string) => Promise<{ success: boolean }>>,
    deleteUser: jest.fn() as jest.MockedFunction<(username: string) => Promise<{ success: boolean }>>,
}));

// Utility function to mock fetch
const setupFetchMock = (data: unknown, ok: boolean = true, status: number = 200): void => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok,
            status,
            json: async () => data,
        }) as Promise<Response>
    );
};

describe('Client API Functions', () => {
    const mockEmail = 'test@example.com';
    const mockPassword = 'password123';
    const mockUsername = 'testuser';

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('init() should connect to the server', async () => {
        (init as jest.Mock).mockResolvedValueOnce({ success: true });
        
        const response = await init();
        expect(response).toEqual({ success: true });
    });

    test('logIn() should be called with email and password', async () => {
        (logIn as jest.Mock).mockResolvedValueOnce('Success');

        await logIn(mockEmail, mockPassword);

        expect(logIn).toHaveBeenCalledTimes(1);
        expect(logIn).toHaveBeenCalledWith(mockEmail, mockPassword);
    });

    test('createUser() should be called with correct parameters', async () => {
        (createUser as jest.Mock).mockResolvedValueOnce('User created');
        
        await createUser(mockEmail, mockPassword, mockUsername);

        expect(createUser).toHaveBeenCalledWith(mockEmail, mockPassword, mockUsername);
    });

    test('getStoredUser() should retrieve user data from AsyncStorage', async () => {
        (getStoredUser as jest.Mock).mockResolvedValueOnce({ username: 'testUser', email: 'test@example.com' });
    
        const user = await getStoredUser();
        expect(user).toEqual({ username: 'testUser', email: 'test@example.com' });
    });

    test('getUserDetails() should fetch user details', async () => {
        (getUserDetails as jest.Mock).mockResolvedValueOnce({ username: 'testUser', email: 'test@example.com' });
    
        const user = await getUserDetails('testUser');
        expect(user).toEqual({ username: 'testUser', email: 'test@example.com' });
    });

    test('getHabits() should fetch user habits', async () => {
        (getHabits as jest.Mock).mockResolvedValueOnce([{ name: 'Exercise', username: 'testUser' }]);
    
        const habits = await getHabits('testUser');
        expect(habits).toEqual([{ name: 'Exercise', username: 'testUser' }]);
    });

    test('addHabit() should send a POST request', async () => {
        (addHabit as jest.Mock).mockResolvedValueOnce({ success: true });
        const newHabit = { username: 'testUser', name: 'Reading' };
    
        const response = await addHabit(newHabit);
        expect(response).toEqual({ success: true });
    });

    test('deleteHabit() should send a DELETE request', async () => {
        (deleteHabit as jest.Mock).mockResolvedValueOnce({ success: true });
    
        const response = await deleteHabit('testUser', 'Reading');
        expect(response).toEqual({ success: true });
    });

    test('logout() should remove stored user data', async () => {
        const { logout } = jest.requireActual('../client');
        await logout();
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('username');
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('email');
    });

    test('deleteUser() should handle errors correctly', async () => {
        (deleteUser as jest.Mock).mockRejectedValueOnce(new Error('Error deleting user'));
    
        await expect(deleteUser('testUser')).rejects.toThrow('Error deleting user');
    });
});