import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

let summarizer;
const subjects = ["Math", "Physique", "Chimie", "Informatique", "Histoire", "Géographie", "Anglais", "Français", "Malagasy", "SVT"];

// 1. Initialisation de l'IA
async function initIA() {
    const status = document.getElementById('status');
    try {
        // Chargement d'un modèle ultra-léger (env. 200MB)
        summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        status.innerText = "✅ IA Prête (Mode Local)";
        status.style.background = "#2ecc71";
        document.getElementById('btn-ai').disabled = false;
    } catch (e) {
        status.innerText = "❌ Erreur de chargement";
        console.error(e);
    }
}

// 2. Dashboard dynamique
function loadDashboard() {
    const grid = document.getElementById('subjects-grid');
    grid.innerHTML = "";
    subjects.forEach(sub => {
        const card = document.createElement('div');
        card.className = "card";
        card.innerHTML = `<h3>${sub}</h3>`;
        card.onclick = () => openSubject(sub);
        grid.appendChild(card);
    });
}

window.openSubject = (name) => {
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('subject-page').classList.remove('hidden');
    document.getElementById('current-subject-title').innerText = name;
};

window.showDashboard = () => {
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('subject-page').classList.add('hidden');
};

// 3. Traitement du cours (Résumé + Quiz)
window.processCourse = async () => {
    const text = document.getElementById('course-text').value;
    const summaryDiv = document.getElementById('summary-result');
    const quizDiv = document.getElementById('quiz-result');

    if(text.length < 50) return alert("Texte trop court !");

    summaryDiv.innerHTML = "⏳ Résumé en cours par l'IA locale...";
    
    // Résumé
    const output = await summarizer(text, { max_new_tokens: 100 });
    const summaryText = output[0].summary_text;
    
    summaryDiv.innerHTML = `<h3>📝 Résumé :</h3><p>${summaryText}</p>`;

    // Quiz (Logique algorithmique pour rester gratuit/rapide)
    const sentences = text.split('.').filter(s => s.length > 30);
    let quizHtml = "<h3>❓ Quiz Généré :</h3>";
    sentences.slice(0, 3).forEach((s, i) => {
        quizHtml += `
            <div class="quiz-item">
                <p>${i+1}. Que signifie : "${s.trim().substring(0, 50)}..." ?</p>
                <input type="radio"> Vrai <br>
                <input type="radio"> Faux
            </div>`;
    });
    quizDiv.innerHTML = quizHtml;
};

initIA();
loadDashboard();
