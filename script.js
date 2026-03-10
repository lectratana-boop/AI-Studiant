window.handleFileUpload = (e) => {
    const file = e.target.files[0];
    const statusContainer = document.getElementById('upload-status-container');
    const fileInfo = document.getElementById('file-info');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    if (file) {
        // 1. Calcul du poids en Mo
        const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        fileInfo.innerText = `Fichier : ${file.name} (${fileSizeInMB} Mo)`;

        // 2. Vérification de la limite (50 Mo par exemple)
        if (file.size > 50 * 1024 * 1024) {
            alert("Erreur : Ce fichier dépasse la limite de 50 Mo !");
            return;
        }

        // 3. Animation de la barre de progression
        statusContainer.classList.remove('hidden');
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressFill.style.width = progress + "%";
            progressText.innerText = progress + "%";

            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => alert("Téléchargement terminé ! L'IA va analyser le texte."), 500);
            }
        }, 200); // Simule la vitesse de chargement
    }
};
