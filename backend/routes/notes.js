const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
    uploadNote,
    getAllNotes,
    getNote,
    updateNote,
    deleteNote,
    generateNoteSummary,
    generateNoteFlashcards,
    generateNoteConcepts,
    generateNoteQuiz,
    searchNotes
} = require('../controllers/noteController');

// All routes are protected
router.use(protect);

// Upload note
router.post('/upload', upload.single('file'), uploadNote);

// Get all notes for user
router.get('/', getAllNotes);

// Search notes
router.get('/search', searchNotes);

// Get single note
router.get('/:id', getNote);

// Update note
router.put('/:id', updateNote);

// Delete note
router.delete('/:id', deleteNote);

// AI operations on note
router.post('/:id/summary', generateNoteSummary);
router.post('/:id/flashcards', generateNoteFlashcards);
router.post('/:id/concepts', generateNoteConcepts);
router.post('/:id/quiz', generateNoteQuiz);

module.exports = router;