// 1. RÉCUPÉRATION DE VOTRE NOUVELLE CLÉ
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');

// Si pas de clé, on demande celle que vous venez de créer (Mars 18, 2026)
if (!GEMINI_API_KEY) {
    GEMINI_API_KEY = prompt("🔑 Collez votre NOUVELLE clé (celle du 18 Mars) :");
    if (GEMINI_API_KEY) localStorage.setItem('gemini_api_key', GEMINI_API_KEY.trim());
}

// ✅ L'URL LA PLUS COMPATIBLE POUR LE "FREE TIER" (Mars 2026)
// On utilise v1beta car c'est celle qui accepte le mieux les nouvelles clés gratuites
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

let extractedText = "";

// 2. LECTURE DES FICHIERS (PDF/WORD)
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('upload-status-container').classList.remove('hidden');
    try {
        if (file.name.endsWith('.pdf')) {
            extractedText = await extractPDF(file);
        } else {
            extractedText = await extractWord(file);
        }
        document.getElementById('upload-fill').style.width = "100%";
        document.getElementById('btn-ai').disabled = false;
        document.getElementById('btn-ai').innerText = "🚀 ANALYSER LE COURS";
    } catch (err) { alert("Erreur de lecture du fichier"); }
};

// 3. APPEL IA SÉCURISÉ
window.processCourse = async () => {
    if (!extractedText) return;
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');

    const payload = {
        contents: [{
            parts: [{ text: `Fais un résumé structuré et un quiz JSON : ${extractedText.substring(0, 10000)}` }]
        }]
    };

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.error) {
            // Affiche l'erreur si elle persiste pour comprendre pourquoi
            alert("RÉPONSE GOOGLE : " + data.error.message);
            document.getElementById('btn-ai').classList.remove('hidden');
            return;
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const start = rawText.indexOf('{');
        const end = rawText.lastIndexOf('}') + 1;
        renderResults(JSON.parse(rawText.substring(start, end)));
        document.getElementById('ia-fill').style.width = "100%";

    } catch (err) {
        alert("Erreur technique : " + err.message);
        document.getElementById('btn-ai').classList.remove('hidden');
    }
};

// --- FONCTIONS TECHNIQUES ---
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

function renderResults(data) {
    document.getElementById('summary-result').innerHTML = `<h3>${data.titre}</h3><p>${data.intro}</p>`;
    let qHtml = "<h2>Quiz</h2>";
    data.quiz.forEach((q, i) => {
        qHtml += `<div class="quiz-card"><p>${i+1}. ${q.q}</p><div class="option correct">✅ ${q.correct}</div></div>`;
    });
    document.getElementById('quiz-result').innerHTML = qHtml;
    document.getElementById('btn-result').classList.remove('hidden');
}

window.resetApiKey = () => { localStorage.removeItem('gemini_api_key'); location.reload(); };
window.showResults = () => document.getElementById('results-container').classList.remove('hidden');
