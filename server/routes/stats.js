import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// get longest streak for a habit
router.get('/longest-streak/:email/:habitName', async (req, res) => {
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

// get completion rate for a habit
router.get('/completion-rate/:email/:habitName', async (req, res) => {
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

// get average progress for a habit
router.get('/average-progress/:email/:habitName', async (req, res) => {
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

// get streak for a habit
router.get('/streak/:email/:habitName', async (req, res) => {
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

// get progress for a habit
router.get('/:email/:habitName', async (req, res) => {
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
        console.log('Executing query:', query, 'with params:', params);
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

export default router;