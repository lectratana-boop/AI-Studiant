// 🔑 METS TA CLE GEMINI ICI
const API_KEY = "COLLE_TA_CLE_GEMINI_ICI";

let uploadedText = "";

// ================= FILE READER =================

async function readFile(file) {
  if (file.type === "application/pdf") {
    return await readPDF(file);
  } else if (file.name.endsWith(".docx")) {
    return await readWord(file);
  } else {
    return await file.text();
  }
}

// PDF
async function readPDF(file) {
  const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    let page = await pdf.getPage(i);
    let content = await page.getTextContent();
    content.items.forEach(item => text += item.str + " ");
  }

  return text;
}

// WORD
async function readWord(file) {
  let result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

// ================= UPLOAD =================

async function uploadFile(e, el) {
  let file = e.target.files[0];
  if (!file) return;

  if (file.size > 500 * 1024 * 1024) {
    alert("Max 500Mo");
    return;
  }

  let progress = el.parentElement.querySelector(".progress");

  progress.innerText = "Lecture fichier...";

  uploadedText = await readFile(file);

  progress.innerText = "Fichier prêt ✔";

  el.parentElement.querySelector(".actions").innerHTML =
    `<button class="red" onclick="analyse(this)">Analyse</button>`;
}

// ================= GEMINI =================

async function callGemini(prompt) {
  let res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  let data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Erreur IA";
}

// ================= ANALYSE =================

async function analyse(btn) {
  let box = btn.parentElement.parentElement.querySelector(".resultBox");

  box.innerHTML = `<p class="loading">Analyse en cours...</p>`;

  let resumePrompt = `
  Résume ce cours de façon claire, structurée et éducative avec titres :
  ${uploadedText}
  `;

  let quizPrompt = `
  Crée un quiz de 10 questions avec 4 choix (1 correct, 3 faux) basé sur ce cours :
  ${uploadedText}
  `;

  try {
    let resume = await callGemini(resumePrompt);
    let quiz = await callGemini(quizPrompt);

    box.innerHTML = `
      <button class="green" onclick="showResume()">Résumé</button>
      <button class="green" onclick="showQuiz()">Quiz</button>

      <div id="resumeContent" class="hidden">${resume}</div>
      <div id="quizContent" class="hidden">${quiz}</div>
    `;
  } catch (e) {
    box.innerHTML = "Erreur API Gemini";
  }
}

// ================= DISPLAY =================

function showResume() {
  let res = document.getElementById("resumeContent");
  res.classList.toggle("hidden");
}

function showQuiz() {
  let quiz = document.getElementById("quizContent");
  quiz.classList.toggle("hidden");
}
