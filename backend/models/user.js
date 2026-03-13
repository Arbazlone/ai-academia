const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    avatar: {
        type: String,
        default: 'https://placehold.co/200x200/4f46e5/white?text=User'
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    studyPreferences: {
        dailyGoal: { type: Number, default: 60 }, // minutes
        subjects: [String],
        preferredQuizType: { type: String, default: 'multiple-choice' }
    },
    stats: {
        notesProcessed: { type: Number, default: 0 },
        quizzesTaken: { type: Number, default: 0 },
        studyStreak: { type: Number, default: 0 },
        lastActive: { type: Date, default: Date.now }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);