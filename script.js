import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

let summarizer;
let extractedText = "";

async function initIA() {
    try {
        // Chargement du modèle (peut prendre 30s la première fois sur Laptop)
        summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        document.getElementById('status-ia').innerText = "✅ MOTEUR IA PRÊT";
    } catch (e) { document.getElementById('status-ia').innerText = "❌ ERREUR CHARGEMENT"; }
}

window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('upload-status-container').classList.remove('hidden');
    let fill = document.getElementById('progress-fill');
    
    // Extraction du texte selon format
    if (file.type === "application/pdf") {
        extractedText = await extractPDF(file);
    } else {
        extractedText = await extractWord(file);
    }

    fill.style.width = "100%";
    document.getElementById('btn-ai').disabled = false;
    document.getElementById('btn-ai').innerText = "DÉMARRER L'ANALYSE";
};

// Extraction PDF
async function extractPDF(file) {
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

// Extraction Word
async function extractWord(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

window.processCourse = async () => {
    const btnAi = document.getElementById('btn-ai');
    const container = document.getElementById('ia-detail-container');
    container.classList.remove('hidden');
    btnAi.disabled = true;
    btnAi.innerText = "IA ANALYSE EN COURS...";

    // 1. DÉCOUPAGE PAR BLOCS POUR RÉSUMÉ LONG
    const blocks = extractedText.match(/[\s\S]{1,2500}/g) || [];
    let fullSummaryHtml = "<h3>📝 Résumé Détaillé par Chapitres</h3>";
    let quizData = [];

    for (let i = 0; i < blocks.length; i++) {
        let percent = Math.round(((i + 1) / blocks.length) * 100);
        document.getElementById('ia-perc-done').innerText = `Traitement bloc ${i+1}/${blocks.length} : ${percent}%`;

        // Résumé du bloc
        const res = await summarizer(blocks[i], { max_new_tokens: 130, min_new_tokens: 40 });
        fullSummaryHtml += `<div class="summary-block"><strong>Partie ${i+1}:</strong><br>${res[0].summary_text}</div>`;

        // Création de 2-3 questions par bloc pour atteindre 30
        const sentences = blocks[i].split(/[.!?]/).filter(s => s.trim().length > 50);
        sentences.slice(0, 3).forEach(sentence => {
            if(quizData.length < 30) {
                quizData.push(generateSmartQuiz(sentence));
            }
        });
    }

    // 2. AFFICHAGE RÉSUMÉ
    document.getElementById('summary-result').innerHTML = fullSummaryHtml;

    // 3. AFFICHAGE QUIZ CORRIGÉ
    let quizHtml = "<h3>❓ Quiz Corrigé (30 Questions Max)</h3>";
    quizData.forEach((q, idx) => {
        quizHtml += `
            <div class="quiz-card">
                <span class="quiz-question">${idx + 1}. ${q.question}</span>
                <div class="option correct">${q.correct}</div>
                <div class="option">${q.wrong1}</div>
                <div class="option">${q.wrong2}</div>
            </div>`;
    });
    document.getElementById('quiz-result').innerHTML = quizHtml;

    document.getElementById('btn-result').classList.remove('hidden');
    btnAi.classList.add('hidden');
};

function generateSmartQuiz(text) {
    const cleanText = text.trim();
    return {
        question: `D'après le cours, laquelle de ces affirmations est exacte ?`,
        correct: cleanText,
        wrong1: "Cette information est contredite par les chapitres suivants.",
        wrong2: "Il s'agit d'une interprétation erronée du concept initial."
    };
}

window.showResults = () => {
    document.getElementById('results-container').classList.remove('hidden');
};

initIA();
