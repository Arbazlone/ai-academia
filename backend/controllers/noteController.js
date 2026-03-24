const Note = require('../models/Note');
const User = require('../models/user');

const { cloudinary } = require('../config/cloudinary');

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const streamifier = require("streamifier");

const {
  generateSummary,
  generateFlashcards,
  extractKeyConcepts,
  generateQuiz
} = require('../utils/aiHelpers');


// =========================
// Extract text from files
// =========================

const extractTextFromFile = async (buffer, mimeType) => {

  try {

    if (mimeType === "application/pdf") {

      const data = await pdfParse(buffer);
      return data.text;

    }

    else if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {

      const result = await mammoth.extractRawText({ buffer });
      return result.value;

    }

    else if (mimeType === "text/plain") {

      return buffer.toString("utf8");

    }

    return "";

  }

  catch (error) {

    console.error("Text extraction error:", error);
    throw new Error("Failed to extract text from file");

  }

};



// =========================
// Upload note
// =========================

exports.uploadNote = async (req, res) => {

  try {

    if (!req.file) {

      return res.status(400).json({
        success: false,
        message: "Please upload a file"
      });

    }

    const { title, tags, isPublic } = req.body;

    // Extract text from uploaded file
    const content = await extractTextFromFile(
      req.file.buffer,
      req.file.mimetype
    );



    // Upload file to Cloudinary
    const uploadFromBuffer = () => {

      return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "ai-academic-brain/notes",
            resource_type: "raw"
          },
          (error, result) => {

            if (result) resolve(result);
            else reject(error);

          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);

      });

    };

    const uploadedFile = await uploadFromBuffer();



    // Calculate reading stats
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);



    // Save note
    const note = await Note.create({

      user: req.user.id,

      title: title || req.file.originalname,

      originalFile: {

        url: uploadedFile.secure_url,
        publicId: uploadedFile.public_id,
        fileType: req.file.mimetype,
        fileName: req.file.originalname

      },

      content,
      wordCount,
      readingTime,

      tags: tags ? tags.split(",").map(tag => tag.trim()) : [],

      isPublic: isPublic === "true"

    });



    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "stats.notesProcessed": 1 }
    });



    res.status(201).json({
      success: true,
      note
    });

  }

  catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });

  }

};



// =========================
// Get all notes
// =========================

exports.getAllNotes = async (req, res) => {

  try {

    const notes = await Note.find({ user: req.user.id })
      .sort("-createdAt")
      .select("-content");

    res.json({
      success: true,
      count: notes.length,
      notes
    });

  }

  catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

};



// =========================
// Get single note
// =========================

exports.getNote = async (req, res) => {

  try {

    const note = await Note.findById(req.params.id);

    if (!note) {

      return res.status(404).json({
        success: false,
        message: "Note not found"
      });

    }

    if (note.user.toString() !== req.user.id && !note.isPublic) {

      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });

    }

    res.json({
      success: true,
      note
    });

  }

  catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

};



// =========================
// Update note
// =========================

exports.updateNote = async (req, res) => {

  try {

    let note = await Note.findById(req.params.id);

    if (!note) {

      return res.status(404).json({
        success: false,
        message: "Note not found"
      });

    }

    if (note.user.toString() !== req.user.id) {

      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });

    }

    note = await Note.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      note
    });

  }

  catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

};



// =========================
// Delete note
// =========================

exports.deleteNote = async (req, res) => {

  try {

    const note = await Note.findById(req.params.id);

    if (!note) {

      return res.status(404).json({
        success: false,
        message: "Note not found"
      });

    }

    if (note.user.toString() !== req.user.id) {

      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });

    }

    if (note.originalFile?.publicId) {

      await cloudinary.uploader.destroy(note.originalFile.publicId);

    }

    await note.deleteOne();

    res.json({
      success: true,
      message: "Note deleted successfully"
    });

  }

  catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

};



// =========================
// AI Summary
// =========================

exports.generateNoteSummary = async (req, res) => {

  try {

    const note = await Note.findById(req.params.id);

    const summary = await generateSummary(note.content);

    note.summary = summary;
    note.aiGenerated.summary = true;

    await note.save();

    res.json({
      success: true,
      summary
    });

  }

  catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};



// =========================
// Flashcards
// =========================

exports.generateNoteFlashcards = async (req, res) => {

  try {

    const note = await Note.findById(req.params.id);

    const flashcards = await generateFlashcards(note.content);

    note.flashcards = flashcards;
    note.aiGenerated.flashcards = true;

    await note.save();

    res.json({
      success: true,
      flashcards
    });

  }

  catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};



// =========================
// Key Concepts
// =========================

exports.generateNoteConcepts = async (req, res) => {

  try {

    const note = await Note.findById(req.params.id);

    const concepts = await extractKeyConcepts(note.content);

    note.keyConcepts = concepts;
    note.aiGenerated.concepts = true;

    await note.save();

    res.json({
      success: true,
      concepts
    });

  }

  catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};



// =========================
// Search notes
// =========================

exports.searchNotes = async (req, res) => {

  try {

    const { q } = req.query;

    const notes = await Note.find({
      user: req.user.id,
      $or: [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } }
      ]
    })
      .select("-content")
      .limit(20);

    res.json({
      success: true,
      count: notes.length,
      notes
    });

  }

  catch (error) {

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

};
// Generate Quiz
exports.generateNoteQuiz = async (req, res) => {

  try {

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found"
      });
    }

    if (note.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    const quiz = await generateQuiz(note.content);

    res.json({
      success: true,
      quiz
    });

  }

  catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to generate quiz"
    });

  }

};