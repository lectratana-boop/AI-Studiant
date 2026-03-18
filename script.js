let dbCourses = JSON.parse(localStorage.getItem('ai_studiant_db')) || [];
let extractedText = "";
let currentFileName = "";

window.askNewKey = () => {
    const key = prompt("🔑 Collez votre clé API Gemini :");
    if (key) { localStorage.setItem('gemini_api_key', key.trim()); location.reload(); }
};

function updateBar(id, value) {
    const bar = document.getElementById(id);
    if (bar) bar.style.width = value + "%";
}

// LECTURE DES FICHIERS
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    currentFileName = file.name;
    document.getElementById('label-text').innerText = "📄 " + file.name.substring(0, 15);
    document.getElementById('upload-status-container').classList.remove('hidden');
    updateBar('upload-fill', 30);

    try {
        const name = file.name.toLowerCase();
        if (name.endsWith('.pdf')) {
            extractedText = await extractPDF(file);
        } else if (name.endsWith('.docx')) {
            extractedText = await extractWord(file);
        } else {
            extractedText = await file.text();
        }
        updateBar('upload-fill', 100);
        document.getElementById('btn-ai').disabled = false;
    } catch (err) { alert("Erreur de lecture du fichier."); }
};

async function extractPDF(file) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(it => it.str).join(" ") + " ";
    }
    return text;
}

async function extractWord(file) {
    const ab = await file.arrayBuffer();
    const r = await mammoth.extractRawText({ arrayBuffer: ab });
    return r.value;
}

// ANALYSE GEMINI (URL CORRIGÉE)
window.processCourse = async () => {
    const key = localStorage.getItem('gemini_api_key');
    if (!key) { alert("Veuillez entrer votre clé API 🔑"); return; }

    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');
    
    let prog = 0;
    const interval = setInterval(() => { if (prog < 90) { prog++; updateBar('ia-fill', prog); } }, 150);

    // URL vérifiée : gemini-1.5-flash est le nom de modèle stable standard
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

    const promptText = `Analyse ce texte et réponds UNIQUEMENT en JSON : {"titre":"", "sections":[{"n":"", "c":""}], "quiz":[{"q":"", "correct":"", "wrong":[]}]}. Texte : ${extractedText.substring(0, 20000)}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        
        const data = await response.json();
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
        updateBar('ia-fill', 100);
    } catch (err) { 
        clearInterval(interval);
        alert("Erreur IA : " + err.message);
        document.getElementById('btn-ai').classList.remove('hidden');
    }
};

// HISTORIQUE ET SUPPRESSION
window.renderHistory = () => {
    const sub = document.getElementById('current-subject').value;
    const list = document.getElementById('history-list');
    const filtered = dbCourses.filter(c => c.subject === sub);
    list.innerHTML = filtered.length ? "" : "<p style='font-size:0.7em; text-align:center; color:#475569;'>Aucun cours enregistré.</p>";
    
    filtered.forEach(course => {
        const div = document.createElement('div');
        div.style = "background:#0f172a; padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; border-left:3px solid #6366f1; margin-bottom:5px;";
        div.innerHTML = `
            <div onclick="viewCourse(${course.id})" style="flex:1; cursor:pointer; font-size:0.8em; color:white;">📄 ${course.name.substring(0,18)}</div>
            <i class="fas fa-trash-alt" onclick="deleteCourse(${course.id})" style="color:#ef4444; padding:5px; cursor:pointer;"></i>
        `;
        list.appendChild(div);
    });
};

window.deleteCourse = (id) => {
    if(confirm("Supprimer ce cours définitivement ?")) {
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
    let s = `<h2 style="color:#4ade80;">📚 ${data.titre}</h2>`;
    data.sections.forEach(sec => s += `<div style="margin-top:10px;"><b style="color:#818cf8;">📍 ${sec.n}</b><p style="color:#cbd5e1; font-size:0.9em;">${sec.c}</p></div>`);
    document.getElementById('summary-result').innerHTML = s;
    let q = `<h3 style="color:#f59e0b;">❓ Quiz</h3>`;
    data.quiz.forEach((qz, i) => q += `<div style="background:#1e293b; padding:10px; margin-top:10px; border-radius:8px; border:1px solid #334155;"><p style="color:white;"><b>${i+1}. ${qz.q}</b></p><p style="color:#4ade80; font-weight:bold;">✅ ${qz.correct}</p></div>`);
    document.getElementById('quiz-result').innerHTML = q;
}

window.switchTab = (t) => {
    const isSum = t === 'sum';
    document.getElementById('summary-content').classList.toggle('hidden', !isSum);
    document.getElementById('quiz-content').classList.toggle('hidden', isSum);
};

document.addEventListener('DOMContentLoaded', renderHistory);
