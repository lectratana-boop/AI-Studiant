// Variable pour stocker tous les cours
let dbCourses = JSON.parse(localStorage.getItem('ai_studiant_db')) || [];

// 1. SAUVEGARDER UN RÉSULTAT
function saveCourse(fileName, subject, summaryData) {
    const newCourse = {
        id: Date.now(),
        name: fileName,
        subject: subject,
        data: summaryData // Contient le résumé et le quiz
    };
    
    dbCourses.push(newCourse);
    localStorage.setItem('ai_studiant_db', JSON.stringify(dbCourses));
    renderHistory();
}

// 2. AFFICHER L'HISTORIQUE SELON LA MATIÈRE
function renderHistory() {
    const subject = document.getElementById('current-subject').value;
    const list = document.getElementById('history-list');
    const filtered = dbCourses.filter(c => c.subject === subject);
    
    list.innerHTML = "";
    if(filtered.length === 0) {
        list.innerHTML = `<p style="font-size: 0.8em; color: #475569;">Aucun cours en ${subject}</p>`;
        return;
    }

    filtered.forEach(course => {
        const item = document.createElement('div');
        item.style = "background: #1e293b; padding: 12px; border-radius: 8px; cursor: pointer; border-left: 4px solid #6366f1; display: flex; justify-content: space-between;";
        item.innerHTML = `<span>📄 ${course.name}</span> <i class="fas fa-chevron-right"></i>`;
        item.onclick = () => loadCourse(course.id);
        list.appendChild(item);
    });
}

// 3. CHARGER UN COURS SANS REFAIRE L'ANALYSE
window.loadCourse = (id) => {
    const course = dbCourses.find(c => c.id === id);
    if(course) {
        renderResults(course.data); // Affiche directement le résumé/quiz stocké
        document.getElementById('results-container').classList.remove('hidden');
        document.getElementById('btn-result').classList.remove('hidden');
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
};

// Écouteur pour changer de matière
document.getElementById('current-subject').addEventListener('change', renderHistory);

// Appeler renderHistory au démarrage
document.addEventListener('DOMContentLoaded', renderHistory);
