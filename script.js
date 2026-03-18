// 1. CONFIGURATION
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');
// URL STABLE POUR 2026
const GEMINI_URL = () => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${localStorage.getItem('gemini_api_key')}`;

let dbCourses = JSON.parse(localStorage.getItem('ai_studiant_db')) || [];
let extractedText = "";
let currentFileName = "";

window.askNewKey = () => {
    const key = prompt("🔑 Entrez votre clé API Gemini :");
    if (key) { localStorage.setItem('gemini_api_key', key.trim()); location.reload(); }
};

function updateBar(id, percId, value) {
    const bar = document.getElementById(id);
    const text = document.getElementById(percId);
    if (bar) bar.style.width = value + "%";
    if (text) text.innerText = value + "%";
}

// 2. MOTEURS DE LECTURE (CORRIGÉS)
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert("Max 50 Mo"); return; }

    currentFileName = file.name;
    document.getElementById('label-text').innerText = "📄 " + file.name.substring(0, 15);
    document.getElementById('upload-status-container').classList.remove('hidden');
    updateBar('upload-fill', 'upload-perc', 10);

    try {
        const ext = file.name.toLowerCase();
        if (ext.endsWith('.pdf')) {
            extractedText = await extractPDF(file);
        } else if (ext.endsWith('.docx')) {
            extractedText = await extractWord(file);
        } else {
            extractedText = await file.text(); // Support TXT
        }
        updateBar('upload-fill', 'upload-perc', 100);
        document.getElementById('btn-ai').disabled = false;
        document.getElementById('btn-ai').innerText = "🚀 ANALYSER CE COURS";
    } catch (err) { alert("Erreur de lecture."); }
};

async function extractPDF(file) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let t = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i); // Correction ici
        const content = await page.getTextContent();
        t += content.items.map(it => it.str).join(" ") + " ";
    }
    return t;
}

async function extractWord(file) {
    const ab = await file.arrayBuffer();
    const r = await mammoth.extractRawText({ arrayBuffer: ab });
    return r.value;
}

// 3. ANALYSE GEMINI
window.processCourse = async () => {
    if (!extractedText || !localStorage.getItem('gemini_api_key')) return;
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');
    
    let prog = 0;
    const interval = setInterval(() => { if (prog < 95) { prog++; updateBar('ia-fill', 'ia-perc', prog); } }, 200);

    const promptText = `Analyse ce cours. Réponds en JSON : {"titre":"", "sections":[{"n":"", "c":""}], "quiz":[{"q":"", "correct":"", "wrong":[]}]}`;

    try {
        const res = await fetch(GEMINI_URL(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText + " Texte: " + extractedText.substring(0, 20000) }] }] })
        });
        const data = await res.json();
        clearInterval(interval);
        
        if (data.error) throw new Error(data.error.message);

        const raw = data.candidates[0].content.parts[0].text;
        const json = JSON.parse(raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1));

        const subject = document.getElementById('current-subject').value;
        dbCourses.push({ id: Date.now(), name: currentFileName, subject: subject, result: json });
        localStorage.setItem('ai_studiant_db', JSON.stringify(dbCourses));

        renderHistory();
        renderResults(json);
        document.getElementById('results-container').classList.remove('hidden');
    } catch (err) { alert("Erreur : " + err.message); }
};

// 4. HISTORIQUE ET SUPPRESSION
window.renderHistory = () => {
    const sub = document.getElementById('current-subject').value;
    const list = document.getElementById('history-list');
    const filtered = dbCourses.filter(c => c.subject === sub);
    list.innerHTML = filtered.length ? "" : "<p style='font-size:0.7em;color:#475569;'>Vide.</p>";
    
    filtered.forEach(course => {
        const div = document.createElement('div');
        div.style = "background:#0f172a; padding:10px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; border-left:3px solid #6366f1;";
        div.innerHTML = `
            <div onclick="viewCourse(${course.id})" style="flex:1; cursor:pointer; font-size:0.8em; color:white;">📄 ${course.name.substring(0,18)}</div>
            <i class="fas fa-trash-alt" onclick="deleteCourse(${course.id})" style="color:#ef4444; cursor:pointer; padding:5px;"></i>
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

function renderResults(data) {
    let sHtml = `<h2>${data.titre}</h2>`;
    data.sections.forEach(s => sHtml += `<b>📍 ${s.n}</b><p>${s.c}</p>`);
    document.getElementById('summary-result').innerHTML = sHtml;
    let qHtml = `<h3>Quiz</h3>`;
    data.quiz.forEach((q, i) => qHtml += `<div style="background:#1e293b; padding:10px; margin-bottom:10px; border-radius:10px;"><p>${i+1}. ${q.q}</p><b style="color:#4ade80;">✅ ${q.correct}</b></div>`);
    document.getElementById('quiz-result').innerHTML = qHtml;
}

window.switchTab = (t) => {
    const isSum = t === 'sum';
    document.getElementById('summary-content').classList.toggle('hidden', !isSum);
    document.getElementById('quiz-content').classList.toggle('hidden', isSum);
};

document.addEventListener('DOMContentLoaded', renderHistory);
