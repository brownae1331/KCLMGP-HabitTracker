import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10),
    queueLimit: 0
};

// Create a MySQL Connection Pool
export const pool = mysql.createPool(DB_CONFIG);

// Initialize Database (Create Tables if Not Exists)
export const initDatabase = async () => {
    try {
        const connection = await pool.getConnection();

        await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(255) PRIMARY KEY,
        password VARCHAR(255) NOT NULL,
        username VARCHAR(100) NOT NULL
      );
    `);

        await connection.query(`
    CREATE TABLE IF NOT EXISTS habits (
      user_email VARCHAR(255) NOT NULL,
      habitName VARCHAR(255) NOT NULL,
      habitDescription TEXT,
      habitType ENUM('build','quit') NOT NULL,
      habitColor VARCHAR(7) NOT NULL,
      scheduleOption ENUM('interval','weekly') NOT NULL,
      goalValue DOUBLE,
      goalUnit VARCHAR(50),
      PRIMARY KEY (user_email, habitName),
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
    );
    `);

        await connection.query(`
      CREATE TABLE IF NOT EXISTS habit_progress (
        user_email VARCHAR(255) NOT NULL,
        habitName VARCHAR(255) NOT NULL,
        progressDate DATE NOT NULL DEFAULT (CURRENT_DATE),
        progress DOUBLE DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        streak INT DEFAULT 0,
        PRIMARY KEY (user_email, habitName, progressDate),
        FOREIGN KEY (user_email, habitName) REFERENCES habits(user_email, habitName) ON DELETE CASCADE
      );
    `);

        await connection.query(`
      CREATE TABLE IF NOT EXISTS habit_instances(
        user_email VARCHAR(255) NOT NULL,
        habitName VARCHAR(255) NOT NULL,
        dueDate DATE NOT NULL,
        PRIMARY KEY (user_email, habitName, dueDate),
        FOREIGN KEY (user_email, habitName) REFERENCES habits(user_email, habitName) ON DELETE CASCADE
      );
    `);

        await connection.query(`
      CREATE TABLE IF NOT EXISTS habit_intervals (
        user_email VARCHAR(255) NOT NULL,
        habitName VARCHAR(255) NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        increment INT DEFAULT 1,
        PRIMARY KEY (user_email, habitName),
        FOREIGN KEY (user_email, habitName) REFERENCES habits(user_email, habitName) ON DELETE CASCADE
      );
    `);

        await connection.query(`
      CREATE TABLE IF NOT EXISTS habit_days (
        user_email VARCHAR(255) NOT NULL,
        habitName VARCHAR(255) NOT NULL,
        day ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
        PRIMARY KEY (user_email, habitName, day),
        FOREIGN KEY (user_email, habitName) REFERENCES habits(user_email, habitName) ON DELETE CASCADE
      );
    `);

        connection.release();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};
