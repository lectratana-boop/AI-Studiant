// ==========================================
// 1. INITIALISATION & BASE DE DONNÉES
// ==========================================
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');
const GEMINI_URL = () => `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${localStorage.getItem('gemini_api_key')}`;

// Notre base de données locale
let dbCourses = JSON.parse(localStorage.getItem('ai_studiant_db')) || [];
let extractedText = "";
let currentFileName = "";

window.askNewKey = () => {
    const key = prompt("🔑 Collez votre clé API Gemini :");
    if (key) { localStorage.setItem('gemini_api_key', key.trim()); location.reload(); }
};

function updateBar(id, percId, value) {
    const bar = document.getElementById(id);
    const text = document.getElementById(percId);
    if (bar) bar.style.width = value + "%";
    if (text) text.innerText = value + "%";
}

// ==========================================
// 2. GESTION DU FICHIER ET LIMITE 50 MO
// ==========================================
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // SÉCURITÉ TAILLE 50 Mo
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        alert("❌ Fichier trop lourd ! La limite est de 50 Mo.");
        e.target.value = "";
        return;
    }

    currentFileName = file.name;
    document.getElementById('label-text').innerText = "📄 " + file.name.substring(0, 15);
    document.getElementById('upload-status-container').classList.remove('hidden');
    updateBar('upload-fill', 'upload-perc', 10);

    try {
        if (file.name.toLowerCase().endsWith('.pdf')) {
            extractedText = await extractPDF(file);
        } else {
            extractedText = await extractWord(file);
        }
        updateBar('upload-fill', 'upload-perc', 100);
        const btn = document.getElementById('btn-ai');
        btn.disabled = false;
        btn.innerText = "🚀 ANALYSER CE COURS";
    } catch (err) {
        alert("Erreur de lecture.");
    }
};

// ==========================================
// 3. ANALYSE ET SAUVEGARDE
// ==========================================
window.processCourse = async () => {
    if (!extractedText || !localStorage.getItem('gemini_api_key')) return;

    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');
    
    let progress = 0;
    const interval = setInterval(() => {
        if (progress < 95) {
            progress++;
            updateBar('ia-fill', 'ia-perc', progress);
            document.getElementById('timer-text').innerText = `⏳ Création du quiz... ~${Math.ceil((100-progress)/4)}s`;
        }
    }, 200);

    const promptText = `Tu es un professeur. Analyse ce texte. 
    1. Résumé structuré. 2. 3 questions de quiz par section du cours (9 questions minimum).
    Réponds en JSON : {"titre":"", "sections":[{"n":"", "c":""}], "quiz":[{"q":"", "correct":"", "wrong":[]}]}`;

    try {
        const response = await fetch(GEMINI_URL(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText + " Texte: " + extractedText.substring(0, 15000) }] }] })
        });

        const data = await response.json();
        clearInterval(interval);
        const rawText = data.candidates[0].content.parts[0].text;
        const json = JSON.parse(rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1));

        // SAUVEGARDE DANS LA BASE DE DONNÉES
        const subject = document.getElementById('current-subject').value;
        const newCourse = {
            id: Date.now(),
            name: currentFileName,
            subject: subject,
            result: json
        };
        dbCourses.push(newCourse);
        localStorage.setItem('ai_studiant_db', JSON.stringify(dbCourses));

        updateBar('ia-fill', 'ia-perc', 100);
        renderHistory(); // Met à jour la liste
        renderResults(json);
        document.getElementById('results-container').classList.remove('hidden');
    } catch (err) {
        clearInterval(interval);
        alert("Erreur Gemini.");
    }
};

// ==========================================
// 4. GESTION DE L'HISTORIQUE (SANS API)
// ==========================================
window.renderHistory = () => {
    const subject = document.getElementById('current-subject').value;
    const list = document.getElementById('history-list');
    const filtered = dbCourses.filter(c => c.subject === subject);
    
    list.innerHTML = filtered.length ? "" : "<p style='font-size:0.7em;color:#475569;'>Aucun cours ici.</p>";
    
    filtered.forEach(course => {
        const div = document.createElement('div');
        div.style = "background:#0f172a; padding:10px; border-radius:8px; cursor:pointer; font-size:0.8em; border-left:3px solid #6366f1; display:flex; justify-content:space-between;";
        div.innerHTML = `<span>📄 ${course.name.substring(0,20)}</span> <i class="fas fa-eye"></i>`;
        div.onclick = () => {
            renderResults(course.result);
            document.getElementById('results-container').classList.remove('hidden');
        };
        list.appendChild(div);
    });
};

// ==========================================
// 5. FONCTIONS DE RENDU ET MOTEURS
// ==========================================
function renderResults(data) {
    let sHtml = `<h2 style="color:#4ade80;">${data.titre}</h2>`;
    data.sections.forEach(s => sHtml += `<b style="color:#818cf8;">📍 ${s.n}</b><p>${s.c}</p>`);
    document.getElementById('summary-result').innerHTML = sHtml;

    let qHtml = `<h2 style="color:#f59e0b;">❓ Quiz (${data.quiz.length} questions)</h2>`;
    data.quiz.forEach((q, i) => {
        qHtml += `<div style="background:#1e293b; padding:10px; margin-bottom:10px; border-radius:10px; border-left:4px solid #f59e0b;">
            <p><b>${i+1}. ${q.q}</b></p><p style="color:#4ade80;">✅ ${q.correct}</p></div>`;
    });
    document.getElementById('quiz-result').innerHTML = qHtml;
}

window.switchTab = (type) => {
    const isSum = type === 'sum';
    document.getElementById('summary-content').classList.toggle('hidden', !isSum);
    document.getElementById('quiz-content').classList.toggle('hidden', isSum);
};

// MOTEURS PDF/WORD (Gardés tels quels car fonctionnels)
async function extractPDF(file) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let t = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const p = await p.getPage(i);
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

// Lancement au démarrage
document.addEventListener('DOMContentLoaded', renderHistory);
