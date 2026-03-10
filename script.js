import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

let summarizer;
let extractedText = ""; 
const DEFAULT_SUBJECTS = ["Math", "Physique", "Chimie", "Informatique", "Histoire", "Géographie", "Anglais", "Français", "Malagasy", "SVT"];

// Configuration du lecteur PDF
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function initIA() {
    const status = document.getElementById('status-ia');
    try {
        summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        status.innerText = "✅ IA Locale prête";
        status.style.color = "#00b894";
    } catch (e) { status.innerText = "❌ IA indisponible"; }
}

// Fonction pour extraire le texte réel du PDF
async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(" ") + " ";
    }
    return fullText;
}

window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const statusContainer = document.getElementById('upload-status-container');
    const fileInfo = document.getElementById('file-info');
    const progressFill = document.getElementById('progress-fill');
    const btnAi = document.getElementById('btn-ai');

    if (file && file.type === "application/pdf") {
        fileInfo.innerText = `Lecture de : ${file.name}...`;
        statusContainer.classList.remove('hidden');
        progressFill.style.width = "40%";

        try {
            extractedText = await extractTextFromPDF(file);
            progressFill.style.width = "100%";
            fileInfo.innerText = `Prêt : ${file.name} (${(file.size/1024/1024).toFixed(2)} Mo)`;
            btnAi.disabled = false;
        } catch (err) { alert("Erreur lecture PDF"); }
    }
};

window.processCourse = async () => {
    const summaryDiv = document.getElementById('summary-result');
    const quizDiv = document.getElementById('quiz-result');
    summaryDiv.classList.remove('hidden');
    quizDiv.classList.remove('hidden');
    summaryDiv.innerHTML = "<h3>📝 Résumé</h3><p>⏳ L'IA analyse le contenu...</p>";
    
    // On prend les 2000 premiers caractères pour l'IA locale
    const textToAnalyze = extractedText.substring(0, 2000); 

    try {
        const output = await summarizer(textToAnalyze, { max_new_tokens: 150 });
        summaryDiv.innerHTML = `<h3>📝 Résumé du cours</h3><p>${output[0].summary_text}</p>`;
        
        // Création d'un quiz basé sur les mots du document
        const words = textToAnalyze.split(' ').filter(w => w.length > 7);
        quizDiv.innerHTML = `<h3>❓ Quiz</h3>
            <span class="quiz-q">1. Comment définiriez-vous "${words[0] || 'ce concept'}" selon le texte ?</span>
            <span class="quiz-q">2. Expliquez le rôle de "${words[1] || 'cet élément'}" dans ce cours.</span>`;
    } catch (e) { summaryDiv.innerHTML = "<p>Erreur analyse IA.</p>"; }
};

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
    const newName = prompt("Nom :", saved[index]);
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
