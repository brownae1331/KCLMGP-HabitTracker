import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

const app = express();
const PORT = 3000; // Change if needed

// Database Configuration (Replace with your credentials)
const DB_CONFIG = {
  host: '127.0.0.1', // Use 127.0.0.1 for local MySQL
  user: 'root',       // Your MySQL username
  password: 'root',       // Your MySQL password (leave empty if no password)
  database: 'habitdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

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
        username VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        amount INT DEFAULT 0,
        positive BOOLEAN DEFAULT TRUE,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        increment INT DEFAULT 1,
        location VARCHAR(255) DEFAULT '',
        notifications_allowed BOOLEAN DEFAULT TRUE,
        notification_sound VARCHAR(100) DEFAULT 'default_ringtone',
        streak INT DEFAULT 0,
        PRIMARY KEY (username, name),
        FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
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

// Create a new user
app.post('/users', async (req, res) => {
  const { email, password, username } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
      [email, password, username]
    );
    res.status(201).json({ id: result.insertId, email, username });
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
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
