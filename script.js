async function startAIAnalysis() {
    const apiKey = document.getElementById('api-code').value;
    if (!apiKey) return alert("Veuillez saisir votre Code API dans l'onglet Accueil.");

    // Vérification des tokens (1 gratuit par jour ou tokens achetés)
    if (userData.tokens <= 0) {
        return alert("Vous n'avez plus de tokens. Veuillez en acheter dans l'onglet ACHAT.");
    }

    const btnAnalyze = document.getElementById('btn-analyze');
    const progressBar = document.getElementById('analyze-progress');
    const fill = progressBar.querySelector('.fill');
    
    progressBar.classList.remove('hidden');
    btnAnalyze.disabled = true;

    try {
        // Simulation visuelle de progression pendant l'appel API
        let prog = 0;
        const interval = setInterval(() => {
            if (prog < 90) prog += 2;
            fill.style.width = prog + '%';
        }, 200);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Analyse ce texte et donne-moi un résumé long structuré avec des titres en gras et un quiz QCM de 10 à 30 questions (1 bonne réponse, 3 mauvaises). Format JSON attendu." }]
                }]
            })
        });

        const data = await response.json();
        clearInterval(interval);
        fill.style.width = '100%';

        // Une fois fini, on déduis un token
        userData.tokens -= 1;
        saveData();
        
        displayResults(data);
        btnAnalyze.style.backgroundColor = "green";
        document.getElementById('results-area').classList.remove('hidden');

    } catch (error) {
        alert("Erreur lors de l'analyse : " + error.message);
    }
}
