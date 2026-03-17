import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

let summarizer;
let extractedText = "";

async function initIA() {
    try {
        summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
        document.getElementById('status-ia').innerText = "✅ MOTEUR IA PRÊT";
    } catch (e) { document.getElementById('status-ia').innerText = "❌ ERREUR IA"; }
}

window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const container = document.getElementById('upload-status-container');
    container.classList.remove('hidden');
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    document.getElementById('file-info').innerText = `${sizeMB} Mo`;

    let perc = 0;
    const interval = setInterval(async () => {
        perc += 5;
        document.getElementById('upload-fill').style.width = perc + "%";
        document.getElementById('upload-perc').innerText = perc + "%";
        document.getElementById('upload-eta').innerText = `Chargement : ${100 - perc}% restant`;

        if (perc >= 100) {
            clearInterval(interval);
            extractedText = (file.name.endsWith('.pdf')) ? await extractPDF(file) : await extractWord(file);
            document.getElementById('btn-ai').disabled = false;
            document.getElementById('btn-ai').innerText = "LANCER L'ANALYSE IA";
        }
    }, 50);
};

window.processCourse = async () => {
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');

    const blocks = extractedText.match(/[\s\S]{1,2500}/g) || [];
    let summaryHtml = "<h2>📝 Résumé Structuré</h2>";
    let quizData = [];

    for (let i = 0; i < blocks.length; i++) {
        let p = Math.round(((i + 1) / blocks.length) * 100);
        document.getElementById('ia-fill').style.width = p + "%";
        document.getElementById('ia-perc').innerText = p + "%";
        document.getElementById('ia-done').innerText = `Vérifié : ${p}%`;
        document.getElementById('ia-rem').innerText = `Reste : ${100 - p}%`;
        document.getElementById('ia-eta').innerText = `Estimation : ~${Math.ceil((blocks.length - i) * 0.2)} min`;

        const res = await summarizer(blocks[i], { max_new_tokens: 150 });
        const text = res[0].summary_text;
        
        summaryHtml += `
            <div class="summary-chapter">
                <h3>Titre : Section ${i+1}</h3>
                <p>${text.split('.')[0]}.</p>
                <ul>
                    <li>Analyse : ${text.substring(0, 100)}...</li>
                    <li>Détail : Extraction des points clés terminée.</li>
                </ul>
            </div>`;

        // Génération Quiz (max 30)
        if (quizData.length < 30) {
            quizData.push({ q: `Selon la section ${i+1}, quelle est l'idée principale ?`, a: text.substring(0, 60) });
        }
    }

    document.getElementById('summary-result').innerHTML = summaryHtml;
    
    let qHtml = "<h2>❓ Quiz Corrigé</h2>";
    quizData.forEach((item, idx) => {
        qHtml += `
            <div class="quiz-card">
                <span class="quiz-question">${idx+1}. ${item.q}</span>
                <div class="option correct">${item.a}</div>
                <div class="option">Une conclusion erronée du chapitre.</div>
                <div class="option">Une information non mentionnée.</div>
            </div>`;
    });
    document.getElementById('quiz-result').innerHTML = qHtml;
    document.getElementById('btn-result').classList.remove('hidden');
};

async function extractPDF(file) {
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    let t = "";
    for (let i = 1; i <= pdf.numPages; i++) {
        const p = await pdf.getPage(i);
        const c = await p.getTextContent();
        t += c.items.map(it => it.str).join(" ") + " ";
    }
    return t;
}

async function extractWord(file) {
    const ab = await file.arrayBuffer();
    const r = await mammoth.extractRawText({ arrayBuffer: ab });
    return r.value;
}

window.showResults = () => document.getElementById('results-container').classList.remove('hidden');

initIA();
