// backend/server.js — updated with cron jobs for notifications

const express         = require('express');
const cors            = require('cors');
const dotenv          = require('dotenv');
const cron            = require('node-cron');                          // ← NEW
const db              = require('./config/db');
const authRoutes      = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const logRoutes       = require('./routes/logRoutes');
const plannerRoutes   = require('./routes/plannerRoutes');
const profileRoutes   = require('./routes/profileRoutes');
const awarenessRoutes = require('./routes/awarenessRoutes');
const { sendDailyReminders, sendWeeklyReports } = require('./controllers/notificationController'); // ← NEW

dotenv.config();

const app = express();

// ✅ Allow all localhost dev ports
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// ✅ All Routes
app.use('/api/auth',      authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/logs',      logRoutes);
app.use('/api/planner',   plannerRoutes);
app.use('/api/profile',   profileRoutes);
app.use('/api/awareness', awarenessRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Screenlytics backend is running 🚀' });
});

// ─── SCHEDULED JOBS ──────────────────────────────────────────────────────────

// 1. Daily Reminder — every day at 11:45 AM
cron.schedule('45 11 * * *', () => {
  console.log('[CRON] Running Daily Reminder job...');
  sendDailyReminders();
});

// 2. Weekly Report — every Sunday at 11:45 AM
cron.schedule('45 11 * * 0', () => {
  console.log('[CRON] Running Weekly Report job...');
  sendWeeklyReports();
});



// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
console.log('⏰ Daily Reminder scheduled: every day at 11:45 AM');
console.log('📊 Weekly Report scheduled: every Sunday at 11:45 AM');



});
