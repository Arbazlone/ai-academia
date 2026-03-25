// ========== script.js ==========
// AI Academic Brain - Frontend with MongoDB + JWT integration

const API_BASE_URL = "http://localhost:5000/api";

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  initModals();
  checkLoginStatus();
  fetchStats();
  initSidebarNav();
  initProfileDropdown();
  fixAllButtons();
});

// ================= SIDEBAR NAVIGATION =================
function initSidebarNav() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.section');
  const pageTitle = document.getElementById('pageTitle');

  function setActiveSection(sectionId, title) {
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    navItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`.nav-item[data-section="${sectionId}"]`).classList.add('active');
    if (pageTitle) pageTitle.textContent = title;
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = item.getAttribute('data-section');
      const title = item.querySelector('span')?.textContent || sectionId;
      setActiveSection(sectionId, title);
    });
  });

  // Set initial active from hash or default
  const hash = window.location.hash.substring(1) || 'home';
  if (['home', 'dashboard', 'ai-tools', 'about', 'contact'].includes(hash)) {
    setActiveSection(hash, hash === 'ai-tools' ? 'AI Tools' : hash.charAt(0).toUpperCase() + hash.slice(1));
  } else {
    setActiveSection('home', 'Home');
  }

  // Handle explore tools button
  const exploreBtn = document.getElementById('exploreToolsBtn');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', () => setActiveSection('ai-tools', 'AI Tools'));
  }
}

// ================= PROFILE DROPDOWN =================
function initProfileDropdown() {
  const trigger = document.getElementById('profileTrigger');
  const dropdown = document.getElementById('dropdownMenu');
  if (!trigger || !dropdown) return;
  trigger.addEventListener('click', () => {
    dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
  });
  document.addEventListener('click', (e) => {
    if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) logoutLink.addEventListener('click', (e) => { e.preventDefault(); logout(); });
}

// ================= AUTH HELPER =================
function authFetch(url, options = {}) {
  const token = localStorage.getItem("authToken");
  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options.headers || {}),
    },
  });
}

// ================= LOGIN STATUS =================
function checkLoginStatus() {
  const token = localStorage.getItem("authToken");
  const userData = localStorage.getItem("user");
  if (token && userData) {
    try {
      currentUser = JSON.parse(userData);
      // Update UI for logged in user
      document.getElementById('userNameDisplay').textContent = currentUser.name || "User";
      document.getElementById('profileName').textContent = currentUser.name || "User";
      document.getElementById('userStatusBadge').textContent = "Logged in";
      document.getElementById('sidebarAuth').style.display = 'none';
      document.getElementById('userMenu').style.display = 'block';
    } catch (err) {
      logout();
    }
  } else {
    document.getElementById('userNameDisplay').textContent = "Guest";
    document.getElementById('profileName').textContent = "Guest";
    document.getElementById('userStatusBadge').textContent = "Not logged in";
    document.getElementById('sidebarAuth').style.display = 'flex';
    document.getElementById('userMenu').style.display = 'none';
  }
}

function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  window.location.reload();
}

// ================= STATS =================
async function fetchStats() {
  try {
    const response = await authFetch("/notes");
    if (!response.ok) throw new Error("Stats fetch failed");
    const data = await response.json();
    animateCounter("#notesProcessed", data.notesProcessed || 0);
    animateCounter("#totalStudents", data.students || 0);
    animateCounter("#quizzesGenerated", data.quizzesGenerated || 0);
    animateCounter("#knowledgeMaps", data.knowledgeMaps || 0);
    // Update hero stats
    document.getElementById("heroNotesProcessed") && (document.getElementById("heroNotesProcessed").innerText = data.notesProcessed || "10k+");
    document.getElementById("heroStudents") && (document.getElementById("heroStudents").innerText = data.students || "2.5k+");
    document.getElementById("heroQuizzes") && (document.getElementById("heroQuizzes").innerText = data.quizzesGenerated || "35k+");
  } catch (err) {
    console.error("Error fetching stats:", err);
  }
}

function animateCounter(selector, target) {
  const element = document.querySelector(selector);
  if (!element) return;
  let current = 0;
  const increment = target / 100;
  function update() {
    current += increment;
    if (current < target) {
      element.textContent = Math.ceil(current);
      requestAnimationFrame(update);
    } else {
      element.textContent = target;
    }
  }
  update();
}

// ================= FILE UPLOAD =================
async function uploadPDF(file) {
  const token = localStorage.getItem("authToken");
  if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }
  const formData = new FormData();
  formData.append("file", file);
  try {
    const response = await fetch(`${API_BASE_URL}/notes/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Upload failed");
    if (!data.note) throw new Error("Backend did not return note data");
    localStorage.setItem("currentNoteId", data.note._id);
    showAnalysisResult(data.note);
    fetchStats();
  } catch (error) {
    console.error("Upload error:", error);
    alert(error.message || "Upload failed");
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.type !== "application/pdf") {
    alert("Please upload a PDF file");
    return;
  }
  uploadPDF(file);
}

// ================= QUIZ =================
async function generateQuiz() {
  const noteId = localStorage.getItem("currentNoteId");
  if (!noteId) {
    alert("Please upload a note first before generating a quiz");
    openUploadModal();
    return;
  }
  const token = localStorage.getItem("authToken");
  if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }
  const quizBtn = document.querySelector('#ai-tools .tool-card:nth-child(3) .tool-btn');
  const originalText = quizBtn ? quizBtn.innerHTML : 'Try Now';
  if (quizBtn) {
    quizBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    quizBtn.disabled = true;
  }
  try {
    const response = await authFetch(`/notes/${noteId}/quiz`, {
      method: "POST",
      body: JSON.stringify({ topic: "general", difficulty: "medium", count: 5 }),
    });
    const data = await response.json();
    if (response.ok) {
      displayQuiz(data.quiz || data);
      fetchStats();
    } else {
      throw new Error(data.message || `Server error: ${response.status}`);
    }
  } catch (err) {
    console.error("Quiz generation error:", err);
    alert(`Quiz generation failed: ${err.message}\n\nMake sure you have uploaded a note first and your backend is running.`);
  } finally {
    if (quizBtn) {
      quizBtn.innerHTML = originalText;
      quizBtn.disabled = false;
    }
  }
}

function displayQuiz(quiz) {
  const modal = document.getElementById('quizModal');
  const container = document.getElementById('quizContainer');
  if (!modal || !container) return;
  container.innerHTML = '';
  if (!quiz) {
    container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444;">❌ No quiz data received</div>';
    modal.style.display = 'block';
    return;
  }
  let questions = [];
  if (quiz.questions && Array.isArray(quiz.questions)) questions = quiz.questions;
  else if (Array.isArray(quiz)) questions = quiz;
  else if (quiz.data && quiz.data.questions) questions = quiz.data.questions;
  else {
    container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444;">❌ Invalid quiz format</div>';
    modal.style.display = 'block';
    return;
  }
  if (questions.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 2rem;">📝 No questions generated. Try again with different settings.</div>';
    modal.style.display = 'block';
    return;
  }
  let html = '<div class="quiz-questions">';
  questions.forEach((q, index) => {
    const questionText = q.question || q.text || `Question ${index + 1}`;
    const options = q.options || q.choices || [];
    html += `<div class="quiz-question" data-qid="${index}"><p><strong>Q${index + 1}:</strong> ${questionText}</p><div class="options">`;
    if (options.length) {
      options.forEach((opt, optIndex) => {
        const optText = opt.text || opt.value || opt || `Option ${optIndex + 1}`;
        html += `<label><input type="radio" name="q${index}" value="${optIndex}"> <span>${optText}</span></label>`;
      });
    } else {
      html += `<p style="color: #999; font-style: italic;">No options available</p>`;
    }
    html += `</div></div>`;
  });
  html += `</div><div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;"><button class="btn-primary" onclick="submitQuizAnswers()">✅ Submit Answers</button><button class="btn-outline" onclick="closeQuizModal()">❌ Close</button></div>`;
  container.innerHTML = html;
  modal.style.display = 'block';
}

window.submitQuizAnswers = function() {
  const questions = document.querySelectorAll('.quiz-question');
  let answered = 0;
  questions.forEach(q => {
    if (q.querySelector('input[type="radio"]:checked')) answered++;
  });
  alert(`📊 Quiz submitted! You answered ${answered} out of ${questions.length} questions.`);
};

// ================= AI CHAT =================
async function askQuestion() {
  const question = document.getElementById("chatQuestion").value.trim();
  if (!question) {
    alert("Please enter a question");
    return;
  }
  const token = localStorage.getItem("authToken");
  if (!token) {
    alert("Please login first to use AI assistant");
    window.location.href = "login.html";
    return;
  }
  addChatMessage("user", question);
  document.getElementById("chatQuestion").value = "";
  showTypingIndicator();
  try {
    const response = await authFetch("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ question: question, noteId: localStorage.getItem("currentNoteId") || null }),
    });
    const data = await response.json();
    removeTypingIndicator();
    if (response.ok) {
      let answer = data.answer || data.response || data.message || data.text;
      if (!answer && data.data) answer = data.data.answer || data.data.response;
      if (answer) addChatMessage("ai", answer);
      else addChatMessage("ai", "I received a response but couldn't understand it.");
    } else {
      throw new Error(data.message || `Error ${response.status}`);
    }
  } catch (err) {
    console.error("AI chat error:", err);
    removeTypingIndicator();
    addChatMessage("ai", "I'm having trouble connecting to the AI service. Please try again later. (Demo mode)");
  }
}

function showTypingIndicator() {
  const container = document.getElementById("chatMessages");
  if (!container) return;
  const indicator = document.createElement("div");
  indicator.id = "typing-indicator";
  indicator.className = "ai-message";
  indicator.innerHTML = `<span><strong>AI:</strong> <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></span>`;
  container.appendChild(indicator);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById("typing-indicator");
  if (indicator) indicator.remove();
}

function addChatMessage(type, message) {
  const container = document.getElementById("chatMessages");
  if (!container) return;
  const div = document.createElement("div");
  div.className = type === "user" ? "user-message" : "ai-message";
  div.innerHTML = `<span><strong>${type === "user" ? "You" : "AI"}:</strong> ${message}</span>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// ================= UI HELPERS =================
function openUploadModal() { document.getElementById("uploadModal").style.display = "block"; }
function closeUploadModal() { document.getElementById("uploadModal").style.display = "none"; }
function closeChatModal() { document.getElementById('chatModal').style.display = 'none'; }
function closeQuizModal() { document.getElementById('quizModal').style.display = 'none'; }

function showAnalysisResult(note) {
  document.getElementById("analysisResult").style.display = "block";
  const summary = note.summary || (note.content ? note.content.substring(0, 300) + "..." : "N/A");
  const pages = note.pages || "Unknown";
  document.getElementById("resultContent").innerHTML = `<p><strong>Summary:</strong> ${summary}</p><p><strong>Pages:</strong> ${pages}</p>`;
}

function initModals() {
  window.onclick = function(event) {
    if (event.target.classList.contains("modal")) event.target.style.display = "none";
  };
}

// ================= DEMO TOOLS =================
window.generateKnowledgeGraph = function() {
  const modal = document.getElementById('quizModal');
  const container = document.getElementById('quizContainer');
  if (!modal || !container) {
    alert("📊 Knowledge Graph: Visualizing connections between topics...");
    return;
  }
  container.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <h2 style="color: #3b82f6; margin-bottom: 1rem;"><i class="fas fa-project-diagram"></i> Knowledge Graph</h2>
      <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 2rem; border-radius: 1rem; margin-bottom: 1rem;">
        <div style="display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap;">
          <div style="background: white; padding: 1rem; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-brain" style="color: #3b82f6; font-size: 2rem;"></i></div>
          <div style="background: white; padding: 1rem; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-robot" style="color: #3b82f6; font-size: 2rem;"></i></div>
          <div style="background: white; padding: 1rem; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-chart-line" style="color: #3b82f6; font-size: 2rem;"></i></div>
        </div>
        <p style="color: white; margin-top: 1rem;">AI → Machine Learning → Deep Learning → Neural Networks</p>
      </div>
      <div style="display: grid; grid-template-columns: repeat(2,1fr); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 3px solid #3b82f6;"><strong>Artificial Intelligence</strong> → 12 connections</div>
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 3px solid #3b82f6;"><strong>Machine Learning</strong> → 8 connections</div>
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 3px solid #3b82f6;"><strong>Neural Networks</strong> → 6 connections</div>
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 3px solid #3b82f6;"><strong>Deep Learning</strong> → 5 connections</div>
      </div>
      <button class="btn-primary" onclick="closeQuizModal()">Close</button>
    </div>`;
  modal.style.display = 'block';
};

window.smartRevision = function() {
  const modal = document.getElementById('quizModal');
  const container = document.getElementById('quizContainer');
  if (!modal || !container) {
    alert("📚 Smart Revision: 10 flashcards generated!");
    return;
  }
  container.innerHTML = `
    <div style="text-align: center; padding: 1.5rem;">
      <h2 style="color: #3b82f6; margin-bottom: 1rem;"><i class="fas fa-bolt"></i> Smart Revision Flashcards</h2>
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; max-height: 400px; overflow-y: auto;">
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #3b82f6; text-align: left;"><b>Q:</b> What is Artificial Intelligence?<br><b>A:</b> Machines simulating human intelligence</div>
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #3b82f6; text-align: left;"><b>Q:</b> What is Machine Learning?<br><b>A:</b> AI that learns from data</div>
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #3b82f6; text-align: left;"><b>Q:</b> What are Neural Networks?<br><b>A:</b> Computing systems inspired by brain</div>
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #3b82f6; text-align: left;"><b>Q:</b> What is Deep Learning?<br><b>A:</b> Neural networks with multiple layers</div>
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #3b82f6; text-align: left;"><b>Q:</b> What is NLP?<br><b>A:</b> Natural Language Processing</div>
      </div>
      <button class="btn-primary" onclick="closeQuizModal()">Close</button>
    </div>`;
  modal.style.display = 'block';
};

window.studyPlanner = function() {
  const modal = document.getElementById('quizModal');
  const container = document.getElementById('quizContainer');
  if (!modal || !container) {
    alert("📅 Study Planner: Your 7-day plan is ready!");
    return;
  }
  container.innerHTML = `
    <div style="text-align: center; padding: 1.5rem;">
      <h2 style="color: #3b82f6; margin-bottom: 1rem;"><i class="fas fa-calendar-check"></i> 7-Day Study Plan</h2>
      <div style="display: grid; grid-template-columns: repeat(2,1fr); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;"><h3 style="color: #3b82f6;">Day 1</h3><p>Introduction & Basics</p><small>2 hours</small></div>
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;"><h3 style="color: #3b82f6;">Day 2</h3><p>Core Concepts</p><small>2 hours</small></div>
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;"><h3 style="color: #3b82f6;">Day 3</h3><p>Practice Quiz</p><small>1.5 hours</small></div>
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;"><h3 style="color: #3b82f6;">Day 4</h3><p>Advanced Topics</p><small>2 hours</small></div>
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;"><h3 style="color: #3b82f6;">Day 5</h3><p>Revision</p><small>2 hours</small></div>
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;"><h3 style="color: #3b82f6;">Day 6</h3><p>Final Review</p><small>2 hours</small></div>
        <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; grid-column: span 2;"><h3 style="color: #3b82f6;">Day 7</h3><p>Assessment</p><small>2 hours</small></div>
      </div>
      <button class="btn-primary" onclick="closeQuizModal()">Close</button>
    </div>`;
  modal.style.display = 'block';
};

function fixAllButtons() {
  setTimeout(() => {
    // Ensure all tool buttons are attached (they have onclick attributes)
    console.log("✅ Buttons ready");
  }, 500);
}

// Expose functions globally
window.logout = logout;
window.askQuestion = askQuestion;
window.openUploadModal = openUploadModal;
window.closeUploadModal = closeUploadModal;
window.openChatModal = openChatModal;
window.closeChatModal = closeChatModal;
window.closeQuizModal = closeQuizModal;
window.generateQuiz = generateQuiz;
window.generateKnowledgeGraph = generateKnowledgeGraph;
window.smartRevision = smartRevision;
window.studyPlanner = studyPlanner;
window.submitQuizAnswers = submitQuizAnswers;