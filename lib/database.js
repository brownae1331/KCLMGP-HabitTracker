import * as SQLite from 'expo-sqlite';

const dbPromise = SQLite.openDatabaseAsync('habit_tracker.db');

const getDb = async () => {
    return await dbPromise;
};

// Initialize the database
export const init = async () => {
    const db = await getDb();
    try {
        await db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          username TEXT NOT NULL
        );
      `);
    } catch (error) {
        throw new Error(`Error initializing database: ${error.message}`);
    }
};

export const createUser = async (email, password, username) => {
    const db = await getDb();
    try {
        const result = await db.runAsync(
            `INSERT INTO users (email, password, username) VALUES (?, ?, ?);`,

            [email, password, username]
        );
        return result;
    } catch (error) {
        throw new Error(`Error creating user: ${error.message}`);
    }

}

export const signIn = async (email, password) => {
    const db = await getDb();
    try {
        const user = await db.getFirstAsync(
            `SELECT * FROM users WHERE email = ? AND password = ?;`,

            [email, password]
        );
        if (user) {
            return user;
        } else {
            throw new Error('Invalid credentials');
        }
    } catch (error) {
        throw new Error(`Error signing in: ${error.message}`);
    }
};

export default getDb;
