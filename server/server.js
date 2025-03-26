import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { initDatabase, pool } from './db.js';
import usersRouter from './routes/users.js';
import habitsRouter from './routes/habits.js';
import progressRouter from './routes/progress.js';

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

// Default Route
app.get('/', (req, res) => {
  res.send('Habit Tracker API is running 🚀');
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export default app;