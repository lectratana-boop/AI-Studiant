// 1. CONFIGURATION
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');
if (!GEMINI_API_KEY) {
    GEMINI_API_KEY = prompt("🔑 Collez votre clé API du 18 Mars :");
    if (GEMINI_API_KEY) localStorage.setItem('gemini_api_key', GEMINI_API_KEY.trim());
}

// ✅ UTILISATION D'UN PROXY POUR DÉBLOQUER LA RÉGION
// Ce service gratuit fait office de pont entre Madagascar et les serveurs Google
const PROXY_URL = "https://cors-anywhere.herokuapp.com/"; 
const TARGET_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// On combine les deux pour tromper la restriction géographique
const FINAL_URL = PROXY_URL + TARGET_URL;

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

// 3. APPEL IA VIA PROXY
window.processCourse = async () => {
    if (!extractedText) return;
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');

    const payload = {
        contents: [{
            parts: [{ text: `Fais un résumé JSON de ce cours : ${extractedText.substring(0, 8000)}` }]
        }]
    };

    try {
        const response = await fetch(FINAL_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest' // Requis par le proxy
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.error) {
            // Si le proxy demande une activation (courant la première fois)
            if (response.status === 403) {
                alert("📢 ACTION REQUISE : Cliquez sur 'OK', puis sur le bouton bleu 'Request temporary access' sur la page qui va s'ouvrir, et revenez ici.");
                window.open("https://cors-anywhere.herokuapp.com/corsdemo", "_blank");
            } else {
                alert("ERREUR : " + data.error.message);
            }
            document.getElementById('btn-ai').classList.remove('hidden');
            return;
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const start = rawText.indexOf('{');
        const end = rawText.lastIndexOf('}') + 1;
        renderResults(JSON.parse(rawText.substring(start, end)));
        document.getElementById('ia-fill').style.width = "100%";

    } catch (err) {
        alert("Erreur de connexion. Vérifiez votre Internet.");
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
