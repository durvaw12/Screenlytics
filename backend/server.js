const express           = require('express');
const cors              = require('cors');
const dotenv            = require('dotenv');
const db                = require('./config/db');
const authRoutes        = require('./routes/authRoutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');
const logRoutes         = require('./routes/logRoutes');
const plannerRoutes     = require('./routes/plannerRoutes');
const profileRoutes     = require('./routes/profileRoutes');
const awarenessRoutes   = require('./routes/awarenessRoutes'); // ✅ Add this

dotenv.config();

const app = express();

const corsOptions = {
  origin: process.env.CLIENT_URL,
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
app.use('/api/awareness', awarenessRoutes);                   // ✅ Add this

app.get('/', (req, res) => {
  res.json({ message: 'Screenlytics backend is running 🚀' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
