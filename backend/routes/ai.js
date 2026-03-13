const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
    chatWithAI,
    generateStudyPlan,
    explainConcept,
    generatePracticeQuestions
} = require('../controllers/aiController');

router.use(protect);

// Chat with AI about studies
router.post('/chat', chatWithAI);

// Generate study plan
router.post('/study-plan', generateStudyPlan);

// Explain a concept
router.post('/explain', explainConcept);

// Generate practice questions
router.post('/practice', generatePracticeQuestions);

module.exports = router;