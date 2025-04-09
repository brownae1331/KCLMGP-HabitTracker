// Express router for handling habit progress: logging, fetching progress, and streaks

import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// Log progress of a specific habit on the current date
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

export default router;
