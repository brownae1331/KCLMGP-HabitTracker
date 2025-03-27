import express from 'express';
import { pool } from '../db.js';
import { getHabitsForDate, generateIntervalInstances, generateDayInstances, migrateInstances } from '../server.js';

const router = express.Router();

// Add a new habit
router.post('/', async (req, res) => {
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

// Update an existing habit
router.put('/', async (req, res) => {
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

// Get all habits for a particular date
router.get('/:email/:date', async (req, res) => {
    const { email, date } = req.params;
    console.log(email, date);
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

// Get the names and types of all habits for a user
router.get('/:email', async (req, res) => {
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
router.delete('/:email/:habitName', async (req, res) => {
    const { email, habitName } = req.params;
    try {
        await pool.query(
            'DELETE FROM habits WHERE user_email = ? AND habitName = ?',
            [email, habitName]
        );
        res.json({ success: true, message: 'Habit deleted successfully' });
    } catch (error) {
        console.error('Error deleting habit:', error);
        res.status(500).json({ error: 'Error deleting habit' });
    }
});

// Get habit days
router.get('/days/:email/:habitName', async (req, res) => {
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

// Get habit interval
router.get('/interval/:email/:habitName', async (req, res) => {
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


export default router;