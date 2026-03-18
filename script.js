// 1. CONFIGURATION (Clé du 18 Mars)
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');
if (!GEMINI_API_KEY) {
    GEMINI_API_KEY = prompt("🔑 Collez votre clé API du 18 Mars :");
    if (GEMINI_API_KEY) localStorage.setItem('gemini_api_key', GEMINI_API_KEY.trim());
}

// ✅ LE MODÈLE EXACT VU SUR VOTRE ÉCRAN (2.5-flash)
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
        document.getElementById('btn-ai').innerText = "🚀 ANALYSER LE COURS";
    } catch (err) { alert("Erreur de lecture"); }
};

// 3. APPEL IA (Modèle 2.5-flash)
window.processCourse = async () => {
    if (!extractedText) return;
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');

    const payload = {
        contents: [{
            parts: [{ text: `Agis en tant que prof. Résume ce cours et fais un quiz en JSON : ${extractedText.substring(0, 15000)}` }]
        }]
    };

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.error) {
            alert("ERREUR GOOGLE : " + data.error.message);
            document.getElementById('btn-ai').classList.remove('hidden');
            return;
        }

        const rawText = data.candidates[0].content.parts[0].text;
        // On nettoie le texte au cas où l'IA ajoute du texte autour du JSON
        const start = rawText.indexOf('{');
        const end = rawText.lastIndexOf('}') + 1;
        renderResults(JSON.parse(rawText.substring(start, end)));
        document.getElementById('ia-fill').style.width = "100%";

    } catch (err) {
        alert("Erreur technique : " + err.message);
        document.getElementById('btn-ai').classList.remove('hidden');
    }
};

// --- FONCTIONS TECHNIQUES ---
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
    document.getElementById('summary-result').innerHTML = `<h3>${data.titre || "Résumé"}</h3><p>${data.intro || ""}</p>`;
    document.getElementById('btn-result').classList.remove('hidden');
}

window.resetApiKey = () => { localStorage.removeItem('gemini_api_key'); location.reload(); };
window.showResults = () => document.getElementById('results-container').classList.remove('hidden');
