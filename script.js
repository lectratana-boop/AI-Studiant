import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

let summarizer;
let extractedText = "";
let fileSizeMB = 0;

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function initIA() {
    try {
        summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        document.getElementById('status-ia').innerText = "✅ IA Prête";
    } catch (e) { console.error("IA Init Error"); }
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
        }, 50);
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

    // Calcul du temps : 2 min par Mo environ
    let timeRemaining = Math.ceil(fileSizeMB * 2);
    eta.innerText = `⏳ Temps d'attente estimé : ${timeRemaining} minute(s)`;

    let progIA = 0;
    const progInt = setInterval(() => {
        if (progIA < 99) {
            progIA++;
            btnAi.innerText = `Chargement IA : ${progIA}%`;
            stats.innerText = `Analyse : ${progIA}% | Reste : ${100 - progIA}%`;
            resProg.innerText = progIA + "%";
        }
    }, (timeRemaining * 60000) / 100);

    // Découpage du texte pour un résumé par "chapitres"
    const chunks = [];
    for(let i=0; i < extractedText.length; i += 2000) {
        chunks.push(extractedText.substring(i, i + 2000));
    }

    try {
        let fullSummary = "";
        for (let index = 0; index < chunks.length; index++) {
            if (index > 4) break; // Limite pour performance mobile
            const out = await summarizer(chunks[index], { max_new_tokens: 100 });
            fullSummary += `<h4>Point Clé ${index + 1}</h4><p>${out[0].summary_text}</p>`;
        }

        clearInterval(progInt);
        btnAi.classList.add('hidden');
        btnRes.classList.remove('hidden');
        resProg.innerText = "100%";
        eta.innerText = "✅ Analyse terminée avec succès !";

        document.getElementById('summary-result').innerHTML = `<h3>📝 Résumé Approfondi</h3>${fullSummary}`;
        
        // Génération de 10 à 30 quiz selon la longueur
        const numQuiz = Math.min(Math.max(Math.floor(extractedText.length / 500), 10), 30);
        const words = extractedText.split(' ').filter(w => w.length > 7);
        let qHtml = `<h3>❓ Quiz d'Examen (${numQuiz} questions)</h3>`;
        for (let j = 1; j <= numQuiz; j++) {
            qHtml += `<span class="quiz-q">${j}. Expliquez l'importance de "${words[j*3] || 'ce concept'}" dans ce contexte ?</span>`;
        }
        document.getElementById('quiz-result').innerHTML = qHtml;

    } catch (e) {
        btnAi.innerText = "Erreur IA";
    }
};

window.showResults = () => {
    document.getElementById('results-container').classList.remove('hidden');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
};

// Fonctions de base
window.finishRegister = () => {
    const n = document.getElementById('user-name').value;
    if (n) { localStorage.setItem('ai_st_user', n); checkAuth(); }
};
function checkAuth() {
    const n = localStorage.getItem('ai_st_user');
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
    ["Math", "Droit", "Histoire", "Économie", "SVT"].forEach(s => {
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
