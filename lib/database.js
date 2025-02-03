import * as SQLite from 'expo-sqlite';
import bcrypt from 'react-native-bcrypt';


const dbPromise = SQLite.openDatabaseAsync('habit_tracker.db');

const getDb = async () => {
    return await dbPromise;
};

// Add this helper function for hashing passwords
const hashPassword = async (password) => {
    // Generate a salt with cost factor 10 (you can adjust this)
    const salt = bcrypt.genSaltSync(10);
    // Hash password with the generated salt
    return bcrypt.hashSync(password, salt);
};

const comparePasswords = async (password, hashedPassword) => {
    return bcrypt.compareSync(password, hashedPassword);
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

export const clearUsersTable = async () => {
    const db = await getDb();
    await db.execAsync(`DELETE FROM users;`);
};

// Add this new function to check for existing users
export const checkExistingUser = async (email, username) => {
    const db = await getDb();
    try {
        const existingEmail = await db.getFirstAsync(
            'SELECT email FROM users WHERE email = ?;',
            [email]
        );

        const existingUsername = await db.getFirstAsync(
            'SELECT username FROM users WHERE username = ?;',
            [username]
        );

        if (existingEmail) {
            throw new Error('An account with this email already exists');
        }
        if (existingUsername) {
            throw new Error('This username is already taken');
        }
    } catch (error) {
        throw error;
    }
};

// Update the createUser function
export const createUser = async (email, password, username) => {
    const db = await getDb();

    try {
        // First check for existing users
        await checkExistingUser(email, username);

        // Hash the password (bcrypt handles the salt internally)
        const hashedPassword = await hashPassword(password);

        // If no existing users found, create the new user
        const result = await db.runAsync(
            `INSERT INTO users (email, password, username) VALUES (?, ?, ?);`,
            [email, hashedPassword, username]
        );
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Update the signIn function
export const signIn = async (email, password) => {
    const db = await getDb();
    try {
        // Get the user
        const user = await db.getFirstAsync(
            `SELECT * FROM users WHERE email = ?;`,
            [email]
        );

        if (!user) {
            throw new Error('No account found with this email');
        }

        // Compare the provided password with the stored hash
        const passwordMatch = await comparePasswords(password, user.password);

        if (!passwordMatch) {
            throw new Error('Incorrect password');
        }

        // Don't send the password back to the client
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        throw error;
    }
};

export default getDb;
