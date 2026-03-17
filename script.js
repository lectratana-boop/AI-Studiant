import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

let summarizer;
let extractedText = "";
let fileSizeMB = 0;

// Config PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function initIA() {
    try {
        summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        document.getElementById('status-ia').innerText = "✅ IA LOCALE PRÊTE";
        document.getElementById('status-ia').style.background = "#065f46";
    } catch (e) { console.error("IA Fail"); }
}

window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const fill = document.getElementById('progress-fill');
    const txt = document.getElementById('progress-text');
    const btn = document.getElementById('btn-ai');

    if (file) {
        document.getElementById('upload-status-container').classList.remove('hidden');
        fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        document.getElementById('file-info').innerText = `${fileSizeMB} Mo`;

        // Simulation d'upload
        let up = 0;
        const upInt = setInterval(async () => {
            up += 10;
            fill.style.width = up + "%";
            txt.innerText = `${up}%`;
            if (up >= 100) {
                clearInterval(upInt);
                // Lecture selon format
                if (file.name.endsWith('.pdf')) {
                    extractedText = await extractPDF(file);
                } else if (file.name.endsWith('.docx')) {
                    extractedText = await extractWord(file);
                }
                btn.disabled = false;
                btn.innerText = "🚀 ANALYSER LE COURS";
                btn.style.background = "#3b82f6";
            }
        }, 50);
    }
};

async function extractPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(it => it.str).join(" ") + " ";
    }
    return text;
}

async function extractWord(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

window.processCourse = async () => {
    const btnAi = document.getElementById('btn-ai');
    const btnRes = document.getElementById('btn-result');
    const eta = document.getElementById('eta-text');
    const resProg = document.getElementById('result-progress');

    btnAi.classList.add('analyzing');
    btnAi.innerText = "ANALYSE EN COURS...";
    document.getElementById('ia-detail-container').classList.remove('hidden');

    // Estimation temps
    let minutes = Math.ceil(fileSizeMB * 1.5);
    eta.innerText = `⏳ Attente estimée : ~${minutes} min`;

    // Découpage en blocs (Chunks) de 2000 caractères
    const chunks = [];
    for(let i=0; i < extractedText.length; i += 2000) {
        chunks.push(extractedText.substring(i, i + 2000));
    }

    let finalSummary = "";
    let progIA = 0;

    try {
        for (let i = 0; i < Math.min(chunks.length, 6); i++) {
            // Mise à jour pourcentage
            progIA = Math.round(((i + 1) / Math.min(chunks.length, 6)) * 100);
            document.getElementById('ia-perc-done').innerText = `Fini : ${progIA}%`;
            document.getElementById('ia-perc-rem').innerText = `Reste : ${100 - progIA}%`;
            resProg.innerText = progIA + "%";

            const out = await summarizer(chunks[i], { max_new_tokens: 120 });
            finalSummary += `<h4>Section ${i + 1}</h4><p>${out[0].summary_text}</p><br>`;
        }

        btnAi.classList.add('hidden');
        btnRes.classList.remove('hidden');
        document.getElementById('summary-result').innerHTML = `<h3>📝 Résumé Détaillé</h3>${finalSummary}`;
        
        // Quiz dynamique (10 à 30 questions)
        const numQ = Math.min(Math.max(Math.floor(extractedText.length / 500), 10), 30);
        const words = extractedText.split(' ').filter(w => w.length > 7);
        let qHtml = `<h3>❓ Quiz d'Examen (${numQ} questions)</h3>`;
        for (let j = 0; j < numQ; j++) {
            qHtml += `<span class="quiz-q">${j+1}. Expliquez le concept de "${words[j*2] || 'ce point'}" ?</span>`;
        }
        document.getElementById('quiz-result').innerHTML = qHtml;

    } catch (e) { btnAi.innerText = "ERREUR IA"; }
};

window.showResults = () => {
    document.getElementById('results-container').classList.remove('hidden');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
};

window.finishRegister = () => {
    const n = document.getElementById('user-name').value;
    if (n) { localStorage.setItem('ai_user_v3', n); checkAuth(); }
};

function checkAuth() {
    const n = localStorage.getItem('ai_user_v3');
    if (n) {
        document.getElementById('register-page').classList.add('hidden');
        document.getElementById('dashboard-page').classList.remove('hidden');
        document.getElementById('display-name').innerText = n;
        loadSubjects();
    }
}

function loadSubjects() {
    const g = document.getElementById('subjects-grid');
    g.innerHTML = "";
    ["Maths", "Droit", "Histoire", "SVT", "Physique", "Anglais"].forEach(s => {
        const c = document.createElement('div');
        c.className = "card";
        c.innerText = s;
        c.onclick = () => {
            document.getElementById('dashboard-page').classList.add('hidden');
            document.getElementById('subject-page').classList.remove('hidden');
            document.getElementById('current-subject-title').innerText = s;
        };
        g.appendChild(c);
    });
}

window.showDashboard = () => {
    document.getElementById('dashboard-page').classList.remove('hidden');
    document.getElementById('subject-page').classList.add('hidden');
};

initIA();
checkAuth();
