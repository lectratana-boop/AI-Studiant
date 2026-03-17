// --- SÉCURITÉ : RÉCUPÉRATION DE LA CLÉ ---
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');

if (!GEMINI_API_KEY) {
    GEMINI_API_KEY = prompt("🔑 Entrez votre clé API Gemini :");
    if (GEMINI_API_KEY) localStorage.setItem('gemini_api_key', GEMINI_API_KEY);
}

// URL corrigée pour le modèle 1.5 Flash
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

let extractedText = "";

// --- GESTION FICHIERS ---
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('upload-status-container').classList.remove('hidden');
    
    // Extraction simplifiée pour le test
    extractedText = (file.name.endsWith('.pdf')) ? await extractPDF(file) : await extractWord(file);
    
    document.getElementById('upload-fill').style.width = "100%";
    document.getElementById('btn-ai').disabled = false;
    document.getElementById('btn-ai').innerText = "🚀 ANALYSER AVEC GEMINI";
};

// --- ANALYSE IA (CORRIGÉE) ---
window.processCourse = async () => {
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');

    const prompt = `Analyse ce cours et réponds UNIQUEMENT en JSON. 
    Structure: {"titre":"...", "intro":"...", "points":["pt1","pt2"], "quiz":[{"q":"...", "correct":"...", "wrong":["w1","w2"]}]}
    Texte: ${extractedText.substring(0, 15000)}`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        const rawResponse = data.candidates[0].content.parts[0].text;
        
        // --- NETTOYAGE MIRACLE DU JSON ---
        // Cette ligne cherche le premier '{' et le dernier '}' pour ignorer le texte inutile de l'IA
        const jsonStart = rawResponse.indexOf('{');
        const jsonEnd = rawResponse.lastIndexOf('}') + 1;
        const cleanJson = JSON.parse(rawResponse.substring(jsonStart, jsonEnd));

        renderResults(cleanJson);
        document.getElementById('ia-fill').style.width = "100%";
    } catch (err) {
        console.error(err);
        alert("L'IA a fait une erreur de lecture. Cliquez à nouveau sur Analyser.");
    }
};

function renderResults(data) {
    document.getElementById('summary-result').innerHTML = `
        <div class="summary-chapter">
            <h3>${data.titre}</h3>
            <p>${data.intro}</p>
            <ul>${data.points.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>`;

    let qHtml = "<h2>❓ Quiz de Révision</h2>";
    data.quiz.forEach((q, i) => {
        qHtml += `
            <div class="quiz-card">
                <span class="quiz-question">${i+1}. ${q.q}</span>
                <div class="option correct">${q.correct}</div>
                <div class="option">${q.wrong[0]}</div>
                <div class="option">${q.wrong[1]}</div>
            </div>`;
    });
    document.getElementById('quiz-result').innerHTML = qHtml;
    document.getElementById('btn-result').classList.remove('hidden');
}

// Gardez vos fonctions extractPDF et extractWord habituelles ici...
