const express = require('express');
const router  = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  updateNotifications,
  exportData,
  deleteAccount
} = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes protected

// GET    /api/profile                   → get profile + stats + notifications
router.get('/',                authMiddleware, getProfile);

// PUT    /api/profile                   → update name & email
router.put('/',                authMiddleware, updateProfile);

// PUT    /api/profile/password          → change password
router.put('/password',        authMiddleware, changePassword);

// PUT    /api/profile/notifications     → save notification preferences
router.put('/notifications',   authMiddleware, updateNotifications);

// GET    /api/profile/export            → export all user data
router.get('/export',          authMiddleware, exportData);

// DELETE /api/profile                   → delete account
router.delete('/',             authMiddleware, deleteAccount);

module.exports = router;