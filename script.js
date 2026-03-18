// 1. RÉCUPÉRATION DE LA CLÉ
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');

if (!GEMINI_API_KEY) {
    GEMINI_API_KEY = prompt("🔑 Collez votre clé API du 18 Mars :");
    if (GEMINI_API_KEY) localStorage.setItem('gemini_api_key', GEMINI_API_KEY.trim());
}

// ✅ CHANGEMENT D'URL CRITIQUE : Utilisation de gemini-1.5-flash-8b
// C'est le modèle le plus "léger" et souvent le plus facile à appeler depuis un site web.
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${GEMINI_API_KEY}`;

let extractedText = "";

// 2. LECTURE DES DOCUMENTS
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
        document.getElementById('btn-ai').innerText = "🚀 ANALYSER MAINTENANT";
    } catch (err) { alert("Erreur de lecture"); }
};

// 3. APPEL IA (AVEC SÉCURITÉ MODÈLE)
window.processCourse = async () => {
    if (!extractedText) return;
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');

    const payload = {
        contents: [{
            parts: [{ text: `Fais un résumé JSON de ce cours : ${extractedText.substring(0, 8000)}` }]
        }],
        generationConfig: {
            responseMimeType: "application/json"
        }
    };

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.error) {
            // Si l'erreur 404 persiste, on affiche une instruction pour changer de région
            alert("ERREUR GOOGLE : " + data.error.message + "\n\nConseil : Essayez d'activer un VPN sur 'USA' ou 'Europe' pour tester si c'est un blocage régional.");
            document.getElementById('btn-ai').classList.remove('hidden');
            return;
        }

        const rawText = data.candidates[0].content.parts[0].text;
        renderResults(JSON.parse(rawText));
        document.getElementById('ia-fill').style.width = "100%";

    } catch (err) {
        alert("Erreur technique : " + err.message);
        document.getElementById('btn-ai').classList.remove('hidden');
    }
};

// --- FONCTIONS TECHNIQUES (NE PAS TOUCHER) ---
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
    document.getElementById('summary-result').innerHTML = `<h3>${data.titre || "Résumé"}</h3><p>${data.intro || "Analyse réussie."}</p>`;
    document.getElementById('btn-result').classList.remove('hidden');
}

window.resetApiKey = () => { localStorage.removeItem('gemini_api_key'); location.reload(); };
window.showResults = () => document.getElementById('results-container').classList.remove('hidden');
