// ==========================================
// 1. CONFIGURATION (Votre version fonctionnelle)
// ==========================================
let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');

// URL vérifiée fonctionnelle pour votre clé du 18 Mars
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

let extractedText = "";

// Utilitaires d'affichage
function updateBar(id, percId, value) {
    const bar = document.getElementById(id);
    const text = document.getElementById(percId);
    if (bar) bar.style.width = value + "%";
    if (text) text.innerText = value + "%";
}

function showLoading(show) {
    const loader = document.getElementById('ai-loading-fancy');
    if (loader) {
        if (show) loader.classList.remove('hidden');
        else loader.classList.add('hidden');
    }
}

// ==========================================
// 2. GESTION DU FICHIER (PDF/WORD)
// ==========================================
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Réinitialisation visuelle
    document.getElementById('upload-status-container').classList.remove('hidden');
    document.getElementById('ia-detail-container').classList.add('hidden');
    document.getElementById('results-container').classList.add('hidden');
    document.getElementById('btn-result').classList.add('hidden');
    updateBar('upload-fill', 'upload-perc', 0);
    updateBar('ia-fill', 'ia-perc', 0);

    try {
        updateBar('upload-fill', 'upload-perc', 20);
        
        if (file.name.endsWith('.pdf')) {
            extractedText = await extractPDF(file);
        } else if (file.name.endsWith('.docx')) {
            extractedText = await extractWord(file);
        } else {
            alert("Format non supporté (utilisez PDF ou DOCX)");
            return;
        }

        updateBar('upload-fill', 'upload-perc', 100);
        
        // Active le bouton d'analyse
        const btnAi = document.getElementById('btn-ai');
        btnAi.disabled = false;
        btnAi.style.opacity = "1";
        btnAi.style.cursor = "pointer";
        btnAi.innerText = "🚀 ANALYSER LE COURS";

    } catch (err) {
        console.error(err);
        alert("Erreur lors de la lecture du fichier.");
    }
};

// ==========================================
// 3. ANALYSE PAR L'IA (Moteur Gemini 2.5)
// ==========================================
window.processCourse = async () => {
    if (!extractedText) return;

    // Affichage zone IA et Masquage bouton analyse
    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');
    
    // 🔥 AJOUT : Affiche le chargement animé "Fancy"
    showLoading(true);
    updateBar('ia-fill', 'ia-perc', 10); // Début de l'envoi

    // Prompt optimisé pour garantir le format JSON
    const promptText = `Agis en tant qu'expert pédagogique. Analyse le texte suivant pour générer un résumé structuré et un quiz de 5 questions.
    Tu dois impérativement répondre au format JSON pur, sans texte avant ou après, en respectant cette structure :
    {"titre":"...", "intro":"...", "points":["..."], "quiz":[{"q":"...", "correct":"...", "wrong":["..."]}]}
    
    Contenu du cours : ${extractedText.substring(0, 20000)}`; // Limite à 20k caractères pour la stabilité

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        const data = await response.json();
        
        if (data.error) throw new Error(data.error.message);

        // Récupération du texte brut
        const rawText = data.candidates[0].content.parts[0].text;
        
        // 🔥 NETTOYAGE SÉCURISÉ DU JSON (Pour éviter le plantage au clic)
        // L'IA ajoute souvent des blocs de code ```json ... ```, on les retire.
        const start = rawText.indexOf('{');
        const end = rawText.lastIndexOf('}') + 1;
        if (start === -1 || end === 0) throw new Error("Format de réponse IA invalide (pas de JSON trouvé).");
        
        const cleanJsonString = rawText.substring(start, end);
        const finalData = JSON.parse(cleanJsonString);

        // ✅ SUCCÈS : Mise à jour des barres et affichage du bouton vert
        updateBar('ia-fill', 'ia-perc', 100);
        showLoading(false); // Cache le chargement

        // Pré-remplit les résultats en mémoire
        renderResults(finalData);

        // Affiche le bouton vert "Voir Résumé"
        document.getElementById('btn-result').classList.remove('hidden');

    } catch (err) {
        showLoading(false);
        console.error("Erreur IA:", err);
        alert("⚠️ L'analyse a échoué. Gemini a peut-être refusé le contenu ou le format est incorrect. Réessayez.");
        document.getElementById('btn-ai').classList.remove('hidden');
        document.getElementById('ia-detail-container').classList.add('hidden');
    }
};

// ==========================================
// 4. MOTEURS TECHNIQUES (PDF/Word)
// ==========================================
async function extractPDF(file) {
    // Configuration Worker PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(" ") + " ";
        // Mise à jour progressive barre upload (optionnel)
        updateBar('upload-fill', 'upload-perc', Math.round((i / pdf.numPages) * 100));
    }
    return text;
}

async function extractWord(file) {
    const arrayBuffer = await file.arrayBuffer();
    // Utilisation de Mammoth.js
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
}

// ==========================================
// 5. AFFICHAGE DES RÉSULTATS (Génère le HTML)
// ==========================================
function renderResults(data) {
    const summaryDiv = document.getElementById('summary-result');
    const quizDiv = document.getElementById('quiz-result');

    // ✅ Génération du Résumé
    summaryDiv.innerHTML = `
        <div class="summary-card" style="background: rgba(99, 102, 241, 0.1); padding: 20px; border-radius: 12px; border-left: 4px solid #6366f1;">
            <h2 style="color: #818cf8; margin-bottom: 10px;">📚 ${data.titre || 'Résumé du Cours'}</h2>
            <p style="font-style: italic; color: #cbd5e1; margin-bottom: 15px;">${data.intro || ''}</p>
            <ul style="color: #94a3b8; padding-left: 20px;">
                ${(data.points || []).map(point => `<li style="margin-bottom: 8px;">${point}</li>`).join('')}
            </ul>
        </div>
    `;

    // ✅ Génération du Quiz
    let quizHtml = "<h2 style='margin: 25px 0 15px 0; color: #e2e8f0;'>❓ Quiz d'Auto-Évaluation</h2>";
    (data.quiz || []).forEach((q, index) => {
        quizHtml += `
            <div class="quiz-item" style="background: #1e293b; padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 1px solid #334155;">
                <p style="color: #f1f5f9; font-weight: bold; margin-bottom: 10px;">${index + 1}. ${q.q}</p>
                <div class="option correct" style="color: #4ade80; background: rgba(74, 222, 128, 0.1); padding: 8px; border-radius: 6px; margin-bottom: 5px;">✅ ${q.correct}</div>
                ${(q.wrong || []).map(w => `<div class="option wrong" style="color: #94a3b8; padding: 5px 8px;">❌ ${w}</div>`).join('')}
            </div>
        `;
    });
    quizDiv.innerHTML = quizHtml;
}

// ==========================================
// 6. ACTIONS UTILISATEUR FINALES
// ==========================================
window.showResults = () => {
    // Affiche la zone de résultats
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.classList.remove('hidden');
    
    // Scroll fluide vers les résultats
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
};

window.resetApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    alert("Clé API effacée. La page va recharger.");
    location.reload();
};
