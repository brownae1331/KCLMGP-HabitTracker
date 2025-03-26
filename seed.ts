import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config({ path: './server/.env' });

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

// Configuration: Adjust these as you see fit
const NUM_USERS = 3;               // How many random users
const MIN_HABITS_PER_USER = 3;     // Each user will get a random number of habits in [MIN, MAX]
const MAX_HABITS_PER_USER = 6;
const DAYS_BACK = 30;              // Seed data for the past 30 days
const INSTANCE_CHANCE = 0.7;       // 70% chance of generating a habit_instance for a given day

// Some placeholder data to build random habit details
const SAMPLE_HABIT_NAMES = [
  'Exercise', 'Read More', 'Quit Smoking', 'Meditate', 'Learn Guitar',
  'Drink More Water', 'Stop Snacking', 'Study Spanish', 'Run 5K', 'Write Journal'
];
const SAMPLE_DESCRIPTIONS = [
  'Improve my daily routine',
  'Focus on better health',
  'Build consistency',
  'Cut out bad habits',
  'Develop a new skill'
];
const SAMPLE_COLORS = ['#FF5733', '#33FF57', '#0055ff', '#FF9900', '#123456', '#007AFF', '#FFFF00'];

// Simple utility to format a Date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Generate a random integer in [min, max]
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Pick a random element from an array
function randFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Create a random email
function randomEmail(): string {
  const prefix = Math.random().toString(36).substring(2, 6);
  const domain = Math.random().toString(36).substring(2, 5);
  return `${prefix}@${domain}.com`;
}

// Create a random username
function randomUsername(): string {
  return 'user_' + Math.random().toString(36).substring(2, 7);
}

async function seed() {
  const pool = mysql.createPool(DB_CONFIG);
  try {
    const connection = await pool.getConnection();
    console.log('Seeding database with randomized data...');

    // 1) Clear existing data in correct order
    await connection.query('DELETE FROM habit_progress');
    await connection.query('DELETE FROM habit_instances');
    await connection.query('DELETE FROM habit_days');
    await connection.query('DELETE FROM habit_intervals');
    await connection.query('DELETE FROM habits');
    await connection.query('DELETE FROM users');

    // 2) Create random users
    const userList: { email: string; username: string; password: string }[] = [];
    for (let i = 0; i < NUM_USERS; i++) {
      userList.push({
        email: randomEmail(),
        username: randomUsername(),
        password: 'password' + randInt(100, 999)
      });
    }

    // Insert those users into DB
    for (const u of userList) {
      const hashed = await bcrypt.hash(u.password, SALT_ROUNDS);
      await connection.query(
        'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
        [u.email, hashed, u.username]
      );
      // Print the un-hashed credentials so you can use them to log in
      console.log(`
        Created user:
          Email: ${u.email}
          Username: ${u.username}
          Password (plain): ${u.password}
      `);
    }

    // 3) For each user, create random habits
    const allHabits: Array<{
      user_email: string;
      habitName: string;
      habitType: 'build' | 'quit';
      scheduleOption: 'weekly' | 'interval';
      goalValue: number | null;
      goalUnit: string | null;
      habitColor: string;
    }> = [];

    for (const user of userList) {
      const numHabits = randInt(MIN_HABITS_PER_USER, MAX_HABITS_PER_USER);
      for (let i = 0; i < numHabits; i++) {
        const name = randFromArray(SAMPLE_HABIT_NAMES);
        const desc = randFromArray(SAMPLE_DESCRIPTIONS);
        const color = randFromArray(SAMPLE_COLORS);

        // Randomly pick 'build' or 'quit'
        const type: 'build' | 'quit' = Math.random() > 0.5 ? 'build' : 'quit';

        // Randomly pick weekly or interval
        const sched: 'weekly' | 'interval' = Math.random() > 0.5 ? 'weekly' : 'interval';

        // If it's a build habit, there's a 50% chance we'll have a numeric goal
        let goalVal: number | null = null;
        let goalU: string | null = null;
        if (type === 'build' && Math.random() > 0.5) {
          goalVal = randInt(5, 50); // e.g. 5 to 50
          goalU = 'units';         // you can adapt
        }

        allHabits.push({
          user_email: user.email,
          habitName: `${name} ${randInt(1000, 9999)}`, // add random digits to avoid duplicates
          habitType: type,
          scheduleOption: sched,
          goalValue: goalVal,
          goalUnit: goalU,
          habitColor: color
        });
      }
    }

    // Insert those habits into DB
    for (const h of allHabits) {
      await connection.query(
        `INSERT INTO habits
         (user_email, habitName, habitDescription, habitType, habitColor,
          scheduleOption, goalValue, goalUnit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          h.user_email,
          h.habitName,
          // Random description
          randFromArray(SAMPLE_DESCRIPTIONS),
          h.habitType,
          h.habitColor,
          h.scheduleOption,
          h.goalValue,
          h.goalUnit
        ]
      );
    }

    // 4) Insert into habit_days or habit_intervals
    //    We won't do real scheduling logic; we'll just pick random days or increments
    for (const h of allHabits) {
      if (h.scheduleOption === 'weekly') {
        // Pick random days of the week
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        // e.g. choose 3 random days
        const shuffled = daysOfWeek.sort(() => 0.5 - Math.random()).slice(0, 3);
        for (const d of shuffled) {
          await connection.query(
            `INSERT INTO habit_days (user_email, habitName, day)
             VALUES (?, ?, ?)`,
            [h.user_email, h.habitName, d]
          );
        }
      } else {
        // random increment 2 to 7
        const inc = randInt(2, 7);
        await connection.query(
          `INSERT INTO habit_intervals (user_email, habitName, increment)
           VALUES (?, ?, ?)`,
          [h.user_email, h.habitName, inc]
        );
      }
    }

    // 5) For the last 30 days, randomly generate habit_instances & progress
    for (const h of allHabits) {
      for (let dayOffset = 0; dayOffset < DAYS_BACK; dayOffset++) {
        const date = new Date();
        date.setDate(date.getDate() - dayOffset);
        const dateStr = formatDate(date);

        // Random chance we actually create an instance for that day
        if (Math.random() < INSTANCE_CHANCE) {
          // Create an instance
          await connection.query(
            `INSERT INTO habit_instances (user_email, habitName, dueDate)
             VALUES (?, ?, ?)`,
            [h.user_email, h.habitName, dateStr]
          );

          // Also create some progress
          // If it's a 'quit' habit, a progress of 0 might be "success"
          // If it's 'build' with a numeric goal, let's randomly pick partial or full
          let progress = 0;
          let completed = false;
          let streak = 0;

          if (h.habitType === 'build') {
            if (h.goalValue) {
              // random progress up to 150% of the goal
              progress = Math.random() * (1.5 * h.goalValue);
              completed = progress >= h.goalValue;
              streak = completed ? randInt(1, 5) : 0;
            } else {
              // build with no numeric goal => just store 0-5
              progress = randInt(0, 5);
              completed = progress > 0; // random definition
              streak = completed ? randInt(1, 5) : 0;
            }
          } else {
            // quit habit => 50% chance user messed up
            const messedUp = Math.random() > 0.5;
            progress = messedUp ? 1 : 0; // 1 might represent "did the bad habit"
            completed = !messedUp;       // if they didn't do it, it's completed
            streak = completed ? randInt(1, 5) : 0;
          }

          await connection.query(
            `INSERT INTO habit_progress
             (user_email, habitName, progressDate, progress, completed, streak)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               progress = VALUES(progress),
               completed = VALUES(completed),
               streak = VALUES(streak)`,
            [h.user_email, h.habitName, dateStr, progress, completed, streak]
          );
        }
      }
    }

    console.log('Seeding completed with randomized data for the past 30 days!');
    connection.release();
    await pool.end();
  } catch (error) {
    console.error('Error seeding database with random data:', error);
  }
}

seed();
