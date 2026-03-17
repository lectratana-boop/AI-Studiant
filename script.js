// --- 1. CONFIGURATION DE LA CLÉ ---
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');

if (!GEMINI_API_KEY) {
    GEMINI_API_KEY = prompt("🔑 Collez votre clé API Gemini (obtenue sur Google AI Studio) :");
    if (GEMINI_API_KEY) {
        localStorage.setItem('gemini_api_key', GEMINI_API_KEY.trim());
    }
}

// ✅ URL UNIVERSELLE (v1beta + gemini-1.5-flash)
// C'est l'URL par défaut qui fonctionne avec toutes les clés AI Studio récentes.
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

let extractedText = "";

// --- 2. GESTION DE L'UPLOAD (PDF & WORD) ---
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fill = document.getElementById('upload-fill');
    const perc = document.getElementById('upload-perc');
    document.getElementById('upload-status-container').classList.remove('hidden');

    try {
        fill.style.width = "40%";
        perc.innerText = "Lecture...";

        if (file.name.endsWith('.pdf')) {
            extractedText = await extractPDF(file);
        } else if (file.name.endsWith('.docx')) {
            extractedText = await extractWord(file);
        }

        fill.style.width = "100%";
        perc.innerText = "Fichier prêt !";
        document.getElementById('btn-ai').disabled = false;
        document.getElementById('btn-ai').style.opacity = "1";
        document.getElementById('btn-ai').innerText = "🚀 ANALYSER LE COURS";
    } catch (err) {
        console.error(err);
        alert("Erreur lors de la lecture du fichier. Vérifiez le format.");
    }
};

// --- 3. TRAITEMENT PAR L'IA ---
window.processCourse = async () => {
    if (!extractedText) return;
    
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');

    // Prompt optimisé pour forcer le JSON propre
    const promptText = `Tu es un assistant pédagogique. Analyse le texte suivant et génère un résumé et un quiz de 5 questions. 
    Réponds UNIQUEMENT en
