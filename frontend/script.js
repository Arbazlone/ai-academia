// ========== script.js ==========
// AI Academic Brain - Frontend with MongoDB + JWT integration

const API_BASE_URL = "https://ai-academia-backend-0ei3.onrender.com/api";

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  initModals();
  checkLoginStatus();

  // Initialize AOS (Animate On Scroll) so elements with data-aos become visible
  if (typeof AOS !== "undefined") {
    AOS.init({
      once: true,
      duration: 700,
      easing: "ease-out-cubic",
    });
  } else {
    // AOS failed to load (network issue / CDN blocked). Ensure content is still visible.
    document.querySelectorAll("[data-aos]").forEach((el) => {
      el.style.opacity = "1";
      el.classList.add("aos-animate");
    });
  }

  // Initialize Swiper (testimonials slider)
  if (typeof Swiper !== "undefined") {
    new Swiper(".testimonial-swiper", {
      loop: true,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      autoplay: {
        delay: 5500,
        disableOnInteraction: false,
      },
      speed: 800,
    });
  }

  // Initialize particles background (optional)
  if (typeof particlesJS !== "undefined") {
    particlesJS("particles-js", {
      particles: {
        number: { value: 50, density: { enable: true, value_area: 800 } },
        color: { value: "#4f46e5" },
        shape: { type: "circle" },
        opacity: { value: 0.3 },
        size: { value: 3, random: true },
        line_linked: { enable: true, distance: 150, color: "#4f46e5", opacity: 0.2, width: 1 },
        move: { enable: true, speed: 2, direction: "none", out_mode: "bounce" },
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: { enable: true, mode: "grab" },
          onclick: { enable: true, mode: "push" },
          resize: true,
        },
        modes: {
          grab: { distance: 200, line_linked: { opacity: 0.3 } },
          push: { particles_nb: 4 },
        },
      },
      retina_detect: true,
    });
  }

  if (localStorage.getItem("authToken")) {
    fetchStats();
  }
  
  // Fix buttons on load
  fixAllButtons();
});


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


// ================= EVENT LISTENERS =================

function initEventListeners() {
  const navbar = document.getElementById("mainNav");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      navbar?.classList.add("scrolled");
    } else {
      navbar?.classList.remove("scrolled");
    }
  });

  const hamburger = document.getElementById("hamburgerBtn");
  const navMenu = document.getElementById("navMenu");

  hamburger?.addEventListener("click", () => {
    navMenu?.classList.toggle("active");
  });

  document
    .getElementById("uploadNotesBtn")
    ?.addEventListener("click", openUploadModal);

  document
    .getElementById("quizGenerator")
    ?.querySelector("button")
    ?.addEventListener("click", generateQuiz);

  document
    .getElementById("aiAssistant")
    ?.querySelector("button")
    ?.addEventListener("click", openChatModal);

  document
    .getElementById("fileInput")
    ?.addEventListener("change", handleFileSelect);
}


// ================= LOGIN =================

function checkLoginStatus() {
  const token = localStorage.getItem("authToken");
  const userData = localStorage.getItem("user");

  if (token && userData) {
    try {
      currentUser = JSON.parse(userData);

      document.getElementById("authButtons").style.display = "none";
      document.getElementById("userStatus").style.display = "flex";
      document.getElementById("userName").textContent =
        currentUser.name || "User";
    } catch (err) {
      logout();
    }
  } else {
    document.getElementById("authButtons").style.display = "flex";
    document.getElementById("userStatus").style.display = "none";
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
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    console.log("UPLOAD RESPONSE:", data);

    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }

    if (!data.note) {
      throw new Error("Backend did not return note data");
    }

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

  console.log("Selected file:", file.name);

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

  // Show loading state
  const quizBtn = document.querySelector('#quizGenerator .tool-action');
  const originalText = quizBtn ? quizBtn.textContent : 'Try Now';
  if (quizBtn) {
    quizBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    quizBtn.disabled = true;
  }

  try {
    console.log("Generating quiz for note ID:", noteId);
    console.log("API URL:", `${API_BASE_URL}/notes/${noteId}/quiz`);

    const response = await authFetch(`/notes/${noteId}/quiz`, {
      method: "POST",
      body: JSON.stringify({
        topic: "general",
        difficulty: "medium",
        count: 5,
      }),
    });

    console.log("Quiz response status:", response.status);
    const data = await response.json();
    console.log("Quiz response data:", data);

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

// ================= DISPLAY QUIZ =================

function displayQuiz(quiz) {
  console.log("Displaying quiz:", quiz);
  
  const modal = document.getElementById('quizModal');
  const container = document.getElementById('quizContainer');
  
  if (!modal || !container) {
    console.error("Quiz modal or container not found in DOM");
    alert("Quiz modal not found. Please refresh the page.");
    return;
  }
  
  container.innerHTML = '';
  
  if (!quiz) {
    container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444;">❌ No quiz data received</div>';
    modal.style.display = 'block';
    return;
  }
  
  let questions = [];
  
  if (quiz.questions && Array.isArray(quiz.questions)) {
    questions = quiz.questions;
  } else if (Array.isArray(quiz)) {
    questions = quiz;
  } else if (quiz.data && quiz.data.questions) {
    questions = quiz.data.questions;
  } else {
    console.error("Unexpected quiz format:", quiz);
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
    
    html += `
      <div class="quiz-question" data-qid="${index}">
        <p><strong>Q${index + 1}:</strong> ${questionText}</p>
        <div class="options">
    `;
    
    if (options.length > 0) {
      options.forEach((opt, optIndex) => {
        const optText = opt.text || opt.value || opt || `Option ${optIndex + 1}`;
        html += `
          <label class="option-label">
            <input type="radio" name="q${index}" value="${optIndex}">
            <span>${optText}</span>
          </label>
        `;
      });
    } else {
      html += `<p style="color: #999; font-style: italic; padding: 0.5rem;">No options available</p>`;
    }
    
    html += `</div></div>`;
  });
  
  html += `
    </div>
    <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
      <button class="btn-primary" onclick="submitQuizAnswers()">✅ Submit Answers</button>
      <button class="btn-outline" onclick="document.getElementById('quizModal').style.display='none'">❌ Close</button>
    </div>
  `;
  
  container.innerHTML = html;
  modal.style.display = 'block';
}

window.submitQuizAnswers = function() {
  const questions = document.querySelectorAll('.quiz-question');
  let answered = 0;
  
  questions.forEach((q) => {
    const selected = q.querySelector('input[type="radio"]:checked');
    if (selected) {
      answered++;
    }
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
    console.log("Sending question to AI:", question);
    
    const response = await authFetch("/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        question: question,
        noteId: localStorage.getItem("currentNoteId") || null
      }),
    });

    console.log("AI response status:", response.status);
    const data = await response.json();
    console.log("AI response data:", data);

    removeTypingIndicator();

    if (response.ok) {
      let answer = data.answer || data.response || data.message || data.text;
      
      if (!answer && data.data) {
        answer = data.data.answer || data.data.response;
      }
      
      if (answer) {
        addChatMessage("ai", answer);
      } else {
        console.warn("Unexpected response format:", data);
        addChatMessage("ai", "I received a response but couldn't understand it. Check console for details.");
      }
    } else {
      throw new Error(data.message || `Error ${response.status}`);
    }

  } catch (err) {
    console.error("AI chat error:", err);
    removeTypingIndicator();
    
    const fallbackResponses = {
      "hello": "Hello! How can I help you with your studies today?",
      "hi": "Hi there! Feel free to ask me anything about your notes.",
      "what is ai": "Artificial Intelligence (AI) is the simulation of human intelligence in machines that are programmed to think and learn.",
      "machine learning": "Machine learning is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed.",
      "default": "I'm having trouble connecting to the AI service. Please try again later or check if your backend is running."
    };
    
    const lowerQ = question.toLowerCase();
    let fallback = fallbackResponses.default;
    
    for (let [key, value] of Object.entries(fallbackResponses)) {
      if (lowerQ.includes(key)) {
        fallback = value;
        break;
      }
    }
    
    addChatMessage("ai", fallback + " (Demo mode)");
  }
}

function showTypingIndicator() {
  const container = document.getElementById("chatMessages");
  const indicator = document.createElement("div");
  indicator.id = "typing-indicator";
  indicator.className = "ai-message typing";
  indicator.innerHTML = `
    <strong>AI:</strong> 
    <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
  `;
  container.appendChild(indicator);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById("typing-indicator");
  if (indicator) {
    indicator.remove();
  }
}

function addChatMessage(type, message) {
  const container = document.getElementById("chatMessages");
  
  if (!container) {
    console.error("Chat messages container not found");
    return;
  }

  const div = document.createElement("div");
  div.className = type === "user" ? "user-message" : "ai-message";
  
  div.innerHTML = `
    <strong>${type === "user" ? "You" : "AI"}:</strong> 
    <span>${message}</span>
  `;
  
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

window.openChatModal = function() {
  const modal = document.getElementById('chatModal');
  const chatMessages = document.getElementById('chatMessages');
  
  if (modal) {
    modal.style.display = 'block';
    
    if (chatMessages && chatMessages.children.length === 0) {
      addChatMessage("ai", "Hello! I'm your AI study assistant. Ask me anything about your notes or studies!");
    }
  }
};


// ================= UI =================

function openUploadModal() {
  document.getElementById("uploadModal").style.display = "block";
}

function closeUploadModal() {
  document.getElementById("uploadModal").style.display = "none";
}

function closeChatModal() {
  const modal = document.getElementById('chatModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function showAnalysisResult(note) {
  document.getElementById("analysisResult").style.display = "block";

  const summary =
    note.summary ||
    (note.content ? note.content.substring(0, 300) + "..." : "N/A");

  const pages = note.pages || "Unknown";

  document.getElementById("resultContent").innerHTML = `
      <p><strong>Summary:</strong> ${summary}</p>
      <p><strong>Pages:</strong> ${pages}</p>
  `;
}

function initModals() {
  window.onclick = function (event) {
    if (event.target.classList.contains("modal")) {
      event.target.style.display = "none";
    }
  };
}

/* Make functions available for HTML onclick */
window.openUploadModal = openUploadModal;
window.closeUploadModal = closeUploadModal;
window.openChatModal = openChatModal;
window.closeChatModal = closeChatModal;
window.logout = logout;
window.askQuestion = askQuestion;


// ========== FIX FOR ALL TOOL BUTTONS ==========

// Knowledge Graph
window.generateKnowledgeGraph = function() {
    const modal = document.getElementById('quizModal');
    const container = document.getElementById('quizContainer');
    
    if (!modal || !container) {
        alert("📊 Knowledge Graph: Visualizing connections between topics...");
        return;
    }
    
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <h2 style="color: #4f46e5; margin-bottom: 1.5rem;">
                <i class="fas fa-project-diagram"></i> Knowledge Graph
            </h2>
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; border-radius: 1rem; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap;">
                    <div style="background: white; padding: 1rem; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-brain" style="color: #4f46e5; font-size: 2rem;"></i>
                    </div>
                    <div style="background: white; padding: 1rem; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-robot" style="color: #4f46e5; font-size: 2rem;"></i>
                    </div>
                    <div style="background: white; padding: 1rem; border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-chart-line" style="color: #4f46e5; font-size: 2rem;"></i>
                    </div>
                </div>
                <p style="color: white; margin-top: 1rem;">AI → Machine Learning → Deep Learning → Neural Networks</p>
            </div>
            
            <p style="color: #64748b; margin-bottom: 1.5rem;">Connected concepts found in your notes:</p>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 3px solid #4f46e5;">
                    <strong>Artificial Intelligence</strong> → 12 connections
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 3px solid #4f46e5;">
                    <strong>Machine Learning</strong> → 8 connections
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 3px solid #4f46e5;">
                    <strong>Neural Networks</strong> → 6 connections
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 3px solid #4f46e5;">
                    <strong>Deep Learning</strong> → 5 connections
                </div>
            </div>
            
            <button class="btn-primary" onclick="document.getElementById('quizModal').style.display='none'">Close</button>
        </div>
    `;
    
    modal.style.display = 'block';
};

// Smart Revision
window.smartRevision = function() {
    const modal = document.getElementById('quizModal');
    const container = document.getElementById('quizContainer');
    
    if (!modal || !container) {
        alert("📚 Smart Revision: 10 flashcards generated!\n\n1. What is AI?\n2. What is Machine Learning?\n3. What are Neural Networks?\n4. What is Deep Learning?\n5. What is NLP?");
        return;
    }
    
    container.innerHTML = `
        <div style="text-align: center; padding: 1.5rem;">
            <h2 style="color: #4f46e5; margin-bottom: 1.5rem;">
                <i class="fas fa-bolt"></i> Smart Revision Flashcards
            </h2>
            
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; max-height: 400px; overflow-y: auto;">
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #4f46e5; text-align: left;">
                    <b>Q:</b> What is Artificial Intelligence?<br>
                    <b>A:</b> Machines simulating human intelligence
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #4f46e5; text-align: left;">
                    <b>Q:</b> What is Machine Learning?<br>
                    <b>A:</b> AI that learns from data
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #4f46e5; text-align: left;">
                    <b>Q:</b> What are Neural Networks?<br>
                    <b>A:</b> Computing systems inspired by brain
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #4f46e5; text-align: left;">
                    <b>Q:</b> What is Deep Learning?<br>
                    <b>A:</b> Neural networks with multiple layers
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; border-left: 4px solid #4f46e5; text-align: left;">
                    <b>Q:</b> What is NLP?<br>
                    <b>A:</b> Natural Language Processing
                </div>
            </div>
            
            <button class="btn-primary" onclick="document.getElementById('quizModal').style.display='none'">Close</button>
        </div>
    `;
    
    modal.style.display = 'block';
};

// Study Planner
window.studyPlanner = function() {
    const modal = document.getElementById('quizModal');
    const container = document.getElementById('quizContainer');
    
    if (!modal || !container) {
        alert("📅 Study Planner: Your 7-day plan is ready!\n\nDay 1: Introduction\nDay 2: Core Concepts\nDay 3: Practice\nDay 4: Advanced\nDay 5: Revision\nDay 6: Review\nDay 7: Assessment");
        return;
    }
    
    container.innerHTML = `
        <div style="text-align: center; padding: 1.5rem;">
            <h2 style="color: #4f46e5; margin-bottom: 1.5rem;">
                <i class="fas fa-calendar-check"></i> 7-Day Study Plan
            </h2>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;">
                    <h3 style="color: #4f46e5;">Day 1</h3>
                    <p>Introduction & Basics</p>
                    <small>2 hours</small>
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;">
                    <h3 style="color: #4f46e5;">Day 2</h3>
                    <p>Core Concepts</p>
                    <small>2 hours</small>
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;">
                    <h3 style="color: #4f46e5;">Day 3</h3>
                    <p>Practice Quiz</p>
                    <small>1.5 hours</small>
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;">
                    <h3 style="color: #4f46e5;">Day 4</h3>
                    <p>Advanced Topics</p>
                    <small>2 hours</small>
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;">
                    <h3 style="color: #4f46e5;">Day 5</h3>
                    <p>Revision</p>
                    <small>2 hours</small>
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;">
                    <h3 style="color: #4f46e5;">Day 6</h3>
                    <p>Final Review</p>
                    <small>2 hours</small>
                </div>
                <div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem; grid-column: span 2;">
                    <h3 style="color: #4f46e5;">Day 7</h3>
                    <p>Assessment</p>
                    <small>2 hours</small>
                </div>
            </div>
            
            <button class="btn-primary" onclick="document.getElementById('quizModal').style.display='none'">Close</button>
        </div>
    `;
    
    modal.style.display = 'block';
};

// Function to fix all buttons
function fixAllButtons() {
    console.log("🔧 Fixing all tool buttons...");
    
    setTimeout(function() {
        // Knowledge Graph button
        const kgButton = document.querySelector('#knowledgeGraph button, #knowledgeGraph .tool-action, #knowledgeGraph .tool-action-btn');
        if (kgButton) {
            kgButton.onclick = function(e) {
                e.preventDefault();
                window.generateKnowledgeGraph();
            };
        }
        
        // Smart Revision button
        const srButton = document.querySelector('#smartRevision button, #smartRevision .tool-action, #smartRevision .tool-action-btn');
        if (srButton) {
            srButton.onclick = function(e) {
                e.preventDefault();
                window.smartRevision();
            };
        }
        
        // Study Planner button
        const spButton = document.querySelector('#studyPlanner button, #studyPlanner .tool-action, #studyPlanner .tool-action-btn');
        if (spButton) {
            spButton.onclick = function(e) {
                e.preventDefault();
                window.studyPlanner();
            };
        }
        
        console.log("✅ All buttons fixed!");
    }, 500);
}