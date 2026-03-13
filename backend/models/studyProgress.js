const mongoose = require('mongoose');

const StudyProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    studySessions: [{
        note: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Note'
        },
        duration: Number, // minutes
        topicsStudied: [String],
        flashcardsReviewed: Number,
        quizScore: Number,
        startTime: Date,
        endTime: Date
    }],
    dailyStats: {
        totalStudyTime: { type: Number, default: 0 },
        notesReviewed: { type: Number, default: 0 },
        quizzesCompleted: { type: Number, default: 0 },
        flashcardsMastered: { type: Number, default: 0 }
    },
    weeklyGoal: {
        target: { type: Number, default: 420 }, // 7 hours
        progress: { type: Number, default: 0 }
    },
    strengths: [{
        topic: String,
        score: Number
    }],
    weaknesses: [{
        topic: String,
        score: Number
    }],
    learningPath: [{
        topic: String,
        priority: Number,
        suggestedResources: [String],
        completed: { type: Boolean, default: false }
    }]
});

module.exports = mongoose.model('StudyProgress', StudyProgressSchema);