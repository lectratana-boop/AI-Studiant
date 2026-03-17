// 1. CONFIGURATION DE LA CLÉ ET DE L'URL
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');

if (!GEMINI_API_KEY) {
    GEMINI_API_KEY = prompt("🔑 Collez votre clé API Gemini (AIzaSy...) :");
    if (GEMINI_API_KEY) localStorage.setItem('gemini_api_key', GEMINI_API_KEY.trim());
}

// ✅ UTILISATION DE LA VERSION STABLE v1 (Évite l'erreur 404 de v1beta)
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

let extractedText = "";

// 2. GESTION DE L'UPLOAD (Correction du blocage à 0%)
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fill = document.getElementById('upload-fill');
    const perc = document.getElementById('upload-perc');
    document.getElementById('upload-status-container').classList.remove('hidden');

    try {
        fill.style.width = "50%";
        perc.innerText = "Lecture du fichier...";

        if (file.name.endsWith('.pdf')) {
            extractedText = await extractPDF(file);
        } else if (file.name.endsWith('.docx')) {
            extractedText = await extractWord(file);
        }

        fill.style.width = "100%";
        perc.innerText = "Prêt pour l'IA";
        document.getElementById('btn-ai').disabled = false;
        document.getElementById('btn-ai').innerText = "🚀 ANALYSER LE COURS";
    } catch (err) {
        console.error("Erreur lecture:", err);
        alert("Impossible de lire ce fichier.");
    }
};

// 3. APPEL À L'IA (Correction du format JSON)
window.processCourse = async () => {
    if (!extractedText) return;
    
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');

    const promptText = `Tu es un assistant pédagogique. Analyse le texte suivant et génère un résumé détaillé ainsi qu'un quiz de 10 questions. 
    Réponds EXCLUSIVEMENT au format JSON suivant, sans texte avant ou après :
    {"titre":"...", "intro":"...", "points":["..."], "quiz":[{"q":"...", "correct":"...", "wrong":["..."]}]}
    Texte du cours : ${extractedText.substring(0, 15000)}`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        const rawText = data.candidates[0].content.parts[0].text;
        
        // Nettoyage de la réponse (enlève les balises ```json)
        const jsonStart = rawText.indexOf('{');
        const jsonEnd = rawText.lastIndexOf('}') + 1;
        const cleanJson = JSON.parse(rawText.substring(jsonStart, jsonEnd));

        renderResults(cleanJson);
        document.getElementById('ia-fill').style.width = "100%";
        document.getElementById('ia-perc').innerText = "Terminé";
    } catch (err) {
        console.error("Erreur IA:", err);
        alert("L'IA a répondu avec une erreur : " + err.message);
        document.getElementById('btn-ai').classList.remove('hidden');
    }
};

// 4. FONCTIONS D'EXTRACTION (PDF.js et Mammoth)
async function extractPDF(file) {
    // Configuration obligatoire pour PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = '[https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js](https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js)';
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
