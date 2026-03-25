const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: [String],
    correctAnswer: {
        type: String,
        required: true
    },
    explanation: String,
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    topic: String
});

const QuizSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    note: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note'
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    questions: [QuestionSchema],
    timeLimit: Number, // in minutes
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'mixed'],
        default: 'mixed'
    },
    attempts: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        score: Number,
        totalQuestions: Number,
        percentage: Number,
        answers: [{
            questionId: mongoose.Schema.Types.ObjectId,
            selectedAnswer: String,
            isCorrect: Boolean
        }],
        timeSpent: Number,
        completedAt: {
            type: Date,
            default: Date.now
        }
    }],
    averageScore: {
        type: Number,
        default: 0
    },
    timesTaken: {
        type: Number,
        default: 0
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);