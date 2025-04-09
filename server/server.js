import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { initDatabase, pool } from './db.js';
import usersRouter from './routes/users.js';
import habitsRouter from './routes/habits.js';
import progressRouter from './routes/progress.js';
import statsRouter from './routes/stats.js';

dotenv.config();
const app = express();
const PORT = 3000;

// Initialize Database
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/users', usersRouter);
app.use('/habits', habitsRouter);
app.use('/progress', progressRouter);
app.use('/stats', statsRouter);

// Default Route
app.get('/', (req, res) => {
  res.send('Habit Tracker API is running');
});

// Returns habits for a user on a given date (used to fetch past or future habits)
export async function getHabitsForDate(email, date, type) {
  let query;
  const formattedDate = date.toISOString().split('T')[0];
  const queryParams = [email, formattedDate];
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

// Syncs all habits for a user by filling missed progress and generating new instances
export const syncHabits = async (userEmail) => {
  try {
    const [habits] = await pool.query(
      `SELECT habitName, scheduleOption FROM habits WHERE user_email = ?`,
      [userEmail]
    );

    // Catch up on all past and current due habits
    await migrateInstances(userEmail, '<=');
    await fillMissedProgress(userEmail);

    // Generate new instances for all habits
    for (const habit of habits) {
      if (habit.scheduleOption === 'interval') {
        await generateIntervalInstances(userEmail, habit.habitName);
      } else if (habit.scheduleOption === 'weekly') {
        await generateDayInstances(userEmail, habit.habitName);
      }
    }
  } catch (error) {
    console.error('Error synchronizing habits:', error);
    throw error;
  }
};

// Returns the most recent date of progress or instance for a given habit
export const getLastDate = async (table, userEmail, habitName, dateColumn, defaultDate) => {
  const [rows] = await pool.query(
    `SELECT MAX(${dateColumn}) as lastDate
     FROM ${table}
     WHERE user_email = ? AND habitName = ?`,
    [userEmail, habitName]
  );
  return rows[0].lastDate ? new Date(rows[0].lastDate) : new Date(defaultDate);
};

// Generates a list of future dates for interval-based habits
export const generateIntervalDates = (startDate, endDate, increment) => {
  const dates = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + increment);
  }
  return dates;
};

// Generates a list of future dates for weekly habits
export const generateWeeklyDates = (startDate, endDate, selectedDays) => {
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

// Fills upcoming habit instances for interval habits (for the next 7 days)
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
  } catch (error) {
    console.error('Error generating missing interval instances:', error);
  }
};

// Fills upcoming habit instances for weekly habits (for the next 7 days)
export const generateDayInstances = async (userEmail, habitName, daysAhead = 7) => {
  try {
    const [dayRows] = await pool.query(
      `SELECT day FROM habit_days WHERE user_email = ? AND habitName = ?`,
      [userEmail, habitName]
    );
    if (!dayRows.length) {
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
  }
  catch (error) {
    console.error('Error generating missing day instances:', error);
  }
};

// Moves due habit instances to the progress table (based on date condition)
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
    }
  } catch (error) {
    console.error('Error migrating today instances:', error);
  }
};

// Fills in missed progress entries for past days based on the schedule
export const fillMissedProgress = async (userEmail) => {
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
        // Gap between today and the most recent date of recorded progress
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
  } catch (error) {
    console.error('Error filling missed progress:', error);
    throw error;
  }
};

// Starts the Express server (if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
  });
}

export default app;