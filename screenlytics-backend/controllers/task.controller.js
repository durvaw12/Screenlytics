// controllers/task.controller.js

const { pool } = require('../config/db');

// ── GET /api/tasks ───────────────────────────────────────
async function getTasks(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, time_slot AS timeSlot, is_done AS isDone, created_at
       FROM tasks WHERE user_id = ? ORDER BY created_at ASC`,
      [req.userId]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/tasks ──────────────────────────────────────
async function createTask(req, res, next) {
  try {
    const { title, timeSlot = null } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO tasks (user_id, title, time_slot) VALUES (?, ?, ?)',
      [req.userId, title.trim(), timeSlot]
    );

    return res.status(201).json({
      success: true,
      data: { id: result.insertId, title: title.trim(), timeSlot, isDone: false },
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/tasks/:id/toggle ──────────────────────────
async function toggleTask(req, res, next) {
  try {
    const { id } = req.params;

    // Fetch current state first (ensure ownership)
    const [rows] = await pool.query(
      'SELECT id, is_done FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const newDone = rows[0].is_done ? 0 : 1;
    await pool.query('UPDATE tasks SET is_done = ? WHERE id = ?', [newDone, id]);

    return res.json({ success: true, data: { id: parseInt(id), isDone: !!newDone } });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/tasks/:id ────────────────────────────────
async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    return res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTasks, createTask, toggleTask, deleteTask };
