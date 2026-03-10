import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

let summarizer;
const DEFAULT_SUBJECTS = ["Math", "Physique", "Chimie", "Informatique", "Histoire", "Géographie", "Anglais", "Français", "Malagasy", "SVT"];

async function initIA() {
    const status = document.getElementById('status-ia');
    try {
        summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        status.innerText = "✅ IA prête";
        status.style.color = "#00b894";
    } catch (e) { status.innerText = "❌ IA indisponible"; }
}

window.finishRegister = () => {
    const name = document.getElementById('user-name').value;
    if (name.trim() === "") return alert("Indique ton nom !");
    localStorage.setItem('ai_studiant_user', name);
    checkAuth();
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
    const newName = prompt("Nouveau nom :", saved[index]);
    if (newName) {
        saved[index] = newName;
        localStorage.setItem('ai_subjects', JSON.stringify(saved));
        loadSubjects();
    }
};

window.handleFileUpload = (e) => {
    const file = e.target.files[0];
    const statusContainer = document.getElementById('upload-status-container');
    const fileInfo = document.getElementById('file-info');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const btnAi = document.getElementById('btn-ai');

    if (file) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        fileInfo.innerText = `Fichier : ${file.name} (${fileSizeMB} Mo)`;
        statusContainer.classList.remove('hidden');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressFill.style.width = progress + "%";
            progressText.innerText = progress + "%";
            if (progress >= 100) {
                clearInterval(interval);
                btnAi.disabled = false; // DÉBLOQUE LE BOUTON ICI
                btnAi.innerText = "🚀 Analyser maintenant";
            }
        }, 150);
    }
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

window.processCourse = async () => {
    const summaryDiv = document.getElementById('summary-result');
    const quizDiv = document.getElementById('quiz-result');
    
    summaryDiv.innerHTML = "<h3>📝 Résumé</h3><p>⏳ L'IA analyse votre fichier...</p>";
    
    // Simulation du traitement (puisque l'IA locale tourne dans le navigateur)
    setTimeout(() => {
        summaryDiv.innerHTML = "<h3>📝 Résumé</h3><p>Ce cours traite des concepts fondamentaux de la matière sélectionnée. Les points clés incluent les définitions principales et les formules essentielles à retenir pour l'examen.</p>";
        quizDiv.innerHTML = "<h3>❓ Quiz Généré</h3><p>1. Quelle est la définition principale vue dans ce cours ?</p><p>2. Citez un exemple d'application pratique.</p>";
    }, 2000);
};

initIA();
checkAuth();
