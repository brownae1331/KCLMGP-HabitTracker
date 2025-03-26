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
    await syncHabits(email);
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
app.delete('/users/:email', async (req, res) => {
  const { email } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      'DELETE FROM users WHERE email = ?',
      [email]
    );
    if (result.affectedRows > 0) {
      await connection.commit();
      res.json({
        success: true,
        message: `All data for user with email ${email} deleted successfully.`
      });
    } else {
      await connection.rollback();
      res.status(404).json({ error: `User with email ${email} not found.` });
    }
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting user data:', error);
    res.status(500).json({ error: 'Server error deleting user data' });
  } finally {
    connection.release();
  }
});

// Get all habits for a particular date
app.get('/habits/:email/:date', async (req, res) => {
  const { email, date } = req.params;
  const requestedDate = new Date(date);
  if (isNaN(requestedDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format' });
  }
  const today = new Date();

  try {
    let habits = [];
    await migrateInstances(email, '<=');
    if (requestedDate > today) {
      // Fetch habits from habit_instances for future dates
      habits = await getHabitsForDate(email, requestedDate, 'instances');
    } else {
      // Fetch habits from habit_progress for past or today
      habits = await getHabitsForDate(email, requestedDate, 'progress');
    }

    res.json(habits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).send('Server error');
  }
});

// Adjust the get habit query to fetch from habit_progress or habit_instances depending on the date
export async function getHabitsForDate(email, date, type) {
  let query;
  const queryParams = [email, date];

  if (type === 'progress') {
    query = `
      SELECT h.user_email, h.habitName, h.habitDescription, h.habitType, h.habitColor,
             h.scheduleOption, h.goalValue, h.goalUnit
      FROM habit_progress hp
      JOIN habits h ON hp.habitName = h.habitName AND hp.user_email = h.user_email  -- Matching both columns
      WHERE hp.user_email = ? AND hp.progressDate = ?`;
  } else {
    query = `
      SELECT h.user_email, h.habitName, h.habitDescription, h.habitType, h.habitColor,
             h.scheduleOption, h.goalValue, h.goalUnit
      FROM habit_instances hi
      JOIN habits h ON hi.habitName = h.habitName AND hi.user_email = h.user_email  -- Matching both columns
      WHERE hi.user_email = ? AND hi.dueDate = ?`;
  }

  const [rows] = await pool.query(query, queryParams);
  return rows;
}


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
    goalValue,
    goalUnit
  } = req.body;

  try {
    // 1) Insert into the main habits table
    await pool.query(
      `INSERT INTO habits
      (user_email, habitName, habitDescription, habitType, habitColor,
       scheduleOption, goalValue, goalUnit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        habitName,
        habitDescription || '',
        habitType,
        habitColor,
        scheduleOption,
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
    await migrateInstances(email);

    res.status(201).json({ message: 'Habit added successfully' });
  } catch (error) {
    console.error('Error adding habit:', error);
    // e.g. handle duplicates or other errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Habit already exists for this user' });
    } else {
      res.status(500).json({ error: 'Error adding habit' });
    }
  }
});

// Get the names and types of all habits for a user
app.get('/habits/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const [habits] = await pool.query(`
      SELECT habitName, habitType, goalValue 
      FROM habits 
      WHERE user_email = ?`, [email]);
    if (habits.length === 0) {
      return res.json([]);
    }
    res.json(habits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    res.status(500).json({ error: 'Error fetching habit names and types' });
  }
});

// Delete a habit
app.delete('/habits/:user_email/:habitName', async (req, res) => {
  const { user_email, habitName } = req.params;
  try {
    await pool.query(
      'DELETE FROM habits WHERE user_email = ? AND habitName = ?',
      [user_email, habitName]
    );
    res.json({ success: true, message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Error deleting habit' });
  }
});

//log progress of a specific habit
app.post('/habit-progress', async (req, res) => {
  const { email, habitName, progress } = req.body
  const today = new Date().toISOString().split('T')[0];

  try {
    const [existingProgress] = await pool.query(
      `SELECT hp.*, h.goalValue 
       FROM habit_progress hp
       JOIN habits h ON hp.user_email = h.user_email AND hp.habitName = h.habitName
       WHERE hp.user_email = ? AND hp.habitName = ? AND hp.progressDate = ?`,
      [email, habitName, today]
    );

    if (!existingProgress.length) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    let streak = 0;
    let completed = false;
    const { goalValue } = existingProgress[0];
    if (existingProgress.length > 0) {
      completed = goalValue !== null ? progress >= goalValue : progress >= 1;

      if (completed) {
        const [recent] = await pool.query(`
          SELECT completed, streak 
          FROM habit_progress 
          WHERE user_email = ? AND habitName = ? 
          AND progressDate < ? ORDER BY progressDate DESC LIMIT 1`,
          [email, habitName, today]
        );
        streak = (recent.length > 0 && recent[0].completed) ? recent[0].streak + 1 : 1;
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

// get streak for quit habits
app.get('/stats/:email/:habitName/streak', async (req, res) => {
  const { email, habitName } = req.params;
  const { range } = req.query;
  const today = new Date();
  const startDate = new Date(today);

  if (range === 'week' || range === 'month') {
    startDate.setDate(range === 'week' ? today.getDate() - ((today.getDay() + 6) % 7) : 1);
    const query = `
      SELECT progressDate, streak 
      FROM habit_progress 
      WHERE user_email = ? AND habitName = ? AND progressDate >= ?
      ORDER BY progressDate ASC
    `;
    const params = [email, habitName, startDate.toISOString().split('T')[0]];
    try {
      const [rows] = await pool.query(query, params);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  } else {
    return res.status(400).json({ error: 'Invalid range: use "week" or "month"' });
  }
});

app.get('/stats/:email/:habitName/longest-streak', async (req, res) => {
  const { email, habitName } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT MAX(streak) as longestStreak
      FROM habit_progress
      WHERE user_email = ? AND habitName = ?`, 
      [email, habitName]
    );
    const longestStreak = rows[0].longestStreak || 0;
    res.json({ longestStreak });
  } catch (error) {
    console.error('Error fetching longest streak: ', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/stats/:email/:habitName/completion-rate', async (req, res) => {
  const { email, habitName } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT
        SUM(CASE WHEN completed = true THEN 1 ELSE 0 END) as completedDays,
        COUNT(*) as totalDays
      FROM habit_progress
      WHERE user_email = ? AND habitName = ?`,
      [email, habitName]
    );
    const { completedDays, totalDays } = rows[0];
    const completionRate = totalDays > 0 ? (completedDays/totalDays)*100 : 0;
    res.json({ completionRate: Math.round(completionRate) });
    } catch (error) {
      console.error('Error fetching completion rate: ', error);
      res.status(500).json({ error: 'Server error' });
  }
})

app.get('/stats/:email/:habitName/average-progress', async (req, res) => {
  const { email, habitName } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT AVG(progress) as averageProgress
      FROM habit_progress
      WHERE user_email = ? AND habitName = ?`,
    [email, habitName]);
    const averageProgress = rows[0].averageProgress || 0;
    res.json({ averageProgress : Math.round(averageProgress) });

  } catch (error) {
    console.error('Error fetching average progress: ', error);
      res.status(500).json({ error: 'Server error' });
  }
})

// get progress for build habits
app.get('/stats/:email/:habitName/progress', async (req, res) => {
  const { email, habitName } = req.params;
  const { range } = req.query;
  const today = new Date();
  const startDate = new Date(today);
  try {
    let query, params;
    if (range === 'week' || range === 'month') {
      startDate.setDate(range === 'week' ? today.getDate() - ((today.getDay() + 6) % 7) : 1);
      query = `
        SELECT progressDate, progress
        FROM habit_progress
        WHERE user_email = ? AND habitName = ? AND progressDate >= ?
        ORDER BY progressDate ASC
      `;
      params = [email, habitName, startDate.toISOString().split('T')[0]];
    }
    else if (range === 'year') {
      query = `
        SELECT MONTH(progressDate) as month, AVG(progress) as avgProgress
        FROM habit_progress
        WHERE user_email = ? AND habitName = ? AND YEAR(progressDate) = ?
        GROUP BY MONTH(progressDate)
        ORDER BY month ASC
      `;
      params = [email, habitName, today.getFullYear()];
    }
    else {
      return res.status(400).json({ error: 'Invalid range' });
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get habit progress data for all habits of a specific user on a specific date
app.get('/habit-progress-by-date/:email/:date', async (req, res) => {
  const { email, date } = req.params;

  try {
    const [user] = await pool.query('SELECT email FROM users WHERE email = ?', [email]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [progressData] = await pool.query(
      `SELECT hp.progress, hp.completed, hp.streak, h.goalValue, h.habitType
       FROM habit_progress hp
       JOIN habits h ON hp.user_email = h.user_email AND hp.habitName = h.habitName
       WHERE hp.user_email = ? AND hp.progressDate = ?`,
      [email, date]
    );
    res.json(progressData);
  } catch (error) {
    console.error('Error fetching habit progress:', error);
    res.status(500).json({ error: 'Error fetching habit progress data' });
  }
});

app.get('/habit-streak-by-date/:email/:habitName/:date', async (req, res) => {
  const { email, habitName, date } = req.params;
  try {
    const [streakData] = await pool.query(
      `SELECT streak FROM habit_progress 
       WHERE user_email = ? AND habitName = ? AND progressDate = ?`,
      [email, habitName, date]
    );
    res.json(streakData[0] || { streak: 0 });
  } catch (error) {
    console.error('Error fetching habit streak:', error);
    res.status(500).json({ error: 'Error fetching habit streak data' });
  }
});

// Get habit progress for a specific habit on a specific date
app.get('/habit-progress-by-date/:email/:habitName/:date', async (req, res) => {
  const { email, habitName, date } = req.params;
  try {
    const [progressData] = await pool.query(
      `SELECT progress FROM habit_progress 
       WHERE user_email = ? AND habitName = ? AND progressDate = ?`,
      [email, habitName, date]
    );
    res.json(progressData[0] || { progress: 0 });
  } catch (error) {
    console.error('Error fetching habit progress:', error);
    res.status(500).json({ error: 'Error fetching habit progress data' });
  }
});


const syncHabits = async (userEmail) => {
  try {
    // catch up on all past and current due habits
    await migrateInstances(userEmail, '<=');
    await fillMissedProgress(userEmail);

    // generate new instances for all habits
    const [habits] = await pool.query(
      `SELECT habitName, scheduleOption FROM habits WHERE user_email = ?`,
      [userEmail]
    );

    if (!Array.isArray(habits)) {
      throw new Error('Invalid habits data');
    }

    for (const habit of habits) {
      if (habit.scheduleOption === 'interval') {
        await generateIntervalInstances(userEmail, habit.habitName);
      } else if (habit.scheduleOption === 'weekly') {
        await generateDayInstances(userEmail, habit.habitName);
      }
    }
    console.log(`Habits synchronized for user ${userEmail}`);
  } catch (error) {
    console.error('Error synchronizing habits:', error);
    throw error;
  }
};

// helper function: retrieves most recent date of progress of a habit
const getLastDate = async (table, userEmail, habitName, dateColumn, defaultDate) => {
  const [rows] = await pool.query(
    `SELECT MAX(${dateColumn}) as lastDate
     FROM ${table}
     WHERE user_email = ? AND habitName = ?`,
    [userEmail, habitName]
  );
  return rows[0].lastDate ? new Date(rows[0].lastDate) : new Date(defaultDate);
};

// helper function:
const generateIntervalDates = (startDate, endDate, increment) => {
  const dates = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + increment);
  }
  return dates;
};

const generateWeeklyDates = (startDate, endDate, selectedDays) => {
  const dates = [];
  let currentDate = new Date(startDate);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  while (currentDate <= endDate) {
    if (selectedDays.includes(dayNames[currentDate.getDay()])) {
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

//generate missing habit instances for interval habits 
//pregenerates up to 7 days worth of interval habits
export const generateIntervalInstances = async (userEmail, habitName, daysAhead = 7) => {
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

    const lastDate = await getLastDate('habit_instances', userEmail, habitName, 'dueDate', today);
    const dates = generateIntervalDates(lastDate, cutoff, increment);
    for (const date of dates) {
      await pool.query(
        `INSERT IGNORE INTO habit_instances (user_email, habitName, dueDate)
        VALUES (?, ?, ?)`,
        [userEmail, habitName, date]
      );
    }
    console.log(`Generated missing interval instances for habit "${habitName}" for user ${userEmail}`);
  } catch (error) {
    console.error('Error generating missing interval instances:', error);
  }
};

// Calculates future due dates for weekly habits for the next 7 days
// unless a different daysAhead is passed as a parameter
export const generateDayInstances = async (userEmail, habitName, daysAhead = 7) => {
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

    const dates = generateWeeklyDates(today, cutoff, selectedDays);
    for (const date of dates) {
      await pool.query(
        `INSERT IGNORE INTO habit_instances (user_email, habitName, dueDate)
         VALUES (?, ?, ?)`,
        [userEmail, habitName, date]
      );
    }
    console.log(`Generated missing day instances for habit "${habitName}" for user ${userEmail}`);
  }
  catch (error) {
    console.error('Error generating missing day instances:', error);
  }
};

// Moves habits from habit_instances to habit_progress if the due date is today or in the past
// depending on what dateContidion is passed in 
//change name to migrateInstances pls
export const migrateInstances = async (userEmail, dateCondition = '=', dateValue = new Date().toISOString().split('T')[0]) => {
  try {
    const [instances] = await pool.query(
      `SELECT habitName, dueDate FROM habit_instances
      WHERE user_email = ? AND dueDate ${dateCondition} ?`,
      [userEmail, dateValue]
    );

    for (const instance of instances) {
      const habitName = instance.habitName;
      const instanceDueDate = instance.dueDate
      await pool.query(
        `INSERT IGNORE INTO habit_progress (user_email, habitName, progressDate, progress, completed, streak)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [userEmail, habitName, instanceDueDate, 0, false, 0]
      );
      await pool.query(
        `DELETE FROM habit_instances
        WHERE user_email = ? AND habitName = ? AND dueDate = ?`,
        [userEmail, habitName, instanceDueDate]
      );
      console.log(`Migrated habit: ${habitName} due on: ${instanceDueDate} for user: ${userEmail}`);
    }
    console.log(`Migrated today's instances for user ${userEmail}`);
  } catch (error) {
    console.error('Error migrating today instances:', error);
  }
};

const fillMissedProgress = async (userEmail) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const [habits] = await pool.query(
      `SELECT habitName, scheduleOption FROM habits 
      WHERE user_email = ?`,
      [userEmail]
    );

    for (const habit of habits) {
      const { habitName, scheduleOption } = habit;
      const lastProgressDate = await getLastDate('habit_progress', userEmail, habitName, 'progressDate', today);
      if (lastProgressDate >= today) continue;

      let dates = [];
      if (scheduleOption === 'interval') {
        const [interval] = await pool.query(
          `SELECT increment FROM habit_intervals 
          WHERE user_email = ? AND habitName = ?`,
          [userEmail, habitName]
        );
        if (!interval.length) continue;
        const increment = interval[0].increment;
        // gap between today and the most recent date of recorded progress
        const gapDays = Math.floor((today - lastProgressDate) / (1000 * 60 * 60 * 24));
        if (gapDays <= increment) continue;
        dates = generateIntervalDates(lastProgressDate, today, increment);
      } else if (scheduleOption === 'weekly') {
        const [days] = await pool.query(
          `SELECT day FROM habit_days 
          WHERE user_email = ? AND habitName = ?`,
          [userEmail, habitName]
        );
        if (!days.length) continue;
        const selectedDays = days.map(row => row.day);
        dates = generateWeeklyDates(lastProgressDate, today, selectedDays);
      }

      for (const date of dates) {
        if (date < todayStr) {
          await pool.query(
            `INSERT IGNORE INTO habit_progress 
            (user_email, habitName, progressDate, progress, completed, streak)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userEmail, habitName, date, 0, false, 0]
          );
        }
      }
    }
    console.log(`Filled missed progress for user ${userEmail}`);
  } catch (error) {
    console.error('Error filling missed progress:', error);
    throw error;
  }
};

// Export all data for a user as JSON
app.get('/export/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    // Get user details (only email and username are stored in users)
    const [userRows] = await pool.query('SELECT email, username FROM users WHERE email = ?', [userEmail]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userRows[0];

    // Get habits for the user
    const [habitRows] = await pool.query('SELECT * FROM habits WHERE user_email = ?', [userEmail]);
    // Get habit progress for the user
    const [progressRows] = await pool.query('SELECT * FROM habit_progress WHERE user_email = ?', [userEmail]);

    // Combine the data
    const exportData = {
      user,
      habits: habitRows,
      progress: progressRows,
    };

    res.json(exportData);
  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Change password
app.post('/users/update-password', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  try {
    // Retrieve user by username
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Verify old password
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Incorrect old password' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await pool.query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/habit-days/:email/:habitName', async (req, res) => {
  const { email, habitName } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT day FROM habit_days 
       WHERE user_email = ? AND habitName = ?`,
      [email, habitName]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching habit days:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/habit-interval/:email/:habitName', async (req, res) => {
  const { email, habitName } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT increment FROM habit_intervals 
       WHERE user_email = ? AND habitName = ?`,
      [email, habitName]
    );
    res.json(rows[0] || { increment: null });
  } catch (error) {
    console.error('Error fetching habit interval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an existing habit
app.put('/habits', async (req, res) => {
  const {
    email,
    habitName,
    habitDescription,
    habitType,
    habitColor,
    scheduleOption,
    intervalDays,
    selectedDays,
    goalValue,
    goalUnit
  } = req.body;

  try {
    // 1) Update the main habits table
    await pool.query(
      `UPDATE habits SET 
        habitDescription = ?, 
        habitType = ?, 
        habitColor = ?,
        scheduleOption = ?, 
        goalValue = ?, 
        goalUnit = ?
       WHERE user_email = ? AND habitName = ?`,
      [
        habitDescription || '',
        habitType,
        habitColor,
        scheduleOption,
        goalValue || null,
        goalUnit || null,
        email,
        habitName
      ]
    );

    // 2) Delete existing schedule data
    await pool.query('DELETE FROM habit_days WHERE user_email = ? AND habitName = ?', [email, habitName]);
    await pool.query('DELETE FROM habit_intervals WHERE user_email = ? AND habitName = ?', [email, habitName]);

    // 3) If the schedule is "weekly," insert each selected day into habit_days
    if (scheduleOption === 'weekly' && Array.isArray(selectedDays)) {
      for (const day of selectedDays) {
        await pool.query(
          `INSERT INTO habit_days (user_email, habitName, day)
           VALUES (?, ?, ?)`,
          [email, habitName, day]
        );
      }

      // Handle the special case for today
      // Check if today was removed from the schedule
      const today = new Date();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = dayNames[today.getDay()];

      // If today's day is not in the selected days, remove it from habit_progress for today
      if (!selectedDays.includes(todayName)) {
        const todayStr = today.toISOString().split('T')[0];
        await pool.query(
          `DELETE FROM habit_progress 
           WHERE user_email = ? AND habitName = ? AND progressDate = ?`,
          [email, habitName, todayStr]
        );
      }
    }

    // 4) If the schedule is "interval," insert a row into habit_intervals
    if (scheduleOption === 'interval' && intervalDays) {
      await pool.query(
        `INSERT INTO habit_intervals (user_email, habitName, increment)
         VALUES (?, ?, ?)`,
        [email, habitName, parseInt(intervalDays, 10)]
      );

      // For interval habits, we don't automatically remove today's instance
      // as the interval recalculation might still include today
    }

    // 5) Regenerate future instances based on new schedule
    await pool.query('DELETE FROM habit_instances WHERE user_email = ? AND habitName = ?', [email, habitName]);

    if (scheduleOption === 'interval') {
      await generateIntervalInstances(email, habitName, 7);
    } else {
      await generateDayInstances(email, habitName, 7);
    }

    await migrateInstances(email);

    res.status(200).json({ message: 'Habit updated successfully' });
  } catch (error) {
    console.error('Error updating habit:', error);
    res.status(500).json({ error: 'Error updating habit' });
  }
});

export default app;