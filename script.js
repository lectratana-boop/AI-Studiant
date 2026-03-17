// 1. CONFIGURATION DE LA CLÉ
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');

if (!GEMINI_API_KEY) {
    GEMINI_API_KEY = prompt("🔑 Collez votre clé API Gemini (AIzaSy...) :");
    if (GEMINI_API_KEY) localStorage.setItem('gemini_api_key', GEMINI_API_KEY.trim());
}

// ✅ L'URL LA PLUS COMPATIBLE EN 2026 (v1beta + gemini-1.5-flash-latest)
// Le suffixe "-latest" débloque l'accès pour les clés qui reçoivent l'erreur "not found"
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

let extractedText = "";

// 2. EXTRACTION DU TEXTE (PDF/WORD)
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('upload-status-container').classList.remove('hidden');
    
    try {
        if (file.name.endsWith('.pdf')) {
            extractedText = await extractPDF(file);
        } else if (file.name.endsWith('.docx')) {
            extractedText = await extractWord(file);
        }
        document.getElementById('upload-fill').style.width = "100%";
        document.getElementById('upload-perc').innerText = "Fichier prêt !";
        document.getElementById('btn-ai').disabled = false;
        document.getElementById('btn-ai').innerText = "🚀 ANALYSER LE COURS";
    } catch (err) {
        alert("Erreur de lecture : " + err.message);
    }
};

// 3. ANALYSE IA GEMINI
window.processCourse = async () => {
    if (!extractedText) return;
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');

    const promptText = `Analyse ce cours et réponds UNIQUEMENT en JSON pur.
    Structure: {"titre":"","intro":"","points":[],"quiz":[{"q":"","correct":"","wrong":[]}]}
    Texte: ${extractedText.substring(0, 12000)}`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        const data = await response.json();
        
        // Si l'IA renvoie une erreur, on l'affiche proprement
        if (data.error) {
            console.error("Erreur Google détaillée:", data.error);
            alert(`Erreur Google (${data.error.code}) : ${data.error.message}`);
            document.getElementById('btn-ai').classList.remove('hidden');
            return;
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const start = rawText.indexOf('{');
        const end = rawText.lastIndexOf('}') + 1;
        const cleanJson = JSON.parse(rawText.substring(start, end));

        renderResults(cleanJson);
        document.getElementById('ia-fill').style.width = "100%";
        document.getElementById('ia-perc').innerText = "Terminé !";
    } catch (err) {
        alert("Problème technique : " + err.message);
        document.getElementById('btn-ai').classList.remove('hidden');
    }
};

// --- FONCTIONS TECHNIQUES (PDF.JS & MAMMOTH) ---
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
    document.getElementById('summary-result').innerHTML = `
        <div class="summary-chapter">
            <h3>${data.titre}</h3>
            <p>${data.intro}</p>
            <ul>${data.points.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>`;
    
    let qHtml = "<h2>❓ Quiz de Révision</h2>";
    data.quiz.forEach((q, i) => {
        qHtml += `<div class="quiz-card"><p><strong>${i+1}. ${q.q}</strong></p><div class="option correct">${q.correct}</div>${q.wrong.map(w => `<div class="option">${w}</div>`).join('')}</div>`;
    });
    document.getElementById('quiz-result').innerHTML = qHtml;
    document.getElementById('btn-result').classList.remove('hidden');
}

window.resetApiKey = () => { localStorage.removeItem('gemini_api_key'); location.reload(); };
window.showResults = () => document.getElementById('results-container').classList.remove('hidden');
