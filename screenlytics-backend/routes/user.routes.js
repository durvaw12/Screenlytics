// routes/user.routes.js

const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { getMe, updateMe, updatePassword } = require('../controllers/user.controller');

router.use(auth);

router.get('/me',              getMe);
router.patch('/me',            updateMe);
router.patch('/me/password',   updatePassword);

module.exports = router;
