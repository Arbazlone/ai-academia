// ===============================
// LOCAL AI HELPERS (NO API NEEDED)
// ===============================

// -------- SUMMARY --------
const generateSummary = async (text) => {

  if (!text) return "No content available.";

  const cleanText = text.replace(/\n/g, " ");

  const sentences = cleanText
    .split(".")
    .map(s => s.trim())
    .filter(s => s.length > 20);

  if (sentences.length <= 3) {
    return sentences.join(". ") + ".";
  }

  const words = cleanText
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/);

  const freq = {};

  words.forEach(word => {
    if (word.length > 3) {
      freq[word] = (freq[word] || 0) + 1;
    }
  });

  const scored = sentences.map(sentence => {

    const sentenceWords = sentence.toLowerCase().split(" ");

    let score = 0;

    sentenceWords.forEach(word => {
      if (freq[word]) score += freq[word];
    });

    return { sentence, score };

  });

  scored.sort((a, b) => b.score - a.score);

  const summary = scored
    .slice(0, 3)
    .map(s => s.sentence)
    .join(". ");

  return summary + ".";
};


// -------- KEY CONCEPTS --------
const extractKeyConcepts = async (text) => {

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/);

  const freq = {};

  words.forEach(word => {

    if (word.length > 5) {
      freq[word] = (freq[word] || 0) + 1;
    }

  });

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return sorted.map(([word, count]) => ({
    concept: word,
    explanation: `Important topic appearing ${count} times in the notes.`,
    importance: Math.min(10, count)
  }));

};


// -------- FLASHCARDS --------
const generateFlashcards = async (text) => {

  const sentences = text
    .split(".")
    .map(s => s.trim())
    .filter(s => s.length > 20)
    .slice(0, 10);

  const flashcards = sentences.map((sentence, index) => ({

    front: `Explain concept ${index + 1}`,
    back: sentence

  }));

  return flashcards;

};


// -------- QUIZ --------
const generateQuiz = async (text, numQuestions = 5) => {

  const sentences = text
    .split(".")
    .map(s => s.trim())
    .filter(s => s.length > 20)
    .slice(0, numQuestions);

  return sentences.map((sentence, i) => ({

    question: `What does the following statement describe?\n${sentence}`,

    options: [
      "Concept A",
      "Concept B",
      "Concept C",
      "Concept D"
    ],

    correctAnswer: "Concept A",

    explanation: sentence

  }));

};


// -------- CHAT --------
const chatWithAI = async (question, context) => {

  return `Based on your notes, here is a helpful explanation:\n\n${context.substring(0, 300)}...\n\nYour question was: "${question}". Review the highlighted concepts in the notes for deeper understanding.`;

};


// -------- STUDY PLAN --------
const generateStudyPlan = async (topics, timeAvailable, deadline) => {

  return `Study Plan\n\nTopics: ${topics.join(", ")}\n\nDaily Study Time: ${timeAvailable} minutes\n\nDeadline: ${deadline}\n\nRecommended plan:\n- Divide topics evenly across available days\n- Revise summaries after each session\n- Practice flashcards daily`;

};


module.exports = {

  generateSummary,
  extractKeyConcepts,
  generateFlashcards,
  generateQuiz,
  chatWithAI,
  generateStudyPlan

};