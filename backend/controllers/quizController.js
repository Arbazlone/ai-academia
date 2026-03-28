const Quiz = require('../models/quiz');
const Note = require('../models/note');
const User = require('../models/user');
const StudyProgress = require('../models/studyProgress');
const { generateQuiz } = require('../utils/aiHelpers');
// @desc    Generate quiz from note
// @route   POST /api/quiz/generate/:noteId
// @access  Private
exports.generateQuizFromNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.noteId);

        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        // Check ownership
        if (note.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const { numQuestions = 10, difficulty = 'medium', title } = req.body;

        // Generate quiz using AI
        const questions = await generateQuiz(note.content, numQuestions, difficulty);

        // Create quiz
        const quiz = await Quiz.create({
            user: req.user.id,
            note: note._id,
            title: title || `Quiz: ${note.title}`,
            description: `Generated from "${note.title}"`,
            questions,
            difficulty,
            timeLimit: numQuestions * 2 // 2 minutes per question
        });

        res.status(201).json({
            success: true,
            quiz
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate quiz'
        });
    }
};

// @desc    Get all quizzes for user
// @route   GET /api/quiz
// @access  Private
exports.getAllQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ user: req.user.id })
            .populate('note', 'title')
            .sort('-createdAt');

        res.json({
            success: true,
            count: quizzes.length,
            quizzes
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get single quiz
// @route   GET /api/quiz/:id
// @access  Private
exports.getQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id)
            .populate('note', 'title');

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        // Check if user owns the quiz or note is public
        if (quiz.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this quiz'
            });
        }

        // Don't send correct answers if quiz hasn't been attempted
        const quizForAttempt = quiz.toObject();
        if (!quiz.attempts.some(a => a.user.toString() === req.user.id)) {
            quizForAttempt.questions = quiz.questions.map(q => ({
                ...q,
                correctAnswer: undefined
            }));
        }

        res.json({
            success: true,
            quiz: quizForAttempt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Submit quiz attempt
// @route   POST /api/quiz/:id/attempt
// @access  Private
exports.submitQuizAttempt = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        const { answers, timeSpent } = req.body;

        // Calculate score
        let score = 0;
        const questionResults = [];

        quiz.questions.forEach((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            if (isCorrect) score++;

            questionResults.push({
                questionId: question._id,
                selectedAnswer: userAnswer,
                isCorrect
            });
        });

        const percentage = (score / quiz.questions.length) * 100;

        // Create attempt
        const attempt = {
            user: req.user.id,
            score,
            totalQuestions: quiz.questions.length,
            percentage,
            answers: questionResults,
            timeSpent
        };

        quiz.attempts.push(attempt);
        
        // Update average score
        const totalScore = quiz.attempts.reduce((sum, a) => sum + a.percentage, 0);
        quiz.averageScore = totalScore / quiz.attempts.length;
        quiz.timesTaken = quiz.attempts.length;
        
        await quiz.save();

        // Update user stats
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { 'stats.quizzesTaken': 1 }
        });

        // Update study progress
        let progress = await StudyProgress.findOne({ user: req.user.id, date: new Date().setHours(0,0,0,0) });
        if (!progress) {
            progress = await StudyProgress.create({
                user: req.user.id,
                date: new Date().setHours(0,0,0,0)
            });
        }
        
        progress.dailyStats.quizzesCompleted += 1;
        await progress.save();

        res.json({
            success: true,
            attempt: {
                score,
                totalQuestions: quiz.questions.length,
                percentage,
                passed: percentage >= 70
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

// @desc    Get quiz results
// @route   GET /api/quiz/:id/results
// @access  Private
exports.getQuizResults = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        // Get user's attempts
        const userAttempts = quiz.attempts.filter(
            a => a.user.toString() === req.user.id
        );

        // Calculate statistics
        const stats = {
            totalAttempts: userAttempts.length,
            bestScore: Math.max(...userAttempts.map(a => a.percentage)),
            averageScore: userAttempts.reduce((sum, a) => sum + a.percentage, 0) / userAttempts.length,
            recentAttempts: userAttempts.slice(-5)
        };

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};