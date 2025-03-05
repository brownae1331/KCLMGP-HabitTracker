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

    await connection.query(`
      CREATE TABLE IF NOT EXISTS habit_locations (
        user_email VARCHAR(255) NOT NULL,
        habitName VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        PRIMARY KEY (user_email, habitName, location),
        FOREIGN KEY (user_email, habitName) REFERENCES habits(user_email, habitName) ON DELETE CASCADE
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
app.get('/habits/:email', async (req, res) => {
  const { email } = req.params;
  
  try {
    // Get habits plus any associated day
    const [rows] = await pool.query(`
      SELECT h.user_email, h.habitName, h.habitDescription, h.habitType,
             h.habitColor, h.scheduleOption, h.isGoalEnabled,
             h.goalValue, h.goalUnit, 
             hd.day
      FROM habits h
      LEFT JOIN habit_days hd
         ON h.user_email = hd.user_email
         AND h.habitName = hd.habitName
      WHERE h.user_email = ?
    `, [email]);
    
    // rows might look like this:
    // [
    //   { user_email: 'abc@gmail.com', habitName: 'Gym', ..., day: 'Monday' },
    //   { user_email: 'abc@gmail.com', habitName: 'Gym', ..., day: 'Wednesday' },
    //   { user_email: 'abc@gmail.com', habitName: 'Meditate', ..., day: 'Tuesday' }
    // ]

    // We need to group them by habitName to collect the days into an array:
    const habitMap = new Map();
    for (const row of rows) {
      const key = row.habitName;
      if (!habitMap.has(key)) {
        // Create a new habit object
        habitMap.set(key, {
          email: row.user_email,
          habitName: row.habitName,
          habitDescription: row.habitDescription,
          habitType: row.habitType,
          habitColor: row.habitColor,
          scheduleOption: row.scheduleOption,
          isGoalEnabled: !!row.isGoalEnabled,
          goalValue: row.goalValue,
          goalUnit: row.goalUnit,
          selectedDays: [],
        });
      }
      // If there's a day, push it into the array
      if (row.day) {
        habitMap.get(key).selectedDays.push(row.day);
      }
    }
    
    // Convert that map to an array
    const habits = Array.from(habitMap.values());
    
    res.json(habits);

  } catch (error) {
    console.error('Error retrieving habits:', error);
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

    await generateIntervalInstances(email, habitName, 7);
    await generateDayInstances(email, habitName, 7)
    migrateTodaysInstances(email);

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
    const [result] = await pool.query('DELETE FROM habits WHERE username = ? AND habitName = ?', [username, habitName]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: `Habit "${name}" deleted successfully.` });
    } else {
      res.status(404).json({ error: `Habit "${name}" not found.` });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error deleting habit' });
  }
});

//log progress of a specific habit
app.post('/habit-progress', async (req, res) => {
  const { email, habitName, progress } = req.body
  const today = new Date().toISOString().split('T')[0];

  try {
    const [existingProgress] = await pool.query(
      `SELECT * FROM habit_progress 
      WHERE user_email = ? AND habitName = ? AND progressDate = ?`, 
      [email, habitName, today]
    );

    let streak = 0;
    if (existingProgress.length > 0) {
      // for if the habits are implemented such that you can add progress
      // on top of previous progress (e.g. +1 glass of water towards the goalValue)
        // const prevProgress = existingProgress[0].progress;
        // const newProgress = prevProgress + progress;
        // const completed = newProgress >= existingProgress[0].goalValue;

      const completed = progress >= existingProgress[0].goalValue;

      if (completed) {
        const [yesterday] = await pool.query(`
          SELECT completed, streak 
          FROM habit_progress 
          WHERE user_email = ? AND habitName = ? 
          AND progressDate = DATE_SUB(?, INTERVAL 1 DAY)`,
          [email, habitName, today]
        );
        // if habit was completed yesterday, then streak = prevStreak + 1, else 1
        //streak = (yesterday.length > 0 && yesterday[0].completed) ? yesterday[0].streak + 1 : 1;
        streak = yesterday[0].streak + 1;
      }

      await pool.query(
        `UPDATE habit_progress SET progress = ?, completed = ?, streak = ?
        WHERE user_email = ? AND habitName = ? AND progressDate = ?`,
        [progress, completed, streak, email, habitName, today]
      );
    } else {
      await pool.query(
        `INSERT INTO habit_progress (user_email, habitName, progressDate, progress, completed, streak)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [email, habitName, today, progress, false, 0]
      );
    }

    res.status(200).json({ message: 'Progress updated' });

  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Get habit progress data for a specific user and habit
app.get('/habit-progress/:username/:habitName', async (req, res) => {
  const { username, habitName } = req.params;
  const { range } = req.query; // "7" for past 7 days, "30" for past 30 days/month, or 'month' for monthly average
  
  try {
    const [user] = await pool.query('SELECT email FROM users WHERE username = ?', [username]);
    if (user.length === 0) { 
      return res.status(404).json({ error: 'User not found' }); 
    }
    const userEmail = user[0].email;
    let query = '';
    let queryParams = [userEmail, habitName];
    if (range === '7' || range === '30') {
      query = `
        SELECT progressDate, progress
        FROM habit_progress
        WHERE user_email = ? AND habitName = ?
        AND progressDate BETWEEN CURDATE() - INTERVAL ? DAY AND CURDATE()
        ORDER BY progressDate ASC;
      `;
      queryParams.push(parseInt(range));
    } else if (range === 'month') {
      query = `
        SELECT 
          YEAR(progressDate) AS year,
          MONTH(progressDate) AS month,
          AVG(progress) AS avg_value
        FROM habit_progress
        WHERE user_email = ? AND habitName = ?
        AND progressDate BETWEEN ? AND ?
        GROUP BY YEAR(progressDate), MONTH(progressDate)
        ORDER BY YEAR(progressDate) DESC, MONTH(progressDate) DESC;
      `;
      queryParams.push(startDate.toISOString().split('T')[0]);
    } else {
      return res.status(400).json({ error: 'Invalid range parameter' });
    }
    const [progressData] = await pool.query(query, queryParams);
    res.json(progressData);
  } catch (error) {
    console.error('Error fetching habit progress:', error);
    res.status(500).json({ error: 'Error fetching habit progress data' });
  }
});


//
app.post('/habits/sync', async (req, res) => {
  const { userEmail } = req.body;
  if (!userEmail) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    await migrateTodaysInstances(userEmail);

    const [habits] = await pool.query(
      `SELECT habitName, scheduleOption FROM habits WHERE user_email = ?`,
      [userEmail]
    );

    for (const habit of habits) {
      if (habit.scheduleOption === 'interval') {
        await generateIntervalInstances(userEmail, habit.habitName);
      } else if (habit.scheduleOption === 'weekly') {
        await generateDayInstances(userEmail, habit.habitName);
      }

    }
    res.json({ message: 'Habits synchronized successfully' });
  } catch (error) {
    console.error('Error synchronizing habits:', error);
    res.status(500).json({ error: 'Error synchronizing habits' });
  }
});


//generate missing habit instances for interval habits 
//pregenerates up to 7 days worth of interval habits
const generateIntervalInstances = async (userEmail, habitName, daysAhead = 7) => {
  try {
    const [habitRows] = await pool.query(
      `SELECT h.scheduleOption, hi.increment
      FROM habits h
      LEFT JOIN habit_intervals hi
        ON h.user_email = hi.user_email AND h.habitName = hi.habitName
      WHERE h.user_email = ? AND h.habitName = ?`,
      [userEmail, habitName]
    );
    //table will have rows for user_email, habitName, scheduleOption and increment

    if (!habitRows.length) return;
    const habit = habitRows[0];
    if (habit.scheduleOption !== 'interval' || !habit.increment) return;

    const increment = habit.increment;
    const today = new Date();
    const cutoff = new Date();
    cutoff.setDate(today.getDate() + daysAhead);

    const [instanceRows] = await pool.query(
      `SELECT MAX(dueDate) as lastDate
      FROM habit_instances
      WHERE user_email = ? AND habitName = ?`,
      [userEmail, habitName]
    );

    let lastDate;
    if (instanceRows[0].lastDate) {
      lastDate = new Date(instanceRows[0].lastDate);
    } else {
      lastDate = new Date(today);
    }

    let nextDate = new Date(lastDate);
    //nextDate.setDate(nextDate.getDate() + increment);
    while (nextDate <= cutoff) {
      const dueDateStr = nextDate.toISOString().split('T')[0];
      await pool.query(
        `INSERT IGNORE INTO habit_instances (user_email, habitName, dueDate)
        VALUES (?, ?, ?)`,
        [userEmail, habitName, dueDateStr]
      );
      nextDate.setDate(nextDate.getDate() + increment);
    }
    console.log(`Generated missing interval instances for habit "${habitName}" for user ${userEmail}`);
  } catch (error) {
    console.error('Error generating missing interval instances:', error);
  }
};

const generateDayInstances = async (userEmail, habitName, daysAhead = 7) => {
  try {
    const [dayRows] = await pool.query(
      `SELECT day FROM habit_days WHERE user_email = ? AND habitName = ?`,
      [userEmail, habitName]
    );
    if (!dayRows.length) {
      console.log(`No scheduled days found for habit "${habitName}" for user ${userEmail}`);
      return;
    }
    const selectedDays = dayRows.map(row => row.day);
    const today = new Date();
    const cutoff = new Date();
    cutoff.setDate(today.getDate() + daysAhead);

    let currentDate = new Date(today);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    while (currentDate <= cutoff) {
      const dayName = dayNames[currentDate.getDay()];
      if (selectedDays.includes(dayName)) {
        const dueDateStr = currentDate.toISOString().split('T')[0];

        await pool.query(
          `INSERT IGNORE INTO habit_instances (user_email, habitName, dueDate)
          VALUES (?, ?, ?)`,
          [userEmail, habitName, dueDateStr]
        );
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    console.log(`Generated missing day instances for habit "${habitName}" for user ${userEmail}`);
  }
  catch (error) {
    console.error('Error generating missing day instances:', error);
  }
};

const migrateTodaysInstances = async (userEmail) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [instances] = await pool.query(
      `SELECT habitName FROM habit_instances
      WHERE user_email = ? AND dueDate = ?`,
      [userEmail, today]
    );

    for (const instance of instances) {
      const habitName = instance.habitName;
      await pool.query(
        `INSERT IGNORE INTO habit_progress (user_email, habitName, progressDate, progress, completed, streak)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [userEmail, habitName, today, 0, false, 0]
      );
      await pool.query(
        `DELETE FROM habit_instances
        WHERE user_email = ? AND habitName = ? AND dueDate = ?`,
        [userEmail, habitName, today]
      );
    }
    console.log(`Migrated today’s instances for user ${userEmail}`);
  } catch (error) {
    console.error('Error migrating today instances:', error);
  }
};


// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
