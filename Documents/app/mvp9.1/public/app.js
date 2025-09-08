// ---- Auth bits (simple) ----
const usernameEl = document.getElementById("username");
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const forgotBtn = document.getElementById("forgotBtn");
const authBadge = document.getElementById("authBadge");
const authMsg = document.getElementById("authMsg");

const startRecBtn = document.getElementById("startRec");
const stopRecBtn = document.getElementById("stopRec");
const scoreBtn = document.getElementById("scoreBtn");
const modelAnswerBtn = document.getElementById("modelAnswerBtn");
const improveBtn = document.getElementById("improveBtn");
const recStatus = document.getElementById("recStatus");

let authed = false;

function setAuthState(isAuthed, email) {
  authed = isAuthed;
  authBadge.textContent = isAuthed ? `Signed in as ${email}` : "Not signed in";
  logoutBtn.disabled = !isAuthed;
  startRecBtn.disabled = !isAuthed;
  stopRecBtn.disabled = !isAuthed;
  scoreBtn.disabled = !isAuthed;
  modelAnswerBtn.disabled = !isAuthed;
  improveBtn.disabled = !isAuthed;
  recStatus.textContent = isAuthed ? "Not recording" : "Sign in to record";
}

async function refreshMe() {
  try {
    const r = await fetch("/api/auth/me");
    const j = await r.json();
    if (j.user) setAuthState(true, j.user.email);
    else setAuthState(false, null);
  } catch { setAuthState(false, null); }
}
async function postJSON(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Request failed");
  return j;
}

registerBtn.addEventListener("click", async () => {
  try {
    registerBtn.disabled = true;
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    const username = usernameEl.value.trim();
    if (!email || !password || !username) return alert("Enter username, email, password.");
    const j = await postJSON("/api/auth/register", { email, password, username });
    setAuthState(true, j.user.email);
    authMsg.textContent = "Registered and signed in.";
  } catch (e) { alert(e.message || "Register failed."); }
  finally { registerBtn.disabled = false; }
});

loginBtn.addEventListener("click", async () => {
  try {
    loginBtn.disabled = true;
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    if (!email || !password) return alert("Enter email and password.");
    const j = await postJSON("/api/auth/login", { email, password });
    setAuthState(true, j.user.email);
    authMsg.textContent = "Signed in.";
  } catch (e) { alert(e.message || "Login failed."); }
  finally { loginBtn.disabled = false; }
});

logoutBtn.addEventListener("click", async () => {
  try {
    logoutBtn.disabled = true;
    await postJSON("/api/auth/logout", {});
    setAuthState(false, null);
    authMsg.textContent = "Signed out.";
  } catch (e) { alert(e.message || "Logout failed."); }
  finally { logoutBtn.disabled = false; }
});

forgotBtn.addEventListener("click", async () => {
  try {
    forgotBtn.disabled = true;
    const email = emailEl.value.trim();
    if (!email) return alert("Enter your email first, then click Forgot password.");
    await postJSON("/api/auth/request-password-reset", { email });
    alert("Password reset email sent. Check your inbox.");
  } catch (e) {
    alert(e.message || "Could not send reset email.");
  } finally { forgotBtn.disabled = false; }
});

// ---- App bits (unchanged) ----
const questionEl = document.getElementById("question");
const answerEl = document.getElementById("answer");
const cvEl = document.getElementById("cv");
const shuffleBtn = document.getElementById("shuffle");
const readQuestionBtn = document.getElementById("readQuestion");

const scorePill = document.getElementById("scorePill");
const bandEl = document.getElementById("band");
const summaryEl = document.getElementById("summary");
const strengthsEl = document.getElementById("strengths");
const improvementsEl = document.getElementById("improvements");
const modelAnswerEl = document.getElementById("modelAnswer");
const modelAnswerStatus = document.getElementById("modelAnswerStatus");
const followupsEl = document.getElementById("followups");

const improvedScorePill = document.getElementById("improvedScorePill");
const improvedAnswerEl = document.getElementById("improvedAnswer");
const improvedBandEl = document.getElementById("improvedBand");
const improvedSummaryEl = document.getElementById("improvedSummary");
const improvedStrengthsEl = document.getElementById("improvedStrengths");
const improvedImprovementsEl = document.getElementById("improvedImprovements");
const improvedFollowupsEl = document.getElementById("improvedFollowups");

const bank = [
  "Tell me about yourself.",
  "Why do you want this role?",
  "Describe a time you solved a difficult problem.",
  "What is a recent challenge you overcame and what did you learn?"
];
shuffleBtn.addEventListener("click", () => {
  questionEl.value = bank[Math.floor(Math.random() * bank.length)];
});

readQuestionBtn.addEventListener("click", async () => {
  try {
    readQuestionBtn.disabled = true;
    const q = encodeURIComponent(questionEl.value.trim());
    const audio = new Audio(`/api/tts?text=${q}&voice=alloy`);
    await audio.play();
  } catch (e) { alert("Could not play audio. " + (e.message || e)); }
  finally { readQuestionBtn.disabled = false; }
});

function resetCurrent() {
  scorePill.style.display = "none"; scorePill.textContent = "";
  bandEl.textContent = ""; summaryEl.textContent = "";
  strengthsEl.innerHTML = ""; improvementsEl.innerHTML = "";
  modelAnswerEl.innerHTML = "Click \"Get Model Answer\" to see an exemplar response";
  modelAnswerStatus.style.display = "none";
  followupsEl.innerHTML = "";
}
function resetImproved() {
  improvedScorePill.style.display = "none"; improvedScorePill.textContent = "";
  improvedAnswerEl.textContent = ""; improvedBandEl.textContent = "";
  improvedSummaryEl.textContent = ""; improvedStrengthsEl.innerHTML = "";
  improvedImprovementsEl.innerHTML = ""; improvedFollowupsEl.innerHTML = "";
}
function renderScoring(data, improved=false) {
  const scoreEl = improved ? improvedScorePill : scorePill;
  const bandOut = improved ? improvedBandEl : bandEl;
  const summaryOut = improved ? improvedSummaryEl : summaryEl;
  const strengthsOut = improved ? improvedStrengthsEl : strengthsEl;
  const improvementsOut = improved ? improvedImprovementsEl : improvementsEl;
  const modelOut = improved ? null : modelAnswerEl;
  const followOut = improved ? improvedFollowupsEl : followupsEl;
  if (!improved) resetCurrent(); else resetImproved();
  
  // Enhanced score display with color coding
  if (typeof data?.score === "number") { 
    scoreEl.style.display = "inline-block"; 
    scoreEl.textContent = `Score: ${data.score}/100`;
    // Color code based on score
    if (data.score >= 80) scoreEl.style.background = "#dcfce7"; // green
    else if (data.score >= 60) scoreEl.style.background = "#fef3c7"; // yellow
    else if (data.score >= 40) scoreEl.style.background = "#fed7aa"; // orange
    else scoreEl.style.background = "#fecaca"; // red
  }
  
  // Enhanced band display
  bandOut.textContent = data?.band ? `Band: ${data.band}` : "";
  if (data?.band) {
    const bandColors = {
      'Outstanding': '#16a34a',
      'Strong': '#22c55e', 
      'Mixed': '#f59e0b',
      'Weak': '#ef4444',
      'Poor': '#dc2626',
      'Developing': '#f97316'
    };
    bandOut.style.color = bandColors[data.band] || '#64748b';
    bandOut.style.fontWeight = '700';
  }
  
  // Enhanced summary with better formatting
  summaryOut.innerHTML = data?.summary ? `<strong>Assessment:</strong> ${data.summary}` : "";
  
  // Enhanced strengths with better formatting
  (data?.strengths || []).forEach((s, i) => { 
    const li = document.createElement("li"); 
    li.innerHTML = `<strong>✓</strong> ${s}`;
    li.style.color = '#059669';
    li.style.marginBottom = '4px';
    strengthsOut.appendChild(li); 
  });
  
  // Enhanced improvements with actionable language and priority
  (data?.improvements || []).forEach((s, i) => { 
    const li = document.createElement("li"); 
    const priority = i === 0 ? '🔥 Priority: ' : i === 1 ? '📈 Important: ' : '💡 Consider: ';
    li.innerHTML = `${priority}<strong>${s}</strong>`;
    li.style.color = i === 0 ? '#dc2626' : i === 1 ? '#f59e0b' : '#64748b';
    li.style.marginBottom = '6px';
    improvementsOut.appendChild(li); 
  });
  
  // Model answer placeholder (will be loaded separately)
  if (modelOut && !improved) {
    modelOut.innerHTML = '<em style="color: #64748b;">Loading model answer...</em>';
    loadModelAnswer();
  }
  
  // Enhanced follow-up questions with better formatting
  (data?.followup_questions || []).forEach((s, i) => { 
    const li = document.createElement("li"); 
    li.innerHTML = `<strong>Q${i+1}:</strong> ${s}`;
    li.style.marginBottom = '8px';
    li.style.paddingLeft = '8px';
    li.style.borderLeft = '3px solid #6366f1';
    followOut.appendChild(li); 
  });
}

// Manual score with enhanced feedback
scoreBtn.addEventListener("click", async () => {
  if (!authed) return alert("Please sign in first.");
  const question = questionEl.value.trim();
  const answer = answerEl.value.trim();
  const cvText = cvEl.value.trim();
  if (!question || !answer) return alert("Please provide both a question and an answer.");
  
  // Show loading state
  scoreBtn.disabled = true;
  scoreBtn.textContent = '⏳ Analyzing...';
  resetCurrent();
  
  try {
    const r = await fetch("/api/score", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, answer, cvText: cvText || undefined }) });
    const j = await r.json(); 
    if (!r.ok) return alert(j.error || "Server error");
    renderScoring(j, false);
  } catch (e) {
    alert('Analysis failed: ' + (e.message || 'Network error'));
  } finally {
    scoreBtn.disabled = false;
    scoreBtn.textContent = 'Score current answer';
  }
});

// Load model answer function
async function loadModelAnswer() {
  if (!authed) return;
  const question = questionEl.value.trim();
  const cvText = cvEl.value.trim();
  if (!question) return;
  
  try {
    const r = await fetch("/api/model-answer", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ question, cvText: cvText || undefined }) 
    });
    const j = await r.json(); 
    if (!r.ok) {
      modelAnswerEl.innerHTML = '<em style="color: #dc2626;">Failed to load model answer</em>';
      return;
    }
    
    // Display model answer with enhanced formatting
    const modelText = j.answer || 'No model answer available';
    const modelScoring = j.scoring;
    
    let formattedAnswer = `<div style="background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #22c55e;">`;
    formattedAnswer += `<div style="font-weight: 600; color: #16a34a; margin-bottom: 8px;">★ Model Answer (Score: ${modelScoring?.score || 'N/A'}/100)</div>`;
    formattedAnswer += `<div style="line-height: 1.6;">${modelText}</div>`;
    formattedAnswer += `</div>`;
    
    if (modelScoring?.strengths?.length > 0) {
      formattedAnswer += `<div style="margin-top: 12px;"><strong>Key Techniques:</strong></div>`;
      formattedAnswer += `<ul style="margin: 4px 0; color: #059669;">`;
      modelScoring.strengths.forEach(strength => {
        formattedAnswer += `<li style="margin-bottom: 2px;">✓ ${strength}</li>`;
      });
      formattedAnswer += `</ul></div>`;
    }
    
    modelAnswerEl.innerHTML = formattedAnswer;
    modelAnswerStatus.style.display = "inline-block";
    modelAnswerStatus.textContent = "AI-Generated";
  } catch (e) {
    modelAnswerEl.innerHTML = '<em style="color: #dc2626;">Failed to load model answer</em>';
    modelAnswerStatus.style.display = "none";
  }
}

// Standalone model answer button
modelAnswerBtn.addEventListener("click", async () => {
  if (!authed) return alert("Please sign in first.");
  const question = questionEl.value.trim();
  if (!question) return alert("Please select or enter a question first.");
  
  modelAnswerBtn.disabled = true;
  modelAnswerBtn.textContent = '📋 Loading...';
  modelAnswerEl.innerHTML = '<em style="color: #64748b;">Generating model answer...</em>';
  
  try {
    await loadModelAnswer();
  } finally {
    modelAnswerBtn.disabled = false;
    modelAnswerBtn.textContent = '📋 Get Model Answer';
  }
});

// Enhanced improve & rescore with better UX
improveBtn.addEventListener("click", async () => {
  if (!authed) return alert("Please sign in first.");
  const question = questionEl.value.trim();
  const answer = answerEl.value.trim();
  const cvText = cvEl.value.trim();
  if (!question || !answer) return alert("Please provide both a question and an answer.");
  
  improveBtn.disabled = true;
  improveBtn.textContent = '✨ Generating...';
  resetImproved();
  
  try {
    const r = await fetch("/api/improve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, answer, cvText: cvText || undefined }) });
    const j = await r.json(); 
    if (!r.ok) return alert(j.error || "Server error");
    improvedAnswerEl.textContent = j.improved_answer || "";
    renderScoring(j.improved_scoring, true);
  } catch (e) {
    alert('Improvement failed: ' + (e.message || 'Network error'));
  } finally {
    improveBtn.disabled = false;
    improveBtn.textContent = '✨ Improve & Rescore';
  }
});

// Recording (single file)
let mediaRecorder = null, chunks = [], streamRef = null;
function pickMime() {
  const c = ["audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus","audio/ogg"];
  for (const t of c) if (MediaRecorder.isTypeSupported(t)) return t; return "";
}
async function startRecording() {
  if (!authed) return alert("Please sign in first.");
  try {
    streamRef = await navigator.mediaDevices.getUserMedia({ audio:true });
    const mimeType = pickMime();
    mediaRecorder = new MediaRecorder(streamRef, mimeType ? { mimeType } : undefined);
    chunks = [];
    let recordingStartTime = null;
    
    mediaRecorder.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
    
    mediaRecorder.onstart = () => { 
      recordingStartTime = Date.now();
      recStatus.textContent = "🎤 Recording... (speak clearly)"; 
      recStatus.style.color = '#dc2626';
      resetCurrent(); 
      resetImproved(); 
      
      // Show real-time timer
      const timer = setInterval(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
          recStatus.textContent = `🎤 Recording... ${elapsed}s (speak clearly)`;
        } else {
          clearInterval(timer);
        }
      }, 1000);
    };
    
    mediaRecorder.onstop = async () => {
      recStatus.textContent = "📝 Transcribing and analyzing...";
      recStatus.style.color = '#f59e0b';
      
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType || "audio/webm" });
      const fd = new FormData();
      fd.append("audio", blob, "answer.webm");
      fd.append("question", questionEl.value.trim());
      fd.append("cvText", cvEl.value.trim());
      fd.append("persona", "medical"); // You can make this dynamic
      
      try {
        const r = await fetch("/api/transcribe-fast", { method: "POST", body: fd });
        const j = await r.json(); 
        if (!r.ok) { 
          recStatus.textContent = "❌ Analysis failed"; 
          recStatus.style.color = '#dc2626';
          return alert(j.error || "Transcription error"); 
        }
        
        answerEl.value = j.transcript || ""; 
        renderScoring(j.scoring, false); 
        recStatus.textContent = "✓ Complete! Analysis ready";
        recStatus.style.color = '#059669';
        
        // Show word count feedback
        const wordCount = (j.transcript || '').trim().split(/\s+/).length;
        if (wordCount < 20) {
          recStatus.textContent += ` (${wordCount} words - consider adding more detail)`;
          recStatus.style.color = '#f59e0b';
        } else if (wordCount > 200) {
          recStatus.textContent += ` (${wordCount} words - well detailed!)`;
        } else {
          recStatus.textContent += ` (${wordCount} words - good length)`;
        }
        
        // Check for detailed results in background
        if (j.processingId) {
          setTimeout(() => checkDetailedResults(j.processingId), 2000);
        }
        
      } catch (e) {
        recStatus.textContent = "❌ Network error";
        recStatus.style.color = '#dc2626';
        alert('Recording analysis failed: ' + (e.message || 'Network error'));
      }
      
      if (streamRef) { streamRef.getTracks().forEach(t=>t.stop()); streamRef=null; }
    };
    
    mediaRecorder.start();
    startRecBtn.disabled = true; stopRecBtn.disabled = false;
  } catch (e) { 
    recStatus.textContent = "❌ Microphone access failed";
    recStatus.style.color = '#dc2626';
    alert("Mic error: " + (e.message || e)); 
  }
}

// Check for detailed results from background processing
async function checkDetailedResults(processingId) {
  try {
    const r = await fetch(`/api/detailed-results/${processingId}`);
    if (r.ok) {
      const j = await r.json();
      if (j.scoring) {
        // Update with more detailed scoring if available
        renderScoring(j.scoring, false);
        recStatus.textContent = "✓ Enhanced analysis complete!";
        recStatus.style.color = '#059669';
      }
    }
  } catch (e) {
    // Silently fail - detailed results are optional enhancement
  }
}
function stopRecording() {
  try { if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop(); }
  finally { startRecBtn.disabled = false; stopRecBtn.disabled = true; }
}
document.getElementById("startRec").addEventListener("click", startRecording);
document.getElementById("stopRec").addEventListener("click", stopRecording);

refreshMe();
