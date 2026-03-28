const User = require('../routes/user');
const Note = require('../models/note');
const Quiz = require('../models/quiz');
const StudyProgress = require('../models/studyProgress');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password');

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get user stats
// @route   GET /api/user/stats
// @access  Private
exports.getUserStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        // Get additional stats
        const totalNotes = await Note.countDocuments({ user: req.user.id });
        const totalQuizzes = await Quiz.countDocuments({ user: req.user.id });
        const recentActivity = await StudyProgress.find({ user: req.user.id })
            .sort('-date')
            .limit(7);

        res.json({
            success: true,
            stats: {
                ...user.stats.toObject(),
                totalNotes,
                totalQuizzes,
                recentActivity
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get study progress
// @route   GET /api/user/progress
// @access  Private
exports.getStudyProgress = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const progress = await StudyProgress.find({
            user: req.user.id,
            date: { $gte: startDate }
        }).sort('date');

        // Calculate strengths and weaknesses
        const quizzes = await Quiz.find({ user: req.user.id });
        const topicPerformance = {};

        quizzes.forEach(quiz => {
            quiz.attempts.forEach(attempt => {
                if (attempt.user.toString() === req.user.id) {
                    // Analyze performance by topic (would need topic field in questions)
                    // This is simplified
                    const score = attempt.percentage;
                    if (score >= 70) {
                        // Strengths
                    } else {
                        // Weaknesses
                    }
                }
            });
        });

        res.json({
            success: true,
            progress,
            summary: {
                totalStudyTime: progress.reduce((sum, p) => sum + p.dailyStats.totalStudyTime, 0),
                averageDailyTime: progress.length ? 
                    progress.reduce((sum, p) => sum + p.dailyStats.totalStudyTime, 0) / progress.length : 0,
                consistency: progress.length / days * 100
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update study preferences
// @route   PUT /api/user/preferences
// @access  Private
exports.updateStudyPreferences = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { studyPreferences: req.body },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            studyPreferences: user.studyPreferences
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get dashboard data
// @route   GET /api/user/dashboard
// @access  Private
exports.getDashboardData = async (req, res) => {
    try {
        // Get recent notes
        const recentNotes = await Note.find({ user: req.user.id })
            .sort('-createdAt')
            .limit(5)
            .select('title createdAt summary');

        // Get recent quizzes
        const recentQuizzes = await Quiz.find({ user: req.user.id })
            .sort('-createdAt')
            .limit(5)
            .populate('note', 'title')
            .select('title difficulty timesTaken averageScore');

        // Get today's progress
        const today = new Date().setHours(0, 0, 0, 0);
        const todayProgress = await StudyProgress.findOne({ 
            user: req.user.id, 
            date: today 
        });

        // Get streak
        const user = await User.findById(req.user.id);

        res.json({
            success: true,
            dashboard: {
                recentNotes,
                recentQuizzes,
                todayProgress: todayProgress || { dailyStats: { totalStudyTime: 0, quizzesCompleted: 0 } },
                streak: user.stats.studyStreak,
                lastActive: user.stats.lastActive
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};