// 1. CONFIGURATION
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');

// ✅ CHANGEMENT CRITIQUE : gemini-2.5-flash
// Votre clé du 18 mars ne supporte que ce modèle (vu sur votre capture ListModels)
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

let extractedText = "";

// ... reste du code (updateBar, handleFileUpload) ...

window.processCourse = async () => {
    if (!extractedText) return;
    
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');
    
    // On commence la barre à 30%
    updateBar('ia-fill', 'ia-perc', 30);

    const promptText = `Tu es un expert en pédagogie. Résume ce cours et fais un quiz JSON.
    Structure : {"titre":"", "intro":"", "points":[], "quiz":[{"q":"", "correct":"", "wrong":[]}]}
    Texte : ${extractedText.substring(0, 15000)}`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        const data = await response.json();

        if (data.error) {
            // Si l'erreur persiste, c'est que la clé a besoin d'être rafraîchie
            alert("ERREUR GOOGLE : " + data.error.message);
            document.getElementById('btn-ai').classList.remove('hidden');
            return;
        }

        updateBar('ia-fill', 'ia-perc', 100);
        const rawText = data.candidates[0].content.parts[0].text;
        const start = rawText.indexOf('{');
        const end = rawText.lastIndexOf('}') + 1;
        renderResults(JSON.parse(rawText.substring(start, end)));

    } catch (err) {
        alert("Erreur de format ou connexion.");
        document.getElementById('btn-ai').classList.remove('hidden');
    }
};
