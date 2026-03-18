let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');
// Correction Modèle : v1beta/models/gemini-1.5-flash 
const GEMINI_URL = () => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${localStorage.getItem('gemini_api_key')}`;

let dbCourses = JSON.parse(localStorage.getItem('ai_studiant_db')) || [];
let extractedText = "";
let currentFileName = "";

window.askNewKey = () => {
    const key = prompt("🔑 Clé API Gemini :");
    if (key) { localStorage.setItem('gemini_api_key', key.trim()); location.reload(); }
};

function updateBar(id, percId, value) {
    const bar = document.getElementById(id);
    const text = document.getElementById(percId);
    if (bar) bar.style.width = value + "%";
    if (text) text.innerText = value + "%";
}

// GESTION UPLOAD ET SUPPORTS [cite: 15, 20]
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
        alert("Fichier trop lourd (Max 50 Mo)");
        return;
    }

    currentFileName = file.name;
    document.getElementById('label-text').innerText = "📄 " + file.name.substring(0, 15);
    document.getElementById('upload-status-container').classList.remove('hidden');
    updateBar('upload-fill', 'upload-perc', 10);

    try {
        const name = file.name.toLowerCase();
        if (name.endsWith('.pdf')) {
            extractedText = await extractPDF(file);
        } else if (name.endsWith('.docx')) {
            extractedText = await extractWord(file);
        } else {
            extractedText = await file.text(); // Support TXT direct
        }
        updateBar('upload-fill', 'upload-perc', 100);
        const btn = document.getElementById('btn-ai');
        btn.disabled = false;
        btn.innerText = "🚀 ANALYSER CE COURS";
    } catch (err) { alert("Erreur de lecture."); }
};

// ANALYSE IA [cite: 25, 30]
window.processCourse = async () => {
    if (!extractedText || !localStorage.getItem('gemini_api_key')) return;

    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');
    
    let progress = 0;
    const interval = setInterval(() => {
        if (progress < 95) {
            progress++;
            updateBar('ia-fill', 'ia-perc', progress);
            document.getElementById('timer-text').innerText = `⏳ IA en action... ~${Math.ceil((100-progress)/4)}s`;
        }
    }, 200);

    const promptText = `Analyse ce cours : 1. Résumé structuré. 2. Exactement 3 questions de quiz par titre (min 9 questions). Réponds en JSON : {"titre":"", "sections":[{"n":"", "c":""}], "quiz":[{"q":"", "correct":"", "wrong":[]}]}`;

    try {
        const response = await fetch(GEMINI_URL(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText + " Texte: " + extractedText.substring(0, 18000) }] }] })
        });

        const data = await response.json();
        clearInterval(interval);
        const raw = data.candidates[0].content.parts[0].text;
        const json = JSON.parse(raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1));

        const subject = document.getElementById('current-subject').value;
        dbCourses.push({ id: Date.now(), name: currentFileName, subject: subject, result: json });
        localStorage.setItem('ai_studiant_db', JSON.stringify(dbCourses));

        updateBar('ia-fill', 'ia-perc', 100);
        renderHistory();
        renderResults(json);
        document.getElementById('results-container').classList.remove('hidden');
    } catch (err) { clearInterval(interval); alert("Erreur Gemini."); }
};

// GESTION HISTORIQUE ET SUPPRESSION 
window.renderHistory = () => {
    const subject = document.getElementById('current-subject').value;
    const list = document.getElementById('history-list');
    const filtered = dbCourses.filter(c => c.subject === subject);
    list.innerHTML = filtered.length ? "" : "<p style='font-size:0.7em;color:#475569;'>Vide.</p>";
    
    filtered.forEach(course => {
        const div = document.createElement('div');
        div.style = "background:#0f172a; padding:10px; border-radius:8px; margin-bottom:5px; border-left:3px solid #6366f1; display:flex; justify-content:space-between; align-items:center;";
        div.innerHTML = `
            <div onclick="viewCourse(${course.id})" style="flex:1; cursor:pointer; font-size:0.8em; color:white;">📄 ${course.name.substring(0,18)}</div>
            <i class="fas fa-trash-alt" onclick="deleteCourse(${course.id})" style="color:#ef4444; padding:5px; cursor:pointer;"></i>
        `;
        list.appendChild(div);
    });
};

window.deleteCourse = (id) => {
    if(confirm("Supprimer ce cours ?")) {
        dbCourses = dbCourses.filter(c => c.id !== id);
        localStorage.setItem('ai_studiant_db', JSON.stringify(dbCourses));
        renderHistory();
    }
};

window.viewCourse = (id) => {
    const c = dbCourses.find(item => item.id === id);
    if(c) { renderResults(c.result); document.getElementById('results-container').classList.remove('hidden'); }
};

// MOTEURS [cite: 42, 48]
async function extractPDF(file) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let t = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const p = await pdf.getPage(i); // Correction : variable 'p' ajoutée [cite: 44]
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
    let sHtml = `<h2 style="color:#4ade80;">${data.titre}</h2>`;
    data.sections.forEach(s => sHtml += `<b style="color:#818cf8;">📍 ${s.n}</b><p>${s.c}</p>`);
    document.getElementById('summary-result').innerHTML = sHtml;

    let qHtml = `<h2 style="color:#f59e0b;">❓ Quiz (${data.quiz.length} q.)</h2>`;
    data.quiz.forEach((q, i) => {
        qHtml += `<div style="background:#1e293b; padding:10px; margin-bottom:10px; border-radius:10px; border-left:4px solid #f59e0b;">
            <p><b>${i+1}. ${q.q}</b></p><p style="color:#4ade80;">✅ ${q.correct}</p></div>`;
    });
    document.getElementById('quiz-result').innerHTML = qHtml;
}

window.switchTab = (t) => {
    const isSum = t === 'sum';
    document.getElementById('summary-content').classList.toggle('hidden', !isSum);
    document.getElementById('quiz-content').classList.toggle('hidden', isSum);
    document.getElementById('tab-sum').style.background = isSum ? '#6366f1' : '#334155';
    document.getElementById('tab-quiz').style.background = isSum ? '#334155' : '#6366f1';
};

document.addEventListener('DOMContentLoaded', renderHistory);
