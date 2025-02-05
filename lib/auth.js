import { createUser as dbCreateUser, signIn as dbSignIn } from './database';

export const createUser = async (email, password, username) => {
    try {
        // Validate inputs
        if (!email || !password || !username) {
            throw new Error('All fields are required');
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Please enter a valid email address');
        }

        // Basic username validation
        if (username.length < 3) {
            throw new Error('Username must be at least 3 characters long');
        }

        const result = await dbCreateUser(email, password, username);
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
};

export const signIn = async (email, password) => {
    try {
        // Validate inputs
        if (!email || !password) {
            throw new Error('All fields are required');
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Please enter a valid email address');
        }

        // Basic password validation
        if (password.length < 1) {
            throw new Error('Please enter your password');
        }

        const user = await dbSignIn(email, password);
        return user;
    } catch (error) {
        throw new Error(error.message);
    }
};