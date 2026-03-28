const Note = require('../models/note');
const { chatWithAI, generateStudyPlan } = require('../utils/aiHelpers');

// @desc    Chat with AI about studies
// @route   POST /api/ai/chat
// @access  Private
exports.chatWithAI = async (req, res) => {
    try {
        const { message, noteId } = req.body;

        let context = '';

        if (noteId) {
            const note = await Note.findById(noteId);

            if (note && note.user.toString() === req.user.id) {
                context = note.content;
            }
        }

        const response = await chatWithAI(message, context);

        res.json({
            success: true,
            response
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get AI response'
        });
    }
};

// @desc Generate study plan
// @route POST /api/ai/study-plan
// @access Private
exports.generateStudyPlan = async (req, res) => {
    try {

        const { topics, timeAvailable, deadline } = req.body;

        const studyPlan = await generateStudyPlan(topics, timeAvailable, deadline);

        res.json({
            success: true,
            studyPlan
        });

    } catch (error) {

        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate study plan'
        });

    }
};

// @desc Explain a concept
// @route POST /api/ai/explain
// @access Private
exports.explainConcept = async (req, res) => {

    try {

        const { concept, level = 'beginner' } = req.body;

        const prompt = `Explain the concept of "${concept}" at a ${level} level. Include examples and make it easy to understand.`;

        const explanation = await chatWithAI(prompt, '');

        res.json({
            success: true,
            explanation
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to explain concept'
        });

    }

};

// @desc Generate practice questions
// @route POST /api/ai/practice
// @access Private
exports.generatePracticeQuestions = async (req, res) => {

    try {

        const { topic, numQuestions = 5 } = req.body;

        const prompt = `Generate ${numQuestions} practice questions about "${topic}" for exam preparation. Include answers and brief explanations.`;

        const questions = await chatWithAI(prompt, '');

        res.json({
            success: true,
            questions
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate questions'
        });

    }

};