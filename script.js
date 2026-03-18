// 1. CONFIGURATION
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');

// Fonction pour forcer la mise à jour de la clé si elle est invalide
window.askNewKey = () => {
    const key = prompt("🔑 Collez votre clé API du 18 Mars (commence par AIza...) :");
    if (key) {
        localStorage.setItem('gemini_api_key', key.trim());
        location.reload();
    }
};

if (!GEMINI_API_KEY) { window.askNewKey(); }

// ✅ UTILISATION DU MODÈLE LE PLUS STABLE POUR VOTRE COMPTE
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

let extractedText = "";

function updateBar(id, percId, value) {
    document.getElementById(id).style.width = value + "%";
    document.getElementById(percId).innerText = value + "%";
}

// 2. LECTURE DU FICHIER
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('upload-status-container').classList.remove('hidden');
    try {
        updateBar('upload-fill', 'upload-perc', 50);
        if (file.name.endsWith('.pdf')) { extractedText = await extractPDF(file); }
        else { extractedText = await extractWord(file); }
        updateBar('upload-fill', 'upload-perc', 100);
        document.getElementById('btn-ai').disabled = false;
        document.getElementById('btn-ai').style.opacity = "1";
    } catch (err) { alert("Erreur de lecture"); }
};

// 3. ANALYSE IA
window.processCourse = async () => {
    if (!extractedText) return;
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');
    
    updateBar('ia-fill', 'ia-perc', 30);

    const promptText = `Tu es un professeur. Analyse ce texte sur le climat. 
    Fais un résumé et un quiz. Réponds UNIQUEMENT en JSON sous cette forme :
    {"titre":"Le Climat", "intro":"Définition et enjeux", "points":["Point 1", "Point 2"], "quiz":[{"q":"Question ?", "correct":"Réponse", "wrong":["Faux1", "Faux2"]}]}
    Texte : ${extractedText}`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        const data = await response.json();
        if (data.error) {
            if(data.error.message.includes("API key")) {
                alert("❌ Clé API Invalide. Cliquez sur la clé pour la remettre.");
            } else {
                alert("Erreur Google : " + data.error.message);
            }
            document.getElementById('btn-ai').classList.remove('hidden');
            return;
        }

        updateBar('ia-fill', 'ia-perc', 80);
        const rawText = data.candidates[0].content.parts[0].text;
        const start = rawText.indexOf('{');
        const end = rawText.lastIndexOf('}') + 1;
        const json = JSON.parse(rawText.substring(start, end));

        updateBar('ia-fill', 'ia-perc', 100);
        renderResults(json);
    } catch (err) {
        alert("Problème de connexion ou de format. Réessayez.");
        document.getElementById('btn-ai').classList.remove('hidden');
    }
};

// --- MOTEURS ---
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
    document.getElementById('summary-result').innerHTML = `<h3>🌍 ${data.titre}</h3><p>${data.intro}</p><ul>${data.points.map(p => `<li>${p}</li>`).join('')}</ul>`;
    let qHtml = "<h4>Quiz rapide</h4>";
    data.quiz.forEach(q => { qHtml += `<p><strong>${q.q}</strong><br><span style="color:#4ade80">✅ ${q.correct}</span></p>`; });
    document.getElementById('quiz-result').innerHTML = qHtml;
    document.getElementById('btn-result').classList.remove('hidden');
}
