// 1. GESTION DE LA CLÉ API
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');

if (!GEMINI_API_KEY) {
    GEMINI_API_KEY = prompt("🔑 Collez votre clé API Gemini :");
    if (GEMINI_API_KEY) localStorage.setItem('gemini_api_key', GEMINI_API_KEY);
}

function resetApiKey() {
    localStorage.removeItem('gemini_api_key');
    location.reload();
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
let extractedText = "";

// 2. GESTION DE L'UPLOAD (DÉBLOQUÉ)
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('upload-status-container').classList.remove('hidden');
    const fill = document.getElementById('upload-fill');
    const perc = document.getElementById('upload-perc');

    try {
        fill.style.width = "30%"; 
        perc.innerText = "30% (Lecture...)";

        if (file.name.endsWith('.pdf')) {
            extractedText = await extractPDF(file);
        } else if (file.name.endsWith('.docx')) {
            extractedText = await extractWord(file);
        }

        fill.style.width = "100%";
        perc.innerText = "100% (Prêt)";
        document.getElementById('btn-ai').disabled = false;
        document.getElementById('btn-ai').innerText = "🚀 ANALYSER AVEC GEMINI";
    } catch (err) {
        console.error("Erreur lecture fichier:", err);
        alert("Erreur lors de la lecture du fichier.");
    }
};

// 3. ANALYSE IA GEMINI
window.processCourse = async () => {
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');

    const prompt = `Fais un résumé structuré et un quiz (30 questions max) en JSON pur. 
    Structure: {"titre":"","intro":"","points":[],"quiz":[{"q":"","correct":"","wrong":[]}]}
    Cours: ${extractedText.substring(0, 20000)}`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        
        // Nettoyage JSON
        const start = rawText.indexOf('{');
        const end = rawText.lastIndexOf('}') + 1;
        const cleanJson = JSON.parse(rawText.substring(start, end));

        renderResults(cleanJson);
        document.getElementById('ia-fill').style.width = "100%";
        document.getElementById('ia-perc').innerText = "100%";
    } catch (err) {
        alert("L'IA a rencontré un problème. Vérifiez votre clé ou réessayez.");
    }
};

// 4. FONCTIONS D'EXTRACTION
async function extractPDF(file) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let t = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        t += content.items.map(it => it.str).join(" ") + " ";
    }
    return t;
}

async function extractWord(file) {
    const ab = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: ab });
    return result.value;
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
        qHtml += `
            <div class="quiz-card">
                <p><strong>${i+1}. ${q.q}</strong></p>
                <div class="option correct">${q.correct}</div>
                ${q.wrong.map(w => `<div class="option">${w}</div>`).join('')}
            </div>`;
    });
    document.getElementById('quiz-result').innerHTML = qHtml;
    document.getElementById('btn-result').classList.remove('hidden');
}

window.showResults = () => document.getElementById('results-container').classList.remove('hidden');
