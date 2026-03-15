// routes/log.routes.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { upsertLog, getLogs, getLogByDate, deleteLog } = require('../controllers/log.controller');

router.use(auth);                        // all log routes need a valid token

router.get('/',         getLogs);
router.post('/',        upsertLog);
router.get('/:date',    getLogByDate);   // date = YYYY-MM-DD
router.delete('/:date', deleteLog);

module.exports = router;
