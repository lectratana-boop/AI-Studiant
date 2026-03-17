// --- 1. SÉCURITÉ ET CLÉ API ---
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');

// Si pas de clé, on la demande et on l'enregistre
if (!GEMINI_API_KEY) {
    GEMINI_API_KEY = prompt("🔑 Collez votre clé API Gemini (AIzaSy...) :");
    if (GEMINI_API_KEY) {
        localStorage.setItem('gemini_api_key', GEMINI_API_KEY.trim());
    }
}

// Fonction pour changer de clé si besoin (via l'icône clé de l'HTML)
window.resetApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    location.reload();
};

// --- 2. CONFIGURATION DE L'URL ---
// Note : Le ":" avant generateContent est OBLIGATOIRE pour éviter l'erreur 404
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

let extractedText = "";

// --- 3. GESTION DE L'EXTRACTION DES FICHIERS ---
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fill = document.getElementById('upload-fill');
    const perc = document.getElementById('upload-perc');
    document.getElementById('upload-status-container').classList.remove('hidden');

    try {
        fill.style.width = "40%";
        perc.innerText = "40% (Lecture...)";

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
        console.error("Erreur de lecture :", err);
        alert("Impossible de lire ce fichier. Vérifiez le format.");
    }
};

// --- 4. APPEL À L'IA GEMINI ---
window.processCourse = async () => {
    if (!extractedText) return alert("Veuillez d'abord charger un fichier.");
    
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');
    
    // On simule une progression visuelle
    let prog = 0;
    const interval = setInterval(() => {
        if(prog < 90) {
            prog += 1;
            document.getElementById('ia-fill').style.width = prog + "%";
            document.getElementById('ia-perc').innerText = prog + "%";
        }
    }, 150);

    const promptText = `Tu es un assistant pédagogique. Analyse ce cours : "${extractedText.substring(0, 15000)}".
    Génère un résumé structuré et un quiz de 10 à 20 questions.
    Réponds UNIQUEMENT au format JSON suivant :
    {
      "titre": "Titre du cours",
      "intro": "Résumé global",
      "points": ["Idée 1", "Idée 2"],
      "quiz": [{"q": "Question", "correct": "Réponse Juste", "wrong": ["Faux1", "Faux2"]}]
    }`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        // Gestion précise des erreurs HTTP (404, 403, etc.)
        if (!response.ok) {
            const errorInfo = await response.json();
            throw new Error(errorInfo.error?.message || `Erreur ${response.status}`);
        }

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        
        // Nettoyage du JSON (au cas où l'IA ajoute des balises ```json)
        const jsonStart = rawText.indexOf('{');
        const jsonEnd = rawText.lastIndexOf('}') + 1;
        const cleanJson = JSON.parse(rawText.substring(jsonStart, jsonEnd));

        clearInterval(interval);
        document.getElementById('ia-fill').style.width = "100%";
        document.getElementById('ia-perc').innerText = "100%";
        
        displayResults(cleanJson);
    } catch (err) {
        clearInterval(interval);
        console.error("Détails erreur IA :", err);
        alert("Erreur : " + err.message + ". Vérifiez votre clé ou votre connexion.");
        document.getElementById('btn-ai').classList.remove('hidden');
    }
};

// --- 5. AFFICHAGE DES RÉSULTATS ---
function displayResults(data) {
    const summaryDiv = document.getElementById('summary-result');
    const quizDiv = document.getElementById('quiz-result');

    summaryDiv.innerHTML = `
        <div class="summary-chapter">
            <h3>${data.titre}</h3>
            <p>${data.intro}</p>
            <ul>${data.points.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>
    `;

    let quizHtml = "<h2>❓ Quiz Corrigé</h2>";
    data.quiz.forEach((q, i) => {
        quizHtml += `
            <div class="quiz-card">
                <p><strong>${i+1}. ${q.q}</strong></p>
                <div class="option correct">${q.correct}</div>
                ${q.wrong.map(w => `<div class="option">${w}</div>`).join('')}
            </div>
        `;
    });
    quizDiv.innerHTML = quizHtml;
    document.getElementById('btn-result').classList.remove('hidden');
}

// --- 6. FONCTIONS TECHNIQUES (PDF & WORD) ---
async function extractPDF(file) {
    // Correctif pour PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = '[https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js](https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js)';
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(it => it.str).join(" ") + " ";
    }
    return text;
}

async function extractWord(file) {
    const ab = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: ab });
    return result.value;
}

window.showResults = () => document.getElementById('results-container').classList.remove('hidden');
