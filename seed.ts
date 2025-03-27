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

// How many users to create
const NUM_USERS = 2;

// Each user will get random habits in this range
const MIN_HABITS_PER_USER = 3;
const MAX_HABITS_PER_USER = 6;

// We'll seed from 30 days ago up through today (31 total days)
const DAYS_BACK = 30;

// We'll also add future days for the next 7 days with no progress
const DAYS_FORWARD = 7;

// Probability that a "build" habit is completed on any scheduled day
const BUILD_SUCCESS_CHANCE = 0.7;
// Probability that a "quit" habit is completed ("didn't do it") on any scheduled day
const QUIT_SUCCESS_CHANCE = 0.8;

// Some sample habit names, descriptions, and colors to randomize
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

// Days of the week for weekly scheduling
const ALL_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Utility: return a new date with Y/M/D only (no time).
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

// For interval schedules, generate every Nth day from a chosen 'start date'
// continuing until we surpass 'rangeEnd'
function getIntervalDatesInRange(
  rangeStart: Date,
  rangeEnd: Date,
  increment: number,
  habitStartDate: Date
): Date[] {
  const results: Date[] = [];
  let current = new Date(habitStartDate);

  // Move backward if start is after rangeStart
  // so we land on the earliest scheduled date within the range
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

// Decide if the user "completed" the habit, then return { progress, completed, newStreak }.
// For build habits with numeric goals, success => progress >= goal, fail => progress < goal
// For build with no goal, success => any progress>0, fail => progress=0
// For quit habits, success => progress=0 (didn't do it), fail => progress=1
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
      // fail => progress < goal (or 0 if no numeric goal)
      let progress = 0;
      if (habit.goalValue !== null) {
        // pick an integer from 0..(goalValue-1) if goalValue>0
        const upperBound = Math.max(0, habit.goalValue - 1);
        progress = upperBound > 0 ? randInt(0, upperBound) : 0;
      }
      return {
        progress,
        completed: false,
        newStreak: 0
      };
    } else {
      // success => progress >= goal, or >0 if no numeric goal
      let progress = 1;
      if (habit.goalValue !== null) {
        // pick an integer from goalValue..(goalValue+3)
        progress = randInt(habit.goalValue, habit.goalValue + 3);
      } else {
        // no numeric goal => any positive number means success
        progress = randInt(1, 3);
      }
      return {
        progress,
        completed: true,
        newStreak: prevStreak + 1
      };
    }
  } else {
    // 'quit' => 0 => success => completed = true => streak=prev+1
    //           1 => fail => completed = false => streak=0
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

export async function seed() {
  const pool = mysql.createPool(DB_CONFIG);
  try {
    const connection = await pool.getConnection();
    console.log('Seeding database with scheduled data + future days, respecting consecutive streaks...');

    //----------------------------------------------------------------------
    // 1) Clear existing data (in correct order due to FKs)
    //----------------------------------------------------------------------
    await connection.query('DELETE FROM habit_progress');
    await connection.query('DELETE FROM habit_instances');
    await connection.query('DELETE FROM habit_days');
    await connection.query('DELETE FROM habit_intervals');
    await connection.query('DELETE FROM habits');
    await connection.query('DELETE FROM users');

    //----------------------------------------------------------------------
    // 2) Create users
    //----------------------------------------------------------------------
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
      console.log(`\nCREATED USER:
        Email: ${u.email}
        Username: ${u.username}
        Plain Password: ${u.password}
      `);
    }

    //----------------------------------------------------------------------
    // 3) Generate random habits for each user, store in DB
    //----------------------------------------------------------------------
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

        // If it's a build habit, 50% chance we set an integer goal
        let goalVal: number | null = null;
        let goalU: string | null = null;
        if (habitType === 'build' && Math.random() > 0.5) {
          goalVal = randInt(5, 50); // integer from 5..50
          goalU = 'units';
        }

        const habitObj: HabitRecord = {
          user_email: user.email,
          habitName: `${name} ${randInt(100, 9999)}`, // ensure uniqueness
          habitType,
          scheduleOption,
          goalValue: goalVal,
          goalUnit: goalU,
          habitColor: color
        };
        allHabits.push(habitObj);

        // Insert into DB
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

    //----------------------------------------------------------------------
    // 4) Insert into habit_days (for weekly) or habit_intervals (for interval)
    //    Figure out which days are scheduled for the past 30 days + today
    //----------------------------------------------------------------------
    const earliestDate = stripTime(new Date());
    earliestDate.setDate(earliestDate.getDate() - DAYS_BACK);

    const today = stripTime(new Date());
    const tomorrow = stripTime(new Date());
    tomorrow.setDate(tomorrow.getDate() + 1);

    const futureEnd = stripTime(new Date());
    futureEnd.setDate(futureEnd.getDate() + DAYS_FORWARD);

    // We'll store scheduled day arrays in a map
    const scheduledDatesMap = new Map<string, Date[]>();

    for (const h of allHabits) {
      const habitKey = `${h.user_email}_${h.habitName}`;

      if (h.scheduleOption === 'weekly') {
        // Randomly pick 1..4 days of the week
        const shuffled = [...ALL_WEEKDAYS].sort(() => 0.5 - Math.random());
        const selectedDays = shuffled.slice(0, randInt(1, 4));
        // Insert them
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

        // We'll insert habit_instances for the future (no progress).
        for (const d of futureDates) {
          await connection.query(
            `INSERT INTO habit_instances (user_email, habitName, dueDate)
             VALUES (?, ?, ?)`,
            [h.user_email, h.habitName, formatDate(d)]
          );
        }
      } else {
        // interval
        const inc = randInt(2, 7);
        await connection.query(
          `INSERT INTO habit_intervals (user_email, habitName, increment)
           VALUES (?, ?, ?)`,
          [h.user_email, h.habitName, inc]
        );

        // pick a random start date for the historical range
        const randomStart = new Date(earliestDate);
        randomStart.setDate(randomStart.getDate() + randInt(0, DAYS_BACK));

        const historicalDates = getIntervalDatesInRange(earliestDate, today, inc, randomStart);
        scheduledDatesMap.set(habitKey, historicalDates);

        // For the future 7 days, let's pick the last historical day or randomStart
        // as the base, then keep incrementing
        let baseDate = randomStart;
        if (historicalDates.length > 0) {
          baseDate = historicalDates[historicalDates.length - 1];
        }
        // Generate interval for [tomorrow..futureEnd]
        // We'll do a small function that continues from baseDate forward
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

    //----------------------------------------------------------------------
    // 5) For each habit, fill in habit_instances + progress for historical days
    //    with correct streak logic. Future days are already inserted above, no progress.
    //----------------------------------------------------------------------
    for (const h of allHabits) {
      const habitKey = `${h.user_email}_${h.habitName}`;
      const scheduledDates = scheduledDatesMap.get(habitKey) || [];
      // Sort ascending
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
