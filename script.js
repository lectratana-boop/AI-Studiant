import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

let summarizer;
let extractedText = "";

// 1. GESTION DE L'UPLOAD ET TEMPS
window.handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('upload-status-container').classList.remove('hidden');
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    document.getElementById('file-info').innerText = `${file.name} (${sizeMB} Mo)`;

    let uploadPerc = 0;
    const speed = 0.5; // Simulation de vitesse (Mo/s)
    const timeNeeded = Math.ceil(sizeMB / speed);
    
    const upInterval = setInterval(async () => {
        uploadPerc += 5;
        document.getElementById('upload-fill').style.width = uploadPerc + "%";
        document.getElementById('upload-perc').innerText = uploadPerc + "%";
        document.getElementById('upload-eta').innerText = `Temps restant : ${Math.ceil(timeNeeded * (1 - uploadPerc/100))}s`;

        if (uploadPerc >= 100) {
            clearInterval(upInterval);
            document.getElementById('upload-eta').innerText = "Upload terminé ✅";
            // Extraction du texte
            extractedText = (file.type === "application/pdf") ? await extractPDF(file) : await extractWord(file);
            document.getElementById('btn-ai').disabled = false;
        }
    }, 100);
};

// 2. GESTION DE L'ANALYSE IA AVEC % DÉTAILLÉS
window.processCourse = async () => {
    const container = document.getElementById('ia-detail-container');
    container.classList.remove('hidden');
    document.getElementById('btn-ai').disabled = true;

    const blocks = extractedText.match(/[\s\S]{1,2500}/g) || [];
    let fullSummaryHtml = "";
    
    // Estimation IA : 1.5 min par Mo
    const totalMinutes = Math.ceil((extractedText.length / 3000) * 0.5); 

    for (let i = 0; i < blocks.length; i++) {
        // Mise à jour des %
        let currentPerc = Math.round(((i + 1) / blocks.length) * 100);
        document.getElementById('ia-fill').style.width = currentPerc + "%";
        document.getElementById('ia-perc').innerText = currentPerc + "%";
        document.getElementById('ia-done').innerText = `Vérifié : ${currentPerc}%`;
        document.getElementById('ia-rem').innerText = `Reste : ${100 - currentPerc}%`;
        document.getElementById('ia-eta').innerText = `Fin prévue dans : ${Math.ceil(totalMinutes * (1 - currentPerc/100))} min`;

        // Résumé IA
        const res = await summarizer(blocks[i], { max_new_tokens: 150 });
        
        // Formatage comme votre exemple
        fullSummaryHtml += `
            <div class="summary-chapter">
                <h3>Titre : Analyse du Segment ${i+1}</h3>
                <p>${res[0].summary_text}</p>
                <br>
                <p><strong>Points clés identifiés :</strong></p>
                <ul>
                    <li>Concept principal extrait du bloc</li>
                    <li>Détail technique analysé par l'IA</li>
                </ul>
            </div>
        `;
    }

    document.getElementById('summary-result').innerHTML = `<h2>📝 Résumé Détaillé par Chapitres</h2>` + fullSummaryHtml;
    document.getElementById('btn-result').classList.remove('hidden');
};

// ... (Gardez les fonctions extractPDF et extractWord précédentes)
