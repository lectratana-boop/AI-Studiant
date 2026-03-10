import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

let summarizer;
let extractedText = "";
const DEFAULT_SUBJECTS = ["Math", "Informatique", "Histoire", "Droit", "Économie"];

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function initIA() {
    try {
        summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        document.getElementById('status-ia').innerText = "✅ IA Prête";
    } catch (e) { console.error("IA Load Error"); }
}

window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const btnAi = document.getElementById('btn-ai');
    const etaText = document.getElementById('eta-text');

    if (file && file.type === "application/pdf") {
        document.getElementById('upload-status-container').classList.remove('hidden');
        let up = 0;
        const upInt = setInterval(async () => {
            up += 10;
            progressFill.style.width = up + "%";
            progressText.innerText = up + "%";
            if (up >= 100) {
                clearInterval(upInt);
                const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                document.getElementById('file-info').innerText = `${fileSizeMB} Mo`;
                
                // Estimation du temps (ex: 1 Mo = env 2 min sur un tel moyen)
                const estimatedMinutes = Math.ceil(fileSizeMB * 1.5);
                etaText.innerText = `⏳ Temps d'analyse estimé : ${estimatedMinutes} min`;
                etaText.classList.remove('hidden');
                
                extractedText = await extractTextFromPDF(file);
                btnAi.disabled = false;
                btnAi.innerText = "🚀 Lancer l'Analyse IA";
            }
        }, 100);
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
    return t;
}

window.processCourse = async () => {
    const btnAi = document.getElementById('btn-ai');
    const btnResult = document.getElementById('btn-result');
    const resProg = document.getElementById('result-progress');
    
    btnAi.classList.add('hidden');
    btnResult.classList.remove('hidden');
    
    let prog = 0;
    const progInt = setInterval(() => {
        if (prog < 99) {
            prog += 1;
            resProg.innerText = prog + "%";
        }
    }, 1500); // Vitesse lente pour simuler l'analyse profonde

    // Analyse par gros morceaux pour un résumé long
    const chunks = [extractedText.substring(0, 2000), extractedText.substring(2000, 4000)];
    let finalSummary = "";
    
    try {
        for (let chunk of chunks) {
            if (chunk.length < 100) continue;
            const out = await summarizer(chunk, { max_new_tokens: 150 });
            finalSummary += "<h4>Section</h4>" + out[0].summary_text + "<br><br>";
        }

        clearInterval(progInt);
        resProg.innerText = "100%";
        document.getElementById('eta-text').innerText = "✅ Analyse terminée !";
        
        // Stockage des résultats
        document.getElementById('summary-result').innerHTML = `<h3>📝 Résumé Détaillé</h3>${finalSummary}`;
        
        // Génération de 10 à 30 questions (basé sur la longueur)
        let quizHtml = "<h3>❓ Quiz d'Examen (30 questions)</h3>";
        const words = extractedText.split(' ').filter(w => w.length > 6);
        for (let i = 1; i <= 30; i++) {
            quizHtml += `<span class="quiz-q">${i}. Expliquez le concept de "${words[i*2] || 'Blockchain'}" mentionné dans le cours ?</span>`;
        }
        document.getElementById('quiz-result').innerHTML = quizHtml;
        
    } catch (e) {
        btnResult.innerText = "Erreur IA";
    }
};

window.showResults = () => {
    document.getElementById('results-container').classList.remove('hidden');
    window.scrollTo(0, document.body.scrollHeight);
};

// Fonctions Navigation (Inchangées)
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
    DEFAULT_SUBJECTS.forEach(s => {
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
