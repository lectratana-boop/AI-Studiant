// 1. CONFIGURATION (Clé du 18 Mars détectée)
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');
// ✅ NOM DU MODÈLE VÉRIFIÉ SUR VOTRE CONSOLE GOOGLE
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

let extractedText = "";

// 2. FONCTION DE LECTURE DÉBLOQUÉE
// Assurez-vous que votre <input type="file"> a l'id "fileInput"
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput'); // Vérifiez cet ID dans votre HTML
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
});

async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    console.log("Fichier reçu :", file.name);
    
    // Mise à jour visuelle immédiate
    const statusContainer = document.getElementById('upload-status-container');
    if(statusContainer) statusContainer.classList.remove('hidden');
    updateBar('upload-fill', 'upload-perc', 10);

    try {
        if (file.name.endsWith('.pdf')) {
            extractedText = await extractPDF(file);
        } else {
            extractedText = await extractWord(file);
        }
        
        console.log("Texte extrait avec succès");
        updateBar('upload-fill', 'upload-perc', 100);
        
        // Activation du bouton d'analyse
        const btnAi = document.getElementById('btn-ai');
        if(btnAi) {
            btnAi.disabled = false;
            btnAi.innerText = "🚀 ANALYSER LE COURS";
            btnAi.style.background = "#6366f1";
        }
    } catch (err) {
        console.error("Erreur de lecture :", err);
        alert("Impossible de lire ce fichier.");
    }
}

// 3. ANALYSE IA (Modèle 2.5 Flash)
window.processCourse = async () => {
    if (!extractedText) return;
    
    const iaContainer = document.getElementById('ia-detail-container');
    if(iaContainer) iaContainer.classList.remove('hidden');
    
    updateBar('ia-fill', 'ia-perc', 30);

    const promptText = `Tu es un professeur expert. Analyse ce texte sur le climat. 
    Fais un résumé structuré et un quiz de 3 questions. 
    Réponds UNIQUEMENT en JSON : {"titre":"", "intro":"", "points":[], "quiz":[{"q":"", "correct":"", "wrong":[]}]}
    Texte : ${extractedText.substring(0, 10000)}`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        updateBar('ia-fill', 'ia-perc', 100);
        const rawText = data.candidates[0].content.parts[0].text;
        const json = JSON.parse(rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1));
        renderResults(json);
    } catch (err) {
        alert("Erreur Gemini : " + err.message);
    }
};

// --- UTILITAIRES ---
function updateBar(id, percId, value) {
    const bar = document.getElementById(id);
    const text = document.getElementById(percId);
    if(bar) bar.style.width = value + "%";
    if(text) text.innerText = value + "%";
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

function renderResults(data) {
    document.getElementById('summary-result').innerHTML = `<h2>${data.titre}</h2><p>${data.intro}</p>`;
    document.getElementById('btn-result').classList.remove('hidden');
}
