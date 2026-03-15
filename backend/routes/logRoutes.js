const express = require('express');
const router  = express.Router();
const { upsertLog, getLogs } = require('../controllers/logController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes protected — user must be logged in

// POST /api/logs/upsert  → save or update a log
router.post('/upsert', authMiddleware, upsertLog);

// GET  /api/logs         → get all logs for history
router.get('/', authMiddleware, getLogs);

module.exports = router;