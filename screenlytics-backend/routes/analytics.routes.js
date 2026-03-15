// routes/analytics.routes.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { getSummary, getChartData, getStreak } = require('../controllers/analytics.controller');

router.use(auth);

router.get('/summary',    getSummary);    // ?days=7
router.get('/chart',      getChartData);  // ?days=7
router.get('/streak',     getStreak);

module.exports = router;
