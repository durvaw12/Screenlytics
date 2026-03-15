const express = require('express');
const router  = express.Router();
const {
  getTasks,
  addTask,
  toggleTask,
  deleteTask
} = require('../controllers/plannerController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes protected

// GET  /api/planner          → get all tasks
router.get('/',                authMiddleware, getTasks);

// POST /api/planner          → add new task
router.post('/',               authMiddleware, addTask);

// PATCH /api/planner/:id/toggle → toggle done status
router.patch('/:id/toggle',    authMiddleware, toggleTask);

// DELETE /api/planner/:id    → delete a task
router.delete('/:id',          authMiddleware, deleteTask);

module.exports = router;