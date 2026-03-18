// 1. CONFIGURATION
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

let extractedText = "";

// Fonction pour animer les barres de progression
function updateBar(id, percId, value) {
    document.getElementById(id).style.width = value + "%";
    document.getElementById(percId).innerText = value + "%";
}

// 2. LECTURE ULTRA-RAPIDE
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('upload-status-container').classList.remove('hidden');
    updateBar('upload-fill', 'upload-perc', 10);

    try {
        updateBar('upload-fill', 'upload-perc', 30);
        if (file.name.endsWith('.pdf')) {
            extractedText = await extractPDF(file);
        } else {
            extractedText = await extractWord(file);
        }
        
        updateBar('upload-fill', 'upload-perc', 100);
        document.getElementById('btn-ai').disabled = false;
        document.getElementById('btn-ai').style.opacity = "1";
    } catch (err) {
        alert("Erreur de lecture du fichier.");
    }
};

// 3. ANALYSE GEMINI AVEC PROGRESSION SIMULÉE
window.processCourse = async () => {
    if (!extractedText) return;
    
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');

    // Simulation de progression pour l'IA (pendant l'appel réseau)
    let progress = 0;
    const interval = setInterval(() => {
        if (progress < 90) {
            progress += 5;
            updateBar('ia-fill', 'ia-perc', progress);
        }
    }, 400);

    const promptText = `Tu es un expert en pédagogie. Analyse ce cours et génère un résumé structuré et un quiz de 5 questions.
    Réponds UNIQUEMENT en JSON pur avec cette structure précise :
    {"titre":"...", "intro":"...", "points":["..."], "quiz":[{"q":"...", "correct":"...", "wrong":["..."]}]}
    Contenu : ${extractedText.substring(0, 20000)}`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        const data = await response.json();
        clearInterval(interval); // On arrête la simulation

        if (data.error) throw new Error(data.error.message);

        const rawText = data.candidates[0].content.parts[0].text;
        
        // Nettoyage et Parsing sécurisé
        const start = rawText.indexOf('{');
        const end = rawText.lastIndexOf('}') + 1;
        const jsonContent = JSON.parse(rawText.substring(start, end));

        updateBar('ia-fill', 'ia-perc', 100);
        renderResults(jsonContent);

    } catch (err) {
        clearInterval(interval);
        console.error(err);
        alert("Erreur d'analyse IA. Vérifiez votre connexion.");
        document.getElementById('btn-ai').classList.remove('hidden');
    }
};

// 4. MOTEURS D'EXTRACTION (PDF/WORD)
async function extractPDF(file) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let t = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const p = await pdf.getPage(i);
        const c = await p.getTextContent();
        t += c.items.map(it => it.str).join(" ") + " ";
        // Mise à jour de la barre pendant la lecture des pages
        updateBar('upload-fill', 'upload-perc', Math.round((i / pdf.numPages) * 100));
    }
    return t;
}

async function extractWord(file) {
    const ab = await file.arrayBuffer();
    const r = await mammoth.extractRawText({ arrayBuffer: ab });
    return r.value;
}

// 5. RENDU DU RÉSUMÉ ET DU QUIZ (SÉCURISÉ)
function renderResults(data) {
    const summaryDiv = document.getElementById('summary-result');
    const quizDiv = document.getElementById('quiz-result');

    // Affichage du résumé
    summaryDiv.innerHTML = `
        <div style="background: rgba(99, 102, 241, 0.1); padding: 15px; border-radius: 10px; border-left: 4px solid #6366f1;">
            <h3 style="color: #818cf8;">${data.titre || "Résumé du cours"}</h3>
            <p style="margin: 10px 0;">${data.intro || ""}</p>
            <ul style="padding-left: 20px;">
                ${(data.points || []).map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
            </ul>
        </div>
    `;

    // Affichage du quiz
    let qHtml = "<h2 style='margin-top:20px;'>📝 Auto-Évaluation</h2>";
    (data.quiz || []).forEach((q, i) => {
        qHtml += `
            <div class="quiz-card" style="background: #1e293b; padding: 15px; border-radius: 10px; margin-top: 15px;">
                <p><strong>${i+1}. ${q.q}</strong></p>
                <div style="color: #4ade80; margin-top: 5px;">✅ ${q.correct}</div>
                ${(q.wrong || []).map(w => `<div style="color: #94a3b8; font-size: 0.9em;">❌ ${w}</div>`).join('')}
            </div>
        `;
    });
    quizDiv.innerHTML = qHtml;
    document.getElementById('btn-result').classList.remove('hidden');
}

window.resetApiKey = () => { localStorage.removeItem('gemini_api_key'); location.reload(); };
window.showResults = () => document.getElementById('results-container').classList.remove('hidden');
