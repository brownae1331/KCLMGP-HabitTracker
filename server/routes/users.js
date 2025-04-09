// Express router for handling user-related actions: signup, login, deletion, password update, and export

import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';
import { syncHabits } from '../server.js';

const router = express.Router();

// Register a new user with email, username, and hashed password
router.post('/signup', async (req, res) => {
    const { email, password, username } = req.body;

    // Validate required fields
    if (!email || !password || !username) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Validate username length and format
    if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }

    try {
        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
            [email, hashedPassword, username]
        );
        res.status(201).json({ id: result.insertId, email, username });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.sqlMessage.includes('email')) {
                return res.status(409).json({ error: 'Email already exists' });
            }
            return res.status(409).json({ error: 'Duplicate entry' });
        }
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error while creating user' });
    }
});

// Log in an existing user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        // Compare the provided password with the stored hash
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Ensure syncHabits function is defined or imported
        if (typeof syncHabits === 'function') {
            await syncHabits(email);
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error retrieving user' });
    }
});

// Delete all data for a specific user by email
router.delete('/:email', async (req, res) => {
    const { email } = req.params;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.query(
            'DELETE FROM users WHERE email = ?',
            [email]
        );
        if (result.affectedRows > 0) {
            await connection.commit();
            res.json({
                success: true,
                message: `All data for user with email ${email} deleted successfully.`
            });
        } else {
            await connection.rollback();
            res.status(404).json({ error: `User with email ${email} not found.` });
        }
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting user data:', error);
        res.status(500).json({ error: 'Server error deleting user data' });
    } finally {
        connection.release();
    }
});

// Update a user's password after verifying the old password
router.post('/update-password', async (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = users[0];
        const passwordMatch = await bcrypt.compare(oldPassword, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ error: 'Incorrect old password' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username]);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export all data for a user as JSON (user info, habits, and progress)
router.get('/export/:email', async (req, res) => {
    try {
        const userEmail = req.params.email;
        // Get user details (only email and username are stored in users)
        const [userRows] = await pool.query('SELECT email, username FROM users WHERE email = ?', [userEmail]);
        if (userRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userRows[0];

        // Get habits for the user
        const [habitRows] = await pool.query('SELECT * FROM habits WHERE user_email = ?', [userEmail]);
        // Get habit progress for the user
        const [progressRows] = await pool.query('SELECT * FROM habit_progress WHERE user_email = ?', [userEmail]);

        // Combine the data
        const exportData = {
            user,
            habits: habitRows,
            progress: progressRows,
        };

        res.json(exportData);
    } catch (error) {
        console.error('Error exporting user data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
