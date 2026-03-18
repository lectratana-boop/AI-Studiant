let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');
const GEMINI_URL = () => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${localStorage.getItem('gemini_api_key')}`;
let extractedText = "";

// GESTION CLÉ API (Mobile & PC)
window.askNewKey = () => {
    const key = prompt("🔑 Collez votre clé API Gemini (AIza...) :");
    if (key && key.trim().length > 10) {
        localStorage.setItem('gemini_api_key', key.trim());
        alert("✅ Clé enregistrée avec succès !");
        location.reload();
    }
};

if (!GEMINI_API_KEY) {
    setTimeout(() => { if(!localStorage.getItem('gemini_api_key')) askNewKey(); }, 2000);
}

function updateBar(id, percId, value) {
    const bar = document.getElementById(id);
    const text = document.getElementById(percId);
    if (bar) bar.style.width = value + "%";
    if (text) text.innerText = value + "%";
}

// LECTURE DU FICHIER
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('label-text').innerText = "📄 " + file.name.substring(0, 20);
    document.getElementById('upload-status-container').classList.remove('hidden');
    updateBar('upload-fill', 'upload-perc', 20);

    try {
        if (file.name.toLowerCase().endsWith('.pdf')) {
            extractedText = await extractPDF(file);
        } else {
            extractedText = await extractWord(file);
        }
        updateBar('upload-fill', 'upload-perc', 100);
        const btn = document.getElementById('btn-ai');
        btn.disabled = false;
        btn.innerText = "🚀 GÉNÉRER L'ANALYSE";
        btn.style.background = "#6366f1";
    } catch (err) {
        alert("Erreur lors de la lecture du document.");
    }
};

// ANALYSE IA (9 QUESTIONS PAR TITRE)
window.processCourse = async () => {
    if (!extractedText || !localStorage.getItem('gemini_api_key')) return;

    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');
    
    let progress = 0;
    const timerText = document.getElementById('timer-text');
    const interval = setInterval(() => {
        if (progress < 98) {
            progress++;
            updateBar('ia-fill', 'ia-perc', progress);
            if(timerText) timerText.innerText = `⏳ Création du quiz complexe... ~${Math.ceil((100-progress)/4)}s`;
        }
    }, 200);

    // Prompt configuré pour 3 questions par section
    const promptText = `Tu es un professeur. Analyse ce texte. 
    1. Fais un résumé structuré avec des titres.
    2. Pour CHAQUE titre/section du cours, crée exactement 3 questions de quiz.
    Le quiz doit être difficile et basé uniquement sur le texte.
    
    Réponds en JSON strict :
    {"titre":"", "sections":[{"n":"Titre Section", "c":"Contenu"}], "quiz":[{"q":"Question", "correct":"Réponse", "wrong":["Faux1", "Faux2"]}]}
    Texte : ${extractedText.substring(0, 15000)}`;

    try {
        const response = await fetch(GEMINI_URL(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        const data = await response.json();
        clearInterval(interval);

        const rawText = data.candidates[0].content.parts[0].text;
        const json = JSON.parse(rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1));

        updateBar('ia-fill', 'ia-perc', 100);
        renderResults(json);
        document.getElementById('btn-result').classList.remove('hidden');
        if(timerText) timerText.innerText = "✅ Quiz prêt !";

    } catch (err) {
        clearInterval(interval);
        alert("Erreur d'analyse. Vérifiez votre clé API.");
    }
};

// MOTEURS TECHNIQUES
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

// AFFICHAGE DES RÉSULTATS (Onglets & Couleurs)
window.switchTab = (type) => {
    const isSum = type === 'sum';
    document.getElementById('summary-content').classList.toggle('hidden', !isSum);
    document.getElementById('quiz-content').classList.toggle('hidden', isSum);
    document.getElementById('tab-sum').style.background = isSum ? '#6366f1' : '#334155';
    document.getElementById('tab-quiz').style.background = isSum ? '#334155' : '#6366f1';
};

function renderResults(data) {
    let sHtml = `<h2 style="color:#818cf8;">📚 ${data.titre}</h2>`;
    data.sections.forEach(s => {
        sHtml += `<div style="margin-top:15px;"><b style="color:#4ade80; font-size:1.1em;">📍 ${s.n}</b><p style="color:#cbd5e1; line-height:1.5;">${s.c}</p></div>`;
    });
    document.getElementById('summary-result').innerHTML = sHtml;

    let qHtml = `<h2 style="color:#f59e0b;">❓ Quiz Interactif (${data.quiz.length} questions)</h2>`;
    data.quiz.forEach((q, i) => {
        qHtml += `<div style="background:#1e293b; padding:15px; margin-bottom:12px; border-radius:12px; border-left:4px solid #f59e0b;">
            <p><b>${i+1}. ${q.q}</b></p>
            <div style="color:#4ade80; font-weight:bold; margin-top:5px;">✅ Réponse : ${q.correct}</div>
        </div>`;
    });
    document.getElementById('quiz-result').innerHTML = qHtml;
}

window.showResults = () => { document.getElementById('results-container').classList.remove('hidden'); };
