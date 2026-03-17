// Fonction principale pour traiter le cours avec une IA puissante (ex: Gemini)
window.processCourse = async () => {
    const btnAi = document.getElementById('btn-ai');
    const container = document.getElementById('ia-detail-container');
    
    container.classList.remove('hidden');
    btnAi.classList.add('hidden');

    // On prépare les données à envoyer à l'IA "cachée"
    const requestData = {
        text: extractedText,
        subject: document.getElementById('current-subject-title').innerText,
        format: "structured_summary_and_quiz"
    };

    try {
        // Simulation de la progression pendant que l'IA réfléchit
        let progress = 0;
        const progInterval = setInterval(() => {
            if(progress < 95) {
                progress += 1;
                updateIAProgress(progress);
            }
        }, 200);

        // APPEL À VOTRE API (Gemini / GPT)
        // Remplacez 'VOTRE_URL_BACKEND' par votre lien de serveur
        const response = await fetch('VOTRE_URL_BACKEND/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();
        clearInterval(progInterval);
        updateIAProgress(100);

        // Affichage des résultats reçus de l'IA puissante
        displayAIFinalResults(result);

    } catch (error) {
        console.error("Erreur API:", error);
        alert("L'IA n'a pas pu répondre. Vérifiez votre connexion serveur.");
    }
};

function updateIAProgress(p) {
    document.getElementById('ia-fill').style.width = p + "%";
    document.getElementById('ia-perc').innerText = p + "%";
    document.getElementById('ia-done').innerText = `Analyse intelligente : ${p}%`;
}

function displayAIFinalResults(data) {
    // L'IA renvoie maintenant un objet propre
    document.getElementById('summary-result').innerHTML = `
        <div class="summary-chapter">
            <h3>Titre : ${data.title}</h3>
            <p>${data.summary_intro}</p>
            <ul>
                ${data.key_points.map(point => `<li>${point}</li>`).join('')}
            </ul>
        </div>
    `;

    let quizHtml = "<h2>❓ Quiz de Validation</h2>";
    data.quiz.forEach((q, idx) => {
        quizHtml += `
            <div class="quiz-card">
                <span class="quiz-question">${idx+1}. ${q.question}</span>
                <div class="option correct">${q.correct_answer}</div>
                ${q.wrong_answers.map(w => `<div class="option">${w}</div>`).join('')}
            </div>
        `;
    });
    
    document.getElementById('quiz-result').innerHTML = qHtml;
    document.getElementById('btn-result').classList.remove('hidden');
}
