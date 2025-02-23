import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config();

const app = express();
const PORT = 3000;

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10),
  queueLimit: 0
};

const SALT_ROUNDS = 10;

// Create a MySQL Connection Pool
const pool = mysql.createPool(DB_CONFIG);

// Initialize Database (Create Tables if Not Exists)
const initDatabase = async () => {
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
      isGoalEnabled BOOLEAN DEFAULT FALSE,
      goalValue DOUBLE,
      goalUnit VARCHAR(50),
      -- dummy or default for now
      notification_sound VARCHAR(100) DEFAULT 'default_ringtone',
      streak INT DEFAULT 0,
      PRIMARY KEY (user_email, habitName),
      FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
    );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS habit_progress (
        user_email VARCHAR(255) NOT NULL,
        habitName VARCHAR(255) NOT NULL,
        progress_date DATE NOT NULL DEFAULT CURRENT_DATE,
        amount_completed INT DEFAULT 0,
        PRIMARY KEY (user_email, habitName, progress_date),
        FOREIGN KEY (user_email, habitName) REFERENCES habits(user_email, habitName) ON DELETE CASCADE
      );
    `);
    

    await connection.query(`
      CREATE TABLE IF NOT EXISTS habit_intervals (
        user_email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        increment INT DEFAULT 1,
        PRIMARY KEY (user_email, habitName),
        FOREIGN KEY (user_email, habitName) REFERENCES habits(user_email, habitName) ON DELETE CASCADE
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS habit_days (
        user_email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        day ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
        PRIMARY KEY (user_email, habitName, day),
        FOREIGN KEY (user_email, habitName) REFERENCES habits(user_email, habitName) ON DELETE CASCADE
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS habit_locations (
        user_email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        PRIMARY KEY (user_email, name, location),
        FOREIGN KEY (user_email, name) REFERENCES habits(user_email, habitName) ON DELETE CASCADE
      );
    `);

    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Initialize Database
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Default Route
app.get('/', (req, res) => {
  res.send('Habit Tracker API is running 🚀');
});

// Get all users
app.get('/users', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Get a user by email
app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Compare the provided password with the stored hash
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Don't send the password hash back to the client
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error retrieving user' });
  }
});

// Create a new user
app.post('/users/signup', async (req, res) => {
  const { email, password, username } = req.body;

  // Validate required fields
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate email format
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  // Validate username length and format
  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
  }

  try {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
      [email, hashedPassword, username]
    );
    res.status(201).json({ id: result.insertId, email, username });
  } catch (error) {
    // Handle specific MySQL errors
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage.includes('email')) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      return res.status(409).json({ error: 'Duplicate entry' });
    }

    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error while creating user' });
  }
});

// Delete a user
app.delete('/users/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM users WHERE username = ?', [username]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: `User ${username} deleted successfully.` });
    } else {
      res.status(404).json({ error: `User ${username} not found.` });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error deleting user' });
  }
});

// Get all habits for a user
app.get('/habits/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const [habits] = await pool.query('SELECT * FROM habits WHERE username = ?', [username]);
    res.json(habits);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving habits' });
  }
});

// Add a new habit
app.post('/habits', async (req, res) => {
  const {
    email,
    habitName,
    habitDescription,
    habitType,
    habitColor,
    scheduleOption,
    intervalDays,
    selectedDays,
    isGoalEnabled,
    goalValue,
    goalUnit
  } = req.body;

  try {
    // 1) Insert into the main habits table
    await pool.query(
      `INSERT INTO habits
      (user_email, habitName, habitDescription, habitType, habitColor,
       scheduleOption, isGoalEnabled, goalValue, goalUnit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        habitName,
        habitDescription || '',
        habitType,
        habitColor,
        scheduleOption,
        isGoalEnabled ? 1 : 0,
        goalValue || null,
        goalUnit || null
      ]
    );

    // 2) If the schedule is "weekly," insert each selected day into habit_days
    if (scheduleOption === 'weekly' && Array.isArray(selectedDays)) {
      for (const day of selectedDays) {
        await pool.query(
          `INSERT INTO habit_days (user_email, habitName, day)
           VALUES (?, ?, ?)`,
          [email, habitName, day]
        );
      }
    }

    // 3) If the schedule is "interval," insert a row into habit_intervals
    if (scheduleOption === 'interval' && intervalDays) {
      await pool.query(
        `INSERT INTO habit_intervals (user_email, habitName, increment)
         VALUES (?, ?, ?)`,
        [email, habitName, parseInt(intervalDays, 10)]
      );
    }

    res.status(201).json({ message: 'Habit added successfully' });
  } catch (error) {
    console.error('Error adding habit:', error);
    // e.g. handle duplicates or other errors
    res.status(500).json({ error: 'Error adding habit' });
  }
});


// Delete a habit
app.delete('/habits/:username/:name', async (req, res) => {
  const { username, name } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM habits WHERE username = ? AND name = ?', [username, name]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: `Habit "${name}" deleted successfully.` });
    } else {
      res.status(404).json({ error: `Habit "${name}" not found.` });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error deleting habit' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
