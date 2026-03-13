const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a title']
    },
    originalFile: {
        url: String,
        publicId: String,
        fileType: String,
        fileName: String
    },
    content: {
        type: String,
        required: true
    },
    summary: {
        type: String
    },
    keyConcepts: [{
        concept: String,
        explanation: String,
        importance: { type: Number, min: 1, max: 10 }
    }],
    flashcards: [{
        front: String,
        back: String,
        mastered: { type: Boolean, default: false }
    }],
    topics: [String],
    wordCount: Number,
    readingTime: Number,
    tags: [String],
    isPublic: {
        type: Boolean,
        default: false
    },
    aiGenerated: {
        summary: { type: Boolean, default: false },
        flashcards: { type: Boolean, default: false },
        concepts: { type: Boolean, default: false }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Note', NoteSchema);