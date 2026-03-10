import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

let summarizer;
let extractedText = ""; 
const DEFAULT_SUBJECTS = ["Math", "Physique", "Chimie", "Informatique", "Histoire", "Géographie", "Anglais", "Français", "Malagasy", "SVT"];

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function initIA() {
    const status = document.getElementById('status-ia');
    try {
        summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        status.innerText = "✅ IA Locale prête";
        status.style.color = "#00b894";
    } catch (e) { status.innerText = "❌ IA indisponible"; }
}

async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(" ") + " ";
    }
    return fullText.replace(/\s+/g, ' ').trim();
}

window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const statusContainer = document.getElementById('upload-status-container');
    const progressFill = document.getElementById('progress-fill');
    const btnAi = document.getElementById('btn-ai');

    if (file && file.type === "application/pdf") {
        statusContainer.classList.remove('hidden');
        btnAi.innerText = "Lecture du PDF...";
        
        try {
            extractedText = await extractTextFromPDF(file);
            progressFill.style.width = "100%";
            btnAi.disabled = false;
            btnAi.innerText = "🚀 Analyser le cours";
        } catch (err) { alert("Erreur PDF"); }
    }
};

window.processCourse = async () => {
    const btnAi = document.getElementById('btn-ai');
    const summaryDiv = document.getElementById('summary-result');
    const quizDiv = document.getElementById('quiz-result');

    if (!extractedText) return alert("Pas de texte à analyser.");

    btnAi.disabled = true;
    btnAi.classList.add('analyzing');
    summaryDiv.classList.remove('hidden');
    
    // PROGRESSION SIMULÉE DE L'ANALYSE
    let aiProgress = 0;
    const progressInterval = setInterval(() => {
        if (aiProgress < 95) {
            aiProgress += Math.floor(Math.random() * 5) + 1;
            btnAi.innerText = `Analyse en cours : ${aiProgress}%`;
        }
    }, 400);

    const textToAnalyze = extractedText.substring(0, 1500); 

    try {
        const output = await summarizer(textToAnalyze, { 
            max_new_tokens: 120,
            chunk_length: 512
        });

        clearInterval(progressInterval);
        btnAi.innerText = "Analyse Terminée 100%";
        btnAi.classList.remove('analyzing');
        
        summaryDiv.innerHTML = `<h3>📝 Résumé</h3><p>${output[0].summary_text}</p>`;
        
        // Quiz
        const words = textToAnalyze.split(' ').filter(w => w.length > 7);
        quizDiv.classList.remove('hidden');
        quizDiv.innerHTML = `<h3>❓ Quiz Rapide</h3>
            <span class="quiz-q">1. Que dit le cours sur "${words[0] || 'ce sujet'}" ?</span>
            <span class="quiz-q">2. Expliquez le rôle de "${words[1] || 'cet élément'}" ici.</span>`;

    } catch (e) {
        clearInterval(progressInterval);
        btnAi.innerText = "Erreur d'analyse";
        summaryDiv.innerHTML = "<p>Désolé, l'IA a rencontré un problème technique.</p>";
    }
};

// Fonctions standards
window.finishRegister = () => {
    const name = document.getElementById('user-name').value;
    if (name.trim()) { localStorage.setItem('ai_studiant_user', name); checkAuth(); }
};
function checkAuth() {
    const name = localStorage.getItem('ai_studiant_user');
    if (name) {
        document.getElementById('register-page').classList.add('hidden');
        document.getElementById('dashboard-page').classList.remove('hidden');
        document.getElementById('display-name').innerText = name;
        loadSubjects();
    }
}
function loadSubjects() {
    const grid = document.getElementById('subjects-grid');
    let saved = JSON.parse(localStorage.getItem('ai_subjects')) || DEFAULT_SUBJECTS;
    grid.innerHTML = "";
    saved.forEach((sub, index) => {
        const card = document.createElement('div');
        card.className = "card";
        card.innerHTML = `${sub} <i class="fas fa-edit edit-btn" onclick="renameSubject(${index}, event)"></i>`;
        card.onclick = () => openSubject(sub);
        grid.appendChild(card);
    });
}
window.renameSubject = (index, event) => {
    event.stopPropagation();
    let saved = JSON.parse(localStorage.getItem('ai_subjects')) || DEFAULT_SUBJECTS;
    const newName = prompt("Renommer :", saved[index]);
    if (newName) { saved[index] = newName; localStorage.setItem('ai_subjects', JSON.stringify(saved)); loadSubjects(); }
};
window.addNewSubject = () => {
    let saved = JSON.parse(localStorage.getItem('ai_subjects')) || DEFAULT_SUBJECTS;
    const name = prompt("Matière :");
    if (name) { saved.push(name); localStorage.setItem('ai_subjects', JSON.stringify(saved)); loadSubjects(); }
};
window.openSubject = (name) => {
    document.getElementById('dashboard-page').classList.add('hidden');
    document.getElementById('subject-page').classList.remove('hidden');
    document.getElementById('current-subject-title').innerText = name;
};
window.showDashboard = () => {
    document.getElementById('dashboard-page').classList.remove('hidden');
    document.getElementById('subject-page').classList.add('hidden');
};

initIA();
checkAuth();
