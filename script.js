import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

let summarizer;
const DEFAULT_SUBJECTS = ["Math", "Physique", "Chimie", "Informatique", "Histoire", "Géographie", "Anglais", "Français", "Malagasy", "SVT"];

// 1. Initialisation de l'IA (Modèle léger ~200Mo)
async function initIA() {
    const status = document.getElementById('status-ia');
    try {
        summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        status.innerText = "✅ IA Locale prête";
        status.style.color = "#00b894";
        document.getElementById('btn-ai').disabled = false;
    } catch (e) {
        status.innerText = "❌ IA indisponible";
        console.error(e);
    }
}

// 2. Gestion Inscription
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

// 3. Gestion des Matières
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
    const newName = prompt("Renommer la matière :", saved[index]);
    if (newName) {
        saved[index] = newName;
        localStorage.setItem('ai_subjects', JSON.stringify(saved));
        loadSubjects();
    }
};

window.addNewSubject = () => {
    let saved = JSON.parse(localStorage.getItem('ai_subjects')) || DEFAULT_SUBJECTS;
    const name = prompt("Nom de la nouvelle matière :");
    if (name) {
        saved.push(name);
        localStorage.setItem('ai_subjects', JSON.stringify(saved));
        loadSubjects();
    }
};

// 4. Navigation & IA
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
    const text = document.getElementById('course-text').value;
    const summaryDiv = document.getElementById('summary-result');
    if (text.length < 20) return alert("Texte trop court !");
    summaryDiv.innerHTML = "<p>⏳ Analyse IA en cours...</p>";
    try {
        const output = await summarizer(text, { max_new_tokens: 80 });
        summaryDiv.innerHTML = `<h3>📝 Résumé</h3><p>${output[0].summary_text}</p>`;
        document.getElementById('quiz-result').innerHTML = `<h3>❓ Quiz express</h3><p>1. Quelle est l'idée principale ici ?</p>`;
    } catch (e) {
        summaryDiv.innerHTML = "<p>Erreur IA.</p>";
    }
};

window.handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) alert("Fichier " + file.name + " reçu !");
};

initIA();
checkAuth();
