import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

let summarizer;
let extractedText = ""; 
const DEFAULT_SUBJECTS = ["Math", "Physique", "Chimie", "Informatique", "Histoire", "Géographie", "Anglais", "Français", "Malagasy", "SVT"];

// Config PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function initIA() {
    const status = document.getElementById('status-ia');
    try {
        // Chargement du modèle
        summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        status.innerText = "✅ IA prête à l'emploi";
        status.style.color = "#00b894";
    } catch (e) {
        status.innerText = "❌ Erreur de chargement IA";
        console.error("IA Error:", e);
    }
}

async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // On nettoie un peu le texte pour aider l'IA
        fullText += content.items.map(item => item.str).join(" ") + " ";
    }
    return fullText.replace(/\s+/g, ' ').trim(); // Nettoyage des espaces doubles
}

window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const statusContainer = document.getElementById('upload-status-container');
    const fileInfo = document.getElementById('file-info');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const btnAi = document.getElementById('btn-ai');

    if (file && file.type === "application/pdf") {
        statusContainer.classList.remove('hidden');
        btnAi.disabled = true;
        
        // Simulation fluide du chargement
        let prog = 0;
        const loader = setInterval(() => {
            if (prog < 90) {
                prog += 5;
                progressFill.style.width = prog + "%";
                progressText.innerText = prog + "%";
            }
        }, 100);

        try {
            extractedText = await extractTextFromPDF(file);
            clearInterval(loader); // Stop simulation
            
            // Finition à 100%
            progressFill.style.width = "100%";
            progressText.innerText = "100%";
            fileInfo.innerText = `${file.name} (${(file.size/1024/1024).toFixed(2)} Mo)`;
            
            btnAi.disabled = false;
            btnAi.innerText = "🚀 Analyser maintenant";
        } catch (err) {
            clearInterval(loader);
            alert("Erreur de lecture du PDF");
        }
    }
};

window.processCourse = async () => {
    if (!summarizer) return alert("L'IA charge encore... attend un instant.");
    
    const summaryDiv = document.getElementById('summary-result');
    const quizDiv = document.getElementById('quiz-result');
    summaryDiv.classList.remove('hidden');
    quizDiv.classList.remove('hidden');
    
    summaryDiv.innerHTML = "<h3>📝 Résumé</h3><p>⏳ IA en cours de réflexion (cela peut prendre 10-30 sec)...</p>";
    
    // On limite le texte pour ne pas faire planter le navigateur
    const textToAnalyze = extractedText.substring(0, 1500); 

    try {
        const output = await summarizer(textToAnalyze, { 
            max_new_tokens: 100,
            chunk_length: 512,
            iteration: 1
        });
        
        summaryDiv.innerHTML = `<h3>📝 Résumé du cours</h3><p>${output[0].summary_text}</p>`;
        
        // Quiz basé sur les mots importants
        const keywords = textToAnalyze.split(' ').filter(w => w.length > 7);
        quizDiv.innerHTML = `<h3>❓ Quiz Automatique</h3>
            <span class="quiz-q">1. Selon le texte, quel est l'impact de "${keywords[0] || 'ce sujet'}" ?</span>
            <span class="quiz-q">2. Donnez une explication sur "${keywords[1] || 'cet élément'}" d'après le PDF.</span>`;
            
    } catch (e) {
        console.error(e);
        summaryDiv.innerHTML = "<h3>❌ Erreur</h3><p>L'IA a eu un problème. Réessaie avec un texte plus court ou vérifie ta connexion au premier chargement.</p>";
    }
};

// Fonctions Dashboard / Auth (Inchangées)
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
