// 1. GESTION DE LA CLÉ API
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');

if (!GEMINI_API_KEY) {
    GEMINI_API_KEY = prompt("🔑 Collez votre clé API Gemini (AIzaSy...) :");
    if (GEMINI_API_KEY) localStorage.setItem('gemini_api_key', GEMINI_API_KEY.trim());
}

// ✅ URL LA PLUS COMPATIBLE : v1beta + gemini-1.5-flash
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

let extractedText = "";

// 2. LECTURE DES DOCUMENTS (PDF/WORD)
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('upload-status-container').classList.remove('hidden');
    const fill = document.getElementById('upload-fill');

    try {
        fill.style.width = "50%";
        if (file.name.endsWith('.pdf')) {
            extractedText = await extractPDF(file);
        } else {
            extractedText = await extractWord(file);
        }
        fill.style.width = "100%";
        document.getElementById('btn-ai').disabled = false;
        document.getElementById('btn-ai').innerText = "🚀 ANALYSER MAINTENANT";
    } catch (err) {
        alert("Erreur de lecture du fichier.");
    }
};

// 3. APPEL À L'IA
window.processCourse = async () => {
    if (!extractedText) return;
    
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');

    // Prompt optimisé pour éviter les erreurs de format
    const promptText = `Agis en tant que professeur. Résume ce cours et crée un quiz de 5 questions. 
    Réponds UNIQUEMENT en JSON pur avec cette structure :
    {"titre":"...", "intro":"...", "points":["..."], "quiz":[{"q":"...", "correct":"...", "wrong":["..."]}]}
    Contenu : ${extractedText.substring(0, 10000)}`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        const data = await response.json();
        
        if (data.error) {
            // Affichage de l'erreur pour comprendre si c'est la clé ou le modèle
            throw new Error(`Erreur Google (${data.error.code}) : ${data.error.message}`);
        }

        const rawText = data.candidates[0].content.parts[0].text;
        
        // Sécurité : on cherche le premier '{' au cas où l'IA bavarde
        const start = rawText.indexOf('{');
        const end = rawText.lastIndexOf('}') + 1;
        const cleanJson = JSON.parse(rawText.substring(start, end));

        renderResults(cleanJson);
        document.getElementById('ia-fill').style.width = "100%";
    } catch (err) {
        console.error(err);
        alert("⚠️ " + err.message);
        document.getElementById('btn-ai').classList.remove('hidden');
    }
};

// 4. MOTEURS D'EXTRACTION
async function extractPDF(file) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let t = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const p = await pdf.getPage(i);
        const c = await p.getTextContent();
        t += c.items.map(it => it.str).join(" ") + " ";
    }
    return t;
}

async function extractWord(file) {
    const ab = await file.arrayBuffer();
    const r = await mammoth.extractRawText({ arrayBuffer: ab });
    return r.value;
}

// 5. AFFICHAGE
function renderResults(data) {
    document.getElementById('summary-result').innerHTML = `
        <h3>${data.titre}</h3>
        <p>${data.intro}</p>
        <ul>${data.points.map(p => `<li>${p}</li>`).join('')}</ul>`;

    let qHtml = "<h2>Quiz</h2>";
    data.quiz.forEach((q, i) => {
        qHtml += `<div class="quiz-card"><p><strong>${i+1}. ${q.q}</strong></p><div class="option correct">✅ ${q.correct}</div>${q.wrong.map(w => `<div class="option">❌ ${w}</div>`).join('')}</div>`;
    });
    document.getElementById('quiz-result').innerHTML = qHtml;
    document.getElementById('btn-result').classList.remove('hidden');
}

window.resetApiKey = () => { localStorage.removeItem('gemini_api_key'); location.reload(); };
window.showResults = () => document.getElementById('results-container').classList.remove('hidden');
