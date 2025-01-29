import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('habit_tracker.db');

// Initialize the database
export const init = () => {
    return new Promise((resolve, reject) => {
        // Create the users table
        db.transaction(tx => {
            tx.executeSql(
                `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          username TEXT NOT NULL
        );`,
                [],
                () => {
                    resolve();
                },
                (_, error) => {
                    reject(error);
                }
            );
        });
    });
};

export const createUser = (email, password, username) => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            tx.executeSql(
                `INSERT INTO users (email, password, username) VALUES (?, ?, ?);`,
                [email, password, username],
                (_, result) => {
                    resolve(result);
                },
                (_, error) => {
                    reject(error);
                }
            );
        });
    });
};

export const signIn = (email, password) => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            tx.executeSql(
                `SELECT * FROM users WHERE email = ? AND password = ?;`,
                [email, password],
                (_, { rows }) => {
                    if (rows.length > 0) {
                        resolve(rows._array[0]);
                    } else {
                        reject(new Error('Invalid credentials'));
                    }
                },
                (_, error) => {
                    reject(error);
                }
            );
        });
    });
};

export default db;
