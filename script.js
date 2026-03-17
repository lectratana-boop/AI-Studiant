// --- SÉCURITÉ : GESTION DE LA CLÉ API ---
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');

if (!GEMINI_API_KEY) {
    GEMINI_API_KEY = prompt("🔑 Entrez votre clé API Gemini (elle sera stockée uniquement dans votre navigateur) :");
    if (GEMINI_API_KEY) {
        localStorage.setItem('gemini_api_key', GEMINI_API_KEY);
    }
}

function resetApiKey() {
    localStorage.removeItem('gemini_api_key');
    location.reload();
}
window.resetApiKey = resetApiKey;

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

let extractedText = "";

// --- EXTRACTION TEXTE ---
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('upload-status-container').classList.remove('hidden');
    let p = 0;
    const interval = setInterval(async () => {
        p += 10;
        document.getElementById('upload-fill').style.width = p + "%";
        document.getElementById('upload-perc').innerText = p + "%";
        if (p >= 100) {
            clearInterval(interval);
            extractedText = (file.name.endsWith('.pdf')) ? await extractPDF(file) : await extractWord(file);
            document.getElementById('btn-ai').disabled = false;
            document.getElementById('btn-ai').innerText = "🚀 ANALYSER AVEC GEMINI";
        }
    }, 50);
};

// --- APPEL API GEMINI ---
window.processCourse = async () => {
    if (!GEMINI_API_KEY) return resetApiKey();

    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');

    const prompt = `
        Agis comme un professeur expert. Analyse ce texte : "${extractedText.substring(0, 20000)}"
        1. Fais un résumé structuré par chapitres avec des listes à puces.
        2. Crée un quiz de 10 à 30 questions (QCM) avec une réponse correcte et deux fausses.
        Réponds UNIQUEMENT en JSON avec cette structure:
        { "titre": "", "intro": "", "points": ["",""], "quiz": [{"q":"","correct":"","wrong":["",""]}] }
    `;

    try {
        let prog = 0;
        const progInt = setInterval(() => { if(prog < 90) { prog++; updateIAUI(prog); }}, 100);

        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        const rawResponse = data.candidates[0].content.parts[0].text;
        const cleanJson = JSON.parse(rawResponse.replace(/```json|```/g, ""));

        clearInterval(progInt);
        updateIAUI(100);
        displayResults(cleanJson);

    } catch (err) {
        alert("Erreur : Clé API invalide ou problème de connexion.");
        resetApiKey();
    }
};

function updateIAUI(p) {
    document.getElementById('ia-fill').style.width = p + "%";
    document.getElementById('ia-perc').innerText = p + "%";
}

function displayResults(data) {
    document.getElementById('summary-result').innerHTML = `
        <div class="summary-chapter">
            <h3>Titre : ${data.titre}</h3>
            <p>${data.intro}</p>
            <ul>${data.points.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>`;

    let qHtml = "<h2>❓ Quiz Corrigé</h2>";
    data.quiz.forEach((q, i) => {
        qHtml += `
            <div class="quiz-card">
                <span class="quiz-question">${i+1}. ${q.q}</span>
                <div class="option correct">${q.correct}</div>
                ${q.wrong.map(w => `<div class="option">${w}</div>`).join('')}
            </div>`;
    });
    document.getElementById('quiz-result').innerHTML = qHtml;
    document.getElementById('btn-result').classList.remove('hidden');
}

async function extractPDF(file) {
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

window.showResults = () => document.getElementById('results-container').classList.remove('hidden');
