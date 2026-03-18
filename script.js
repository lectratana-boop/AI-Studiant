let GEMINI_API_KEY = localStorage.getItem('gemini_api_key');
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
let extractedText = "";

// 4. GESTION DU TEMPS ET DE LA PROGRESSION FLUIDE
function startFluidProgress(durationSeconds) {
    let currentPerc = 0;
    const interval = (durationSeconds * 1000) / 100;
    
    const timer = setInterval(() => {
        currentPerc++;
        const timeLeft = Math.ceil(durationSeconds - (currentPerc * durationSeconds / 100));
        
        updateBar('ia-fill', 'ia-perc', currentPerc);
        document.getElementById('timer-text').innerText = `Temps estimé : ~${timeLeft}s restantes`;

        if (currentPerc >= 95) clearInterval(timer); // On bloque à 95% en attendant la réponse réelle
    }, interval);
    
    return timer;
}

window.processCourse = async () => {
    if (!extractedText) return;

    document.getElementById('ia-detail-container').classList.remove('hidden');
    document.getElementById('btn-ai').classList.add('hidden');
    
    // On lance une progression fluide sur 15 secondes
    const progressTimer = startFluidProgress(15);

    // 3. PROMPT IA RENFORCÉ (Sécurité Professeur)
    const promptText = `Tu es un assistant pédagogique strict. 
    1. Résume le texte suivant en utilisant des titres colorés pour chaque section.
    2. Crée un quiz de 5 questions basées UNIQUEMENT sur les informations présentes dans le texte fourni. Ne pas utiliser de connaissances externes.
    
    Format JSON obligatoire :
    {"titre":"...", "sections":[{"nom":"...", "content":"..."}], "quiz":[{"q":"...", "correct":"...", "wrong":["..."]}]}
    
    Texte du cours : ${extractedText.substring(0, 15000)}`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        const data = await response.json();
        clearInterval(progressTimer); // Arrête le chrono

        if (data.error) throw new Error(data.error.message);

        // Finalisation à 100%
        updateBar('ia-fill', 'ia-perc', 100);
        document.getElementById('timer-text').innerText = "Analyse terminée !";

        const rawText = data.candidates[0].content.parts[0].text;
        const cleanJson = JSON.parse(rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1));

        renderResults(cleanJson);
        document.getElementById('btn-result').classList.remove('hidden');

    } catch (err) {
        clearInterval(progressTimer);
        alert("Erreur : " + err.message);
    }
};

// 1 & 2. AFFICHAGE PAR ONGLET ET COULEURS
function renderResults(data) {
    const sumDiv = document.getElementById('summary-result');
    // Titre principal
    let html = `<h2 style="color:#818cf8; border-bottom:2px solid #6366f1; padding-bottom:10px;">${data.titre}</h2>`;
    
    // Sections colorées
    data.sections.forEach(sec => {
        html += `
            <div style="margin-top:20px;">
                <h3 style="color:#4ade80; margin-bottom:5px;">📍 ${sec.nom}</h3>
                <p style="color:#cbd5e1; line-height:1.6;">${sec.content}</p>
            </div>
        `;
    });
    sumDiv.innerHTML = html;

    // Quiz (caché par défaut dans son onglet)
    let qHtml = "<h2 style='color:#f59e0b;'>❓ Quiz du cours</h2>";
    data.quiz.forEach((q, i) => {
        qHtml += `
            <div style="background:#1e293b; padding:15px; border-radius:10px; margin-bottom:10px; border-left:4px solid #f59e0b;">
                <p><b>${i+1}. ${q.q}</b></p>
                <div style="color:#4ade80; margin-top:5px;">✓ ${q.correct}</div>
            </div>
        `;
    });
    document.getElementById('quiz-result').innerHTML = qHtml;
}

// Navigation entre onglets
window.switchTab = (type) => {
    const isSum = type === 'sum';
    document.getElementById('summary-content').classList.toggle('hidden', !isSum);
    document.getElementById('quiz-content').classList.toggle('hidden', isSum);
    document.getElementById('tab-sum').style.background = isSum ? '#6366f1' : '#334155';
    document.getElementById('tab-quiz').style.background = isSum ? '#334155' : '#6366f1';
};

function updateBar(id, percId, value) {
    const bar = document.getElementById(id);
    const text = document.getElementById(percId);
    if(bar) bar.style.width = value + "%";
    if(text) text.innerText = value + "%";
}
