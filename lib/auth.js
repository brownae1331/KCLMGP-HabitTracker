import { createUser as dbCreateUser, signIn as dbSignIn } from './database';

export const createUser = async (email, password, username) => {
    try {
        const result = await dbCreateUser(email, password, username);
        return result;
    } catch (error) {
        console.log(error);
        throw new Error(error.message);
    }
};

export const signIn = async (email, password) => {
    try {
        const user = await dbSignIn(email, password);
        return user;
    } catch (error) {
        console.log(error);
        throw new Error(error.message);
    }
};