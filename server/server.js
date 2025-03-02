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
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        username VARCHAR(100) NOT NULL,
        INDEX idx_username (username)
      );
    `);


    await connection.query(`
      CREATE TABLE IF NOT EXISTS habits (
        email VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        amount INT DEFAULT 0,
        positive BOOLEAN DEFAULT TRUE,
        date DATETIME DEFAULT NULL,
        increment INT DEFAULT 1,
        location VARCHAR(255) DEFAULT '',
        notifications_allowed BOOLEAN DEFAULT TRUE,
        notification_sound VARCHAR(100) DEFAULT 'default_ringtone',
        streak INT DEFAULT 0,
        PRIMARY KEY (email, name),
        FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
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
  const { username, name, description, amount, positive, date, increment, location, notifications_allowed, notification_sound, streak } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO habits (username, name, description, amount, positive, date, increment, location, notifications_allowed, notification_sound, streak) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, name, description, amount, positive, date, increment, location, notifications_allowed, notification_sound, streak]
    );
    res.status(201).json({ id: result.insertId, message: 'Habit added successfully' });
  } catch (error) {
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
