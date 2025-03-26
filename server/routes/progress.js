import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Log progress of a specific habit
router.post('/', async (req, res) => {
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

// Get habit progress data for all habits of a specific user on a specific date
router.get('/:email/:date', async (req, res) => {
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

// Get habit progress for a specific habit on a specific date
router.get('/:email/:habitName/:date', async (req, res) => {
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

// Get habit streak for a specific habit on a specific date
router.get('/streak/:email/:habitName/:date', async (req, res) => {
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

// Get longest streak for a specific habit
router.get('/stats/longest-streak/:email/:habitName', async (req, res) => {
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

// Get completion rate for a specific habit
router.get('/stats/completion-rate/:email/:habitName', async (req, res) => {
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
        const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;
        res.json({ completionRate: Math.round(completionRate) });
    } catch (error) {
        console.error('Error fetching completion rate: ', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get average progress for a specific habit
router.get('/stats/average-progress/:email/:habitName', async (req, res) => {
    const { email, habitName } = req.params;
    try {
        const [rows] = await pool.query(`
        SELECT AVG(progress) as averageProgress
        FROM habit_progress
        WHERE user_email = ? AND habitName = ?`,
            [email, habitName]);
        const averageProgress = rows[0].averageProgress || 0;
        res.json({ averageProgress: Math.round(averageProgress) });

    } catch (error) {
        console.error('Error fetching average progress: ', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get streak for quit habits
router.get('/stats/streak/:email/:habitName/:date', async (req, res) => {
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

// Get progress for build habits
router.get('/stats/progress/:email/:habitName', async (req, res) => {
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

export default router;
