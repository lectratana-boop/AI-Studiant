// 1. CONFIGURATION
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');
// ✅ MISE À JOUR VERS GEMINI 3 FLASH
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${GEMINI_API_KEY}`;

let extractedText = "";

function updateBar(id, percId, value) {
    const bar = document.getElementById(id);
    if(bar) bar.style.width = value + "%";
    const text = document.getElementById(percId);
    if(text) text.innerText = value + "%";
}

// 2. LECTURE DU FICHIER
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('upload-status-container').classList.remove('hidden');
    updateBar('upload-fill', 'upload-perc', 10);

    try {
        if (file.name.endsWith('.pdf')) {
            extractedText = await extractPDF(file);
        } else {
            extractedText = await extractWord(file);
        }
        updateBar('upload-fill', 'upload-perc', 100);
        document.getElementById('btn-ai').disabled = false;
        document.getElementById('btn-ai').style.opacity = "1";
    } catch (err) {
        alert("Erreur lors de la lecture du fichier.");
    }
};

// 3. ANALYSE IA OPTIMISÉE
window.processCourse = async () => {
    if (!extractedText) return;
    
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');

    let progress = 5;
    updateBar('ia-fill', 'ia-perc', progress);

    // Simulation lente pour rassurer l'utilisateur
    const interval = setInterval(() => {
        if (progress < 85) {
            progress += 2;
            updateBar('ia-fill', 'ia-perc', progress);
        }
    }, 800);

    // On réduit la taille pour éviter les erreurs de connexion "Payload Too Large"
    const safeText = extractedText.substring(0, 10000);

    const payload = {
        contents: [{
            parts: [{ text: `Analyse ce cours. Donne un titre, un résumé court et 5 questions de quiz. Réponds uniquement en JSON : {"titre":"", "intro":"", "points":[], "quiz":[{"q":"", "correct":"", "wrong":[]}]} \n\nTexte : ${safeText}` }]
        }],
        generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 2000,
        }
    };

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || "Erreur réseau");
        }

        const data = await response.json();
        clearInterval(interval);

        const rawText = data.candidates[0].content.parts[0].text;
        const start = rawText.indexOf('{');
        const end = rawText.lastIndexOf('}') + 1;
        const jsonContent = JSON.parse(rawText.substring(start, end));

        updateBar('ia-fill', 'ia-perc', 100);
        renderResults(jsonContent);

    } catch (err) {
        clearInterval(interval);
        console.error("Détail erreur:", err);
        alert("⚠️ L'analyse a échoué. Cause possible : " + err.message);
        document.getElementById('btn-ai').classList.remove('hidden');
    }
};

// --- MOTEURS (NE PAS MODIFIER) ---
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
    document.getElementById('summary-result').innerHTML = `
        <div style="background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155;">
            <h2 style="color: #6366f1;">🎓 ${data.titre}</h2>
            <p style="margin: 15px 0; color: #cbd5e1;">${data.intro}</p>
            <ul style="color: #94a3b8;">${data.points.map(p => `<li style="margin-bottom:8px">${p}</li>`).join('')}</ul>
        </div>`;
    
    let qHtml = "<h2 style='margin: 20px 0;'>❓ Quiz Rapide</h2>";
    data.quiz.forEach((q, i) => {
        qHtml += `<div class="quiz-card" style="background:#0f172a; padding:15px; margin-bottom:10px; border-radius:8px;">
            <p><strong>${i+1}. ${q.q}</strong></p>
            <p style="color:#4ade80;">✅ ${q.correct}</p>
        </div>`;
    });
    document.getElementById('quiz-result').innerHTML = qHtml;
    document.getElementById('btn-result').classList.remove('hidden');
}

window.resetApiKey = () => { localStorage.removeItem('gemini_api_key'); location.reload(); };
window.showResults = () => {
    document.getElementById('results-container').classList.remove('hidden');
    window.scrollTo({ top: document.getElementById('results-container').offsetTop, behavior: 'smooth' });
};
