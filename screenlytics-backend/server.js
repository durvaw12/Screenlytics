// server.js — Screenlytics Express entry point

require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const { testConnection } = require('./config/db');
const authRoutes         = require('./routes/auth.routes');
const logRoutes          = require('./routes/log.routes');
const taskRoutes         = require('./routes/task.routes');
const userRoutes         = require('./routes/user.routes');
const analyticsRoutes    = require('./routes/analytics.routes');
const errorHandler       = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ── Health check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Screenlytics API is running' });
});

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/logs',      logRoutes);
app.use('/api/tasks',     taskRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/analytics', analyticsRoutes);

// ── Global error handler ─────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────
async function start() {
  await testConnection();        // confirm DB is reachable
  app.listen(PORT, () => {
    console.log(`✅  Screenlytics API listening on http://localhost:${PORT}`);
  });
}

start();
