import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

let summarizer;
let extractedText = "";
let fileSizeMB = 0;

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function initIA() {
    try {
        summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        document.getElementById('status-ia').innerText = "✅ IA Prête";
    } catch (e) { document.getElementById('status-ia').innerText = "❌ IA indisponible"; }
}

window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const fill = document.getElementById('progress-fill');
    const txt = document.getElementById('progress-text');
    const btn = document.getElementById('btn-ai');

    if (file && file.type === "application/pdf") {
        document.getElementById('upload-status-container').classList.remove('hidden');
        fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        document.getElementById('file-info').innerText = `Taille : ${fileSizeMB} Mo`;

        let up = 0;
        const upInt = setInterval(async () => {
            up += 5;
            fill.style.width = up + "%";
            txt.innerText = `Upload : ${up}%`;
            if (up >= 100) {
                clearInterval(upInt);
                extractedText = await extractTextFromPDF(file);
                btn.disabled = false;
                btn.innerText = "🚀 Lancer l'Analyse IA";
            }
        }, 30);
    }
};

async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let t = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        t += content.items.map(it => it.str).join(" ") + " ";
    }
    return t.replace(/\s+/g, ' ').trim();
}

window.processCourse = async () => {
    const btnAi = document.getElementById('btn-ai');
    const btnRes = document.getElementById('btn-result');
    const eta = document.getElementById('eta-text');
    const stats = document.getElementById('ia-stats');
    const resProg = document.getElementById('result-progress');

    btnAi.disabled = true;
    btnAi.classList.add('analyzing');
    document.getElementById('ia-detail-container').classList.remove('hidden');

    // Estimation : 1 Mo = env. 1.5 min sur mobile
    let minutesWait = Math.ceil(fileSizeMB * 1.5);
    eta.innerText = `⏳ Temps estimé : ${minutesWait} minute(s)`;

    let progIA = 0;
    const progInt = setInterval(() => {
        if (progIA < 99) {
            progIA++;
            btnAi.innerText = `Analyse IA : ${progIA}%`;
            stats.innerText = `Fini : ${progIA}% | Reste : ${100 - progIA}%`;
            resProg.innerText = progIA + "%";
        }
    }, (minutesWait * 60000) / 100);

    // Découpage pour résumé long (chapitres)
    const chunks = [];
    for(let i=0; i < extractedText.length; i += 2500) {
        chunks.push(extractedText.substring(i, i + 2500));
    }

    try {
        let fullSummary = "";
        for (let idx = 0; idx < Math.min(chunks.length, 5); idx++) {
            const out = await summarizer(chunks[idx], { max_new_tokens: 100 });
            fullSummary += `<h4>Chapitre ${idx + 1}</h4><p>${out[0].summary_text}</p>`;
        }

        clearInterval(progInt);
        btnAi.classList.add('hidden');
        btnRes.classList.remove('hidden');
        resProg.innerText = "100%";
        eta.innerText = "✅ Analyse terminée !";

        document.getElementById('summary-result').innerHTML = `<h3>📝 Résumé Détaillé</h3>${fullSummary}`;
        
        // Quiz dynamique 10-30 questions
        const numQ = Math.min(Math.max(Math.floor(extractedText.length / 400), 10), 30);
        const words = extractedText.split(' ').filter(w => w.length > 7);
        let qHtml = `<h3>❓ Quiz (${numQ} questions)</h3>`;
        for (let j = 1; j <= numQ; j++) {
            qHtml += `<span class="quiz-q">${j}. Expliquez le rôle de "${words[j*2] || 'ce point'}" dans le cours ?</span>`;
        }
        document.getElementById('quiz-result').innerHTML = qHtml;

    } catch (e) { btnAi.innerText = "Erreur IA"; }
};

window.showResults = () => {
    document.getElementById('results-container').classList.remove('hidden');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
};

window.finishRegister = () => {
    const n = document.getElementById('user-name').value;
    if (n) { localStorage.setItem('ai_user', n); checkAuth(); }
};

function checkAuth() {
    const n = localStorage.getItem('ai_user');
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
    ["Maths", "Droit", "Histoire", "SVT"].forEach(s => {
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

function showDashboard() {
    document.getElementById('dashboard-page').classList.remove('hidden');
    document.getElementById('subject-page').classList.add('hidden');
}

initIA();
checkAuth();
