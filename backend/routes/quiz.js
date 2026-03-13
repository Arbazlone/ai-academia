const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    generateQuizFromNote,
    getAllQuizzes,
    getQuiz,
    submitQuizAttempt,
    getQuizResults
} = require('../controllers/quizController');

router.use(protect);

// Generate quiz from note
router.post('/generate/:noteId', generateQuizFromNote);

// Get all quizzes
router.get('/', getAllQuizzes);

// Get single quiz
router.get('/:id', getQuiz);

// Submit quiz attempt
router.post('/:id/attempt', submitQuizAttempt);

// Get quiz results
router.get('/:id/results', getQuizResults);

module.exports = router;