import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

//
//  1) Load environment variables
//     (Adjust the path if your .env is elsewhere)
dotenv.config({ path: './server/.env' });

//
//  2) Database configuration
//
const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0
};

const SALT_ROUNDS = 10;

//
//  3) Utility for formatting dates (YYYY-MM-DD)
//
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

async function seed() {
  const pool = mysql.createPool(DB_CONFIG);
  try {
    const connection = await pool.getConnection();
    console.log('Seeding database...');

    //----------------------------------------------------------------------
    // 4) [Optional] Clear existing data — be mindful of foreign key order
    //----------------------------------------------------------------------
    await connection.query('DELETE FROM habit_progress');
    await connection.query('DELETE FROM habit_instances');
    await connection.query('DELETE FROM habit_days');
    await connection.query('DELETE FROM habit_intervals');
    await connection.query('DELETE FROM habits');
    await connection.query('DELETE FROM users');

    //----------------------------------------------------------------------
    // 5) Insert a sample user
    //----------------------------------------------------------------------
    const sampleUser = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    };

    const hashedPassword = await bcrypt.hash(sampleUser.password, SALT_ROUNDS);

    await connection.query(
      `INSERT INTO users (email, password, username)
       VALUES (?, ?, ?)`,
      [sampleUser.email, hashedPassword, sampleUser.username]
    );

    //----------------------------------------------------------------------
    // 6) Insert sample habits
    //    - One build (weekly) habit with a goalValue
    //    - One quit (interval) habit with null goalValue
    //----------------------------------------------------------------------
    const sampleHabits = [
      {
        user_email: sampleUser.email,
        habitName: 'Exercise',
        habitDescription: 'Daily exercise routine',
        habitType: 'build', // 'build' habit requires a non-null goalValue
        habitColor: '#FF5733',
        scheduleOption: 'weekly',
        goalValue: 30,
        goalUnit: 'minutes'
      },
      {
        user_email: sampleUser.email,
        habitName: 'Quit Smoking',
        habitDescription: 'Kick the habit!',
        habitType: 'quit', // 'quit' habit uses a null goalValue
        habitColor: '#33FF57',
        scheduleOption: 'interval',
        goalValue: null,
        goalUnit: null
      }
    ];

    for (const habit of sampleHabits) {
      await connection.query(
        `INSERT INTO habits
         (user_email, habitName, habitDescription, habitType, habitColor,
          scheduleOption, goalValue, goalUnit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          habit.user_email,
          habit.habitName,
          habit.habitDescription,
          habit.habitType,
          habit.habitColor,
          habit.scheduleOption,
          habit.goalValue,
          habit.goalUnit
        ]
      );
    }

    //----------------------------------------------------------------------
    // 7) Insert into habit_days for the "Exercise" (weekly) habit
    //----------------------------------------------------------------------
    // Example: M / W / F
    await connection.query(
      `INSERT INTO habit_days (user_email, habitName, day)
       VALUES (?, ?, 'Monday'), (?, ?, 'Wednesday'), (?, ?, 'Friday')`,
      [
        sampleUser.email, 'Exercise',
        sampleUser.email, 'Exercise',
        sampleUser.email, 'Exercise'
      ]
    );

    //----------------------------------------------------------------------
    // 8) Insert into habit_intervals for the "Quit Smoking" (interval) habit
    //----------------------------------------------------------------------
    // Example: increment every 3 days
    await connection.query(
      `INSERT INTO habit_intervals (user_email, habitName, increment)
       VALUES (?, ?, 3)`,
      [sampleUser.email, 'Quit Smoking']
    );

    //----------------------------------------------------------------------
    // 9) Insert future/pending instances into habit_instances
    //    Just as an example, we’ll add three upcoming instances for each habit
    //----------------------------------------------------------------------
    const today = new Date();
    const tomorrow = new Date(today);
    const dayAfter = new Date(today);

    tomorrow.setDate(tomorrow.getDate() + 1);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const datesToInsert = [today, tomorrow, dayAfter].map(formatDate);

    // We'll add the same set of dates for both habits, though typically
    // real intervals/schedules might differ
    for (const dateStr of datesToInsert) {
      // For "Exercise"
      await connection.query(
        `INSERT INTO habit_instances (user_email, habitName, dueDate)
         VALUES (?, ?, ?)`,
        [sampleUser.email, 'Exercise', dateStr]
      );

      // For "Quit Smoking"
      await connection.query(
        `INSERT INTO habit_instances (user_email, habitName, dueDate)
         VALUES (?, ?, ?)`,
        [sampleUser.email, 'Quit Smoking', dateStr]
      );
    }

    //----------------------------------------------------------------------
    // 10) Insert sample progress data into habit_progress
    //     We’ll insert minimal progress for "today" for both habits
    //----------------------------------------------------------------------
    const todayStr = formatDate(today);

    // For "Exercise"
    await connection.query(
      `INSERT INTO habit_progress
       (user_email, habitName, progressDate, progress, completed, streak)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sampleUser.email, 'Exercise', todayStr, 10, false, 0]
    );

    // For "Quit Smoking"
    await connection.query(
      `INSERT INTO habit_progress
       (user_email, habitName, progressDate, progress, completed, streak)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sampleUser.email, 'Quit Smoking', todayStr, 0, true, 1] 
      // e.g., user "didn't smoke" today => completed = true, streak = 1
    );

    //----------------------------------------------------------------------
    // 11) Finish
    //----------------------------------------------------------------------
    console.log('Database seeding completed successfully!');
    connection.release();
    await pool.end();
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seed();

// Just to verify that dotenv is loading:
console.log('DB_USER:', process.env.DB_USER);
