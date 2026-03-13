const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getUserProfile,
    getUserStats,
    getStudyProgress,
    updateStudyPreferences,
    getDashboardData
} = require('../controllers/userController');

router.use(protect);

// Get user profile
router.get('/profile', getUserProfile);

// Get user stats
router.get('/stats', getUserStats);

// Get study progress
router.get('/progress', getStudyProgress);

// Update study preferences
router.put('/preferences', updateStudyPreferences);

// Get dashboard data
router.get('/dashboard', getDashboardData);

module.exports = router;