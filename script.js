// Remplacez VOTRE_CLE_API par votre clé obtenue sur Google AI Studio
const GEMINI_API_KEY = "VOTRE_CLE_API";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

window.processCourse = async () => {
    const btnAi = document.getElementById('btn-ai');
    const container = document.getElementById('ia-detail-container');
    
    container.classList.remove('hidden');
    btnAi.classList.add('hidden');

    // Le Prompt "Caché" qui définit la qualité du résumé et du quiz
    const promptInstructions = `
        Analyse ce cours : "${extractedText.substring(0, 10000)}"
        Tu dois générer un résumé structuré et un quiz de 10 à 30 questions.
        Réponds UNIQUEMENT au format JSON suivant :
        {
          "titre": "Titre du chapitre",
          "introduction": "Résumé global court",
          "points_cles": ["Point 1", "Point 2", "Point 3"],
          "quiz": [
            {
              "question": "Texte de la question",
              "correct": "La bonne réponse",
              "wrong": ["Mauvaise réponse 1", "Mauvaise réponse 2"]
            }
          ]
        }
        Important : Pour le résumé, utilise un style clair avec des listes à puces.
    `;

    try {
        // Animation de progression simulée
        let progress = 0;
        const interval = setInterval(() => {
            if(progress < 90) {
                progress += 2;
                updateUIPercentage(progress);
            }
        }, 100);

        // APPEL À L'IA (GEMINI)
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptInstructions }] }]
            })
        });

        const data = await response.json();
        const aiResponseText = data.candidates[0].content.parts[0].text;
        
        // Nettoyage du JSON (au cas où l'IA ajoute des balises ```json)
        const cleanJson = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const finalData = JSON.parse(cleanJson);

        clearInterval(interval);
        updateUIPercentage(100);
        
        displayFinalResults(finalData);

    } catch (error) {
        console.error("Erreur IA:", error);
        alert("Erreur de connexion avec l'IA. Vérifiez votre clé API.");
    }
};

function updateUIPercentage(p) {
    document.getElementById('ia-fill').style.width = p + "%";
    document.getElementById('ia-perc').innerText = p + "%";
}

function displayFinalResults(data) {
    // Affichage du Résumé type "Structure des dents"
    let summaryHtml = `
        <div class="summary-chapter">
            <h3>Titre : ${data.titre}</h3>
            <p>${data.introduction}</p>
            <p><strong>Détails du cours :</strong></p>
            <ul>
                ${data.points_cles.map(pt => `<li>${pt}</li>`).join('')}
            </ul>
        </div>
    `;
    document.getElementById('summary-result').innerHTML = summaryHtml;

    // Affichage du Quiz Corrigé
    let quizHtml = "<h2>❓ Quiz Corrigé</h2>";
    data.quiz.forEach((q, i) => {
        quizHtml += `
            <div class="quiz-card">
                <span class="quiz-question">${i+1}. ${q.question}</span>
                <div class="option correct">${q.correct}</div>
                <div class="option">${q.wrong[0]}</div>
                <div class="option">${q.wrong[1]}</div>
            </div>
        `;
    });
    document.getElementById('quiz-result').innerHTML = quizHtml;
    document.getElementById('btn-result').classList.remove('hidden');
}
