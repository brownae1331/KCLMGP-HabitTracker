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
const NUM_USERS = 10;
const MIN_HABITS_PER_USER = 3;
const MAX_HABITS_PER_USER = 6;
const DAYS_BACK = 30;
const DAYS_FORWARD = 7;
const BUILD_SUCCESS_CHANCE = 0.7;
const QUIT_SUCCESS_CHANCE = 0.8;

const SAMPLE_HABIT_NAMES = [
  'Exercise', 'Read More', 'Quit Smoking', 'Meditate', 'Learn Guitar',
  'Drink Water', 'Stop Snacking', 'Study Spanish', 'Run 5K', 'Write Journal'
];

const SAMPLE_DESCRIPTIONS = [
  'Improve my daily routine',
  'Focus on better health',
  'Build consistency',
  'Cut out bad habits',
  'Develop a new skill'
];

const SAMPLE_COLORS = ['#FF5733', '#33FF57', '#0055ff', '#FF9900', '#123456', '#007AFF', '#FFFF00'];

const ALL_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Return a new date with Y/M/D only (no time).
function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Return an integer in [min, max]
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Return a random item from an array
function randFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Return a random email
function randomEmail(): string {
  const prefix = Math.random().toString(36).substring(2, 6);
  const domain = Math.random().toString(36).substring(2, 5);
  return `${prefix}@${domain}.com`;
}

// Return a random username
function randomUsername(): string {
  return 'user_' + Math.random().toString(36).substring(2, 7);
}

// Return an array of Date objects in ascending order from start to end inclusive
function getDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// For weekly schedules, generate the exact days that match 'selectedDays'
function getWeeklyDatesInRange(
  rangeStart: Date,
  rangeEnd: Date,
  selectedDays: string[]
): Date[] {
  const allDates = getDateRange(rangeStart, rangeEnd);
  return allDates.filter(d => selectedDays.includes(ALL_WEEKDAYS[d.getDay()]));
}

// For interval schedules, generate every Nth day from a chosen 'start date' until we surpass 'rangeEnd'
function getIntervalDatesInRange(
  rangeStart: Date,
  rangeEnd: Date,
  increment: number,
  habitStartDate: Date
): Date[] {
  const results: Date[] = [];
  let current = new Date(habitStartDate);

  // Move backward if start is after rangeStart so we land on the earliest scheduled date within the range
  while (current > rangeStart) {
    current.setDate(current.getDate() - increment);
  }

  // Now move forward from 'current' until we pass rangeEnd
  while (current < rangeStart) {
    current.setDate(current.getDate() + increment);
  }

  while (current <= rangeEnd) {
    results.push(new Date(current));
    current.setDate(current.getDate() + increment);
  }
  return results;
}

// Simulates a user's outcome for a single day of a habit
function getDailyOutcome(habit: {
  habitType: 'build' | 'quit';
  goalValue: number | null;
}, prevStreak: number): {
  progress: number;
  completed: boolean;
  newStreak: number;
} {
  if (habit.habitType === 'build') {
    const success = Math.random() < BUILD_SUCCESS_CHANCE;
    if (!success) {
      let progress = 0;
      if (habit.goalValue !== null) {
        const upperBound = Math.max(0, habit.goalValue - 1);
        progress = upperBound > 0 ? randInt(0, upperBound) : 0;
      }
      return {
        progress,
        completed: false,
        newStreak: 0
      };
    } else {
      let progress = 1;
      if (habit.goalValue !== null) {
        progress = randInt(habit.goalValue, habit.goalValue + 3);
      } else {
        progress = randInt(1, 3);
      }
      return {
        progress,
        completed: true,
        newStreak: prevStreak + 1
      };
    }
  } else {
    const success = Math.random() < QUIT_SUCCESS_CHANCE;
    if (success) {
      return {
        progress: 0,
        completed: true,
        newStreak: prevStreak + 1
      };
    } else {
      return {
        progress: 1,
        completed: false,
        newStreak: 0
      };
    }
  }
}

// Populates the database with sample users, habits, scheduled instances, and progress
export async function seed() {
  const pool = mysql.createPool(DB_CONFIG);
  try {
    const connection = await pool.getConnection();
    console.log('Seeding database with scheduled data + future days, respecting consecutive streaks...');

    // 1: Clear existing data
    await connection.query('DELETE FROM habit_progress');
    await connection.query('DELETE FROM habit_instances');
    await connection.query('DELETE FROM habit_days');
    await connection.query('DELETE FROM habit_intervals');
    await connection.query('DELETE FROM habits');
    await connection.query('DELETE FROM users');

    // 2: Create random users
    const userList: { email: string; username: string; password: string }[] = [];
    for (let i = 0; i < NUM_USERS; i++) {
      const email = randomEmail();
      const username = randomUsername();
      const password = 'password' + randInt(100, 999);

      userList.push({ email, username, password });
    }

    // Insert and print credentials
    for (const u of userList) {
      const hashed = await bcrypt.hash(u.password, SALT_ROUNDS);
      await connection.query(
        'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
        [u.email, hashed, u.username]
      );
      console.log(`\nCREATED USER: ${u.email}`);
    }

    // Create habits for each user
    type HabitRecord = {
      user_email: string;
      habitName: string;
      habitType: 'build' | 'quit';
      scheduleOption: 'weekly' | 'interval';
      goalValue: number | null;
      goalUnit: string | null;
      habitColor: string;
    };

    const allHabits: HabitRecord[] = [];

    for (const user of userList) {
      const habitCount = randInt(MIN_HABITS_PER_USER, MAX_HABITS_PER_USER);
      for (let i = 0; i < habitCount; i++) {
        const name = randFromArray(SAMPLE_HABIT_NAMES);
        const desc = randFromArray(SAMPLE_DESCRIPTIONS);
        const color = randFromArray(SAMPLE_COLORS);

        const habitType: 'build' | 'quit' = Math.random() > 0.5 ? 'build' : 'quit';
        const scheduleOption: 'weekly' | 'interval' = Math.random() > 0.5 ? 'weekly' : 'interval';

        let goalVal: number | null = null;
        let goalU: string | null = null;
        if (habitType === 'build' && Math.random() > 0.5) {
          goalVal = randInt(5, 50);
          goalU = 'units';
        }

        const habitObj: HabitRecord = {
          user_email: user.email,
          habitName: `${name} ${randInt(100, 9999)}`,
          habitType,
          scheduleOption,
          goalValue: goalVal,
          goalUnit: goalU,
          habitColor: color
        };
        allHabits.push(habitObj);

        // Insert into database
        await connection.query(
          `INSERT INTO habits
           (user_email, habitName, habitDescription, habitType, habitColor,
            scheduleOption, goalValue, goalUnit)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            habitObj.user_email,
            habitObj.habitName,
            desc,
            habitObj.habitType,
            habitObj.habitColor,
            habitObj.scheduleOption,
            habitObj.goalValue,
            habitObj.goalUnit
          ]
        );
      }
    }

    // Add schedule data and future instances
    const earliestDate = stripTime(new Date());
    earliestDate.setDate(earliestDate.getDate() - DAYS_BACK);

    const today = stripTime(new Date());
    const tomorrow = stripTime(new Date());
    tomorrow.setDate(tomorrow.getDate() + 1);

    const futureEnd = stripTime(new Date());
    futureEnd.setDate(futureEnd.getDate() + DAYS_FORWARD);

    const scheduledDatesMap = new Map<string, Date[]>();

    for (const h of allHabits) {
      const habitKey = `${h.user_email}_${h.habitName}`;

      if (h.scheduleOption === 'weekly') {
        const shuffled = [...ALL_WEEKDAYS].sort(() => 0.5 - Math.random());
        const selectedDays = shuffled.slice(0, randInt(1, 4));
  
        for (const d of selectedDays) {
          await connection.query(
            `INSERT INTO habit_days (user_email, habitName, day)
             VALUES (?, ?, ?)`,
            [h.user_email, h.habitName, d]
          );
        }

        // Generate all matching days in [earliestDate..today]
        const historicalDates = getWeeklyDatesInRange(earliestDate, today, selectedDays);
        scheduledDatesMap.set(habitKey, historicalDates);

        // Also generate the next 7 days for the future
        const futureDates = getWeeklyDatesInRange(tomorrow, futureEnd, selectedDays);

        // Insert habit_instances for the future (no progress)
        for (const d of futureDates) {
          await connection.query(
            `INSERT IGNORE INTO habit_instances (user_email, habitName, dueDate)
             VALUES (?, ?, ?)`,
            [h.user_email, h.habitName, formatDate(d)]
          );
        }
      } else {
        const inc = randInt(2, 7);
        await connection.query(
          `INSERT INTO habit_intervals (user_email, habitName, increment)
           VALUES (?, ?, ?)`,
          [h.user_email, h.habitName, inc]
        );

        // Pick a random start date for the historical range
        const randomStart = new Date(earliestDate);
        randomStart.setDate(randomStart.getDate() + randInt(0, DAYS_BACK));

        const historicalDates = getIntervalDatesInRange(earliestDate, today, inc, randomStart);
        scheduledDatesMap.set(habitKey, historicalDates);

        let baseDate = randomStart;
        if (historicalDates.length > 0) {
          baseDate = historicalDates[historicalDates.length - 1];
        }
        // Generate interval for [tomorrow..futureEnd]
        const futureDates: Date[] = [];
        let nextDate = new Date(baseDate);
        while (nextDate <= futureEnd) {
          nextDate = new Date(nextDate);
          nextDate.setDate(nextDate.getDate() + inc);
          if (nextDate > today && nextDate <= futureEnd) {
            futureDates.push(new Date(nextDate));
          }
        }
        // Insert future instances
        for (const d of futureDates) {
          await connection.query(
            `INSERT INTO habit_instances (user_email, habitName, dueDate)
             VALUES (?, ?, ?)`,
            [h.user_email, h.habitName, formatDate(d)]
          );
        }
      }
    }

    // Fill in historical progress with streaks
    for (const h of allHabits) {
      const habitKey = `${h.user_email}_${h.habitName}`;
      const scheduledDates = scheduledDatesMap.get(habitKey) || [];
      scheduledDates.sort((a, b) => a.getTime() - b.getTime());

      let currentStreak = 0;
      for (const d of scheduledDates) {
        const dateStr = formatDate(d);

        // Insert instance for the day (in case not inserted yet)
        await connection.query(
          `INSERT INTO habit_instances (user_email, habitName, dueDate)
           VALUES (?, ?, ?)`,
          [h.user_email, h.habitName, dateStr]
        );

        // Decide success/fail + progress
        const outcome = getDailyOutcome(h, currentStreak);
        currentStreak = outcome.newStreak;

        // Insert or update progress
        await connection.query(
          `INSERT INTO habit_progress
           (user_email, habitName, progressDate, progress, completed, streak)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             progress = VALUES(progress),
             completed = VALUES(completed),
             streak = VALUES(streak)`,
          [
            h.user_email,
            h.habitName,
            dateStr,
            outcome.progress,
            outcome.completed,
            outcome.newStreak
          ]
        );
      }
    }

    console.log('\nSeeding complete!\n');
    connection.release();
    await pool.end();
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seed();
