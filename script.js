// ==========================================
// 7. GESTION DES ONGLETS (TABS)
// ==========================================
window.switchTab = (type) => {
    const isSum = type === 'sum';
    
    // Bascule l'affichage des contenus
    document.getElementById('summary-content').classList.toggle('hidden', !isSum);
    document.getElementById('quiz-content').classList.toggle('hidden', isSum);
    
    // Change l'apparence des boutons
    document.getElementById('tab-sum').classList.toggle('active', isSum);
    document.getElementById('tab-quiz').classList.toggle('active', !isSum);
    
    // Scroll léger pour mobile
    window.scrollTo({ top: document.getElementById('results-container').offsetTop - 20, behavior: 'smooth' });
};

// ==========================================
// 8. PROGRESSION FLUIDE ET COMPTE À REBOURS
// ==========================================
function startFluidProgress(durationSeconds) {
    let currentPerc = 0;
    const intervalTime = (durationSeconds * 1000) / 100;
    const timerText = document.getElementById('timer-text');
    
    const timer = setInterval(() => {
        currentPerc++;
        
        // Calcul du temps restant approximatif
        const timeLeft = Math.ceil(durationSeconds - (currentPerc * durationSeconds / 100));
        
        // Mise à jour de la barre et du texte
        updateBar('ia-fill', 'ia-perc', currentPerc);
        if (timerText) {
            timerText.innerText = `⏳ Analyse en cours... ~${timeLeft}s restantes`;
        }

        // On bloque à 98% pour attendre la réponse réelle de l'API
        if (currentPerc >= 98) {
            clearInterval(timer);
            if (timerText) timerText.innerText = "✨ Finalisation du résumé...";
        }
    }, intervalTime);
    
    return timer;
}

// NOTE : Dans votre fonction processCourse(), 
// n'oubliez pas d'appeler : const progressTimer = startFluidProgress(15);
// Et de faire : clearInterval(progressTimer); dès que vous recevez la réponse.
