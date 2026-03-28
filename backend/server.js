const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();


// =======================
// MIDDLEWARE
app.use(cors({
  origin: [
    'https://ai-academia.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// =======================

// parse json
app.use(express.json());

// parse form data
app.use(express.urlencoded({ extended: true }));

// CORS (allow frontend on 5500)
app.use(cors({
    origin: "http://127.0.0.1:5500",
    credentials: true
}));


// =======================
// DATABASE CONNECTION
// =======================

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.log("❌ MongoDB Error:", err));


// =======================
// IMPORT ROUTES
// =======================

const authRoutes = require("./routes/auth");
const noteRoutes = require("./routes/notes");
const quizRoutes = require("./routes/quiz");
const aiRoutes = require("./routes/ai");
const userRoutes = require("./routes/user");


// =======================
// API ROUTES
// =======================

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/user", userRoutes);


// =======================
// BASIC TEST ROUTE
// =======================

app.get("/", (req, res) => {
    res.send("🚀 AI Academic Brain API Running");
});


// =======================
// ERROR HANDLER
// =======================

app.use((err, req, res, next) => {

    console.error(err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Server Error"
    });

});


// =======================
// START SERVER
// =======================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});