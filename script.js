let currentRole = 'USER';
let db = JSON.parse(localStorage.getItem('ai_cours_data')) || { tokens: 1, subjects: [] };

function selectRole(role) {
    currentRole = role;
    document.getElementById('role-admin').classList.toggle('selected', role === 'ADMIN');
    document.getElementById('role-user').classList.toggle('selected', role === 'USER');
}

function attemptLogin() {
    const user = document.getElementById('login-id').value;
    const pass = document.getElementById('login-pass').value;

    if (currentRole === 'ADMIN' && user === 'ADMIN' && pass === 'Andy2030@@') {
        document.getElementById('admin-nav').classList.remove('hidden');
        loginSuccess();
    } else if (currentRole === 'USER' && user === 'USER' && pass === '123456') {
        loginSuccess();
    } else {
        alert("Identifiants incorrects !");
    }
}

function loginSuccess() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('main-app').classList.add('active');
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
}

// Simulation Upload (Point 5)
function handleFileUpload(input) {
    const file = input.files[0];
    if (file.size > 500 * 1024 * 1024) return alert("Fichier trop gros !");

    const upProgress = document.getElementById('up-progress');
    const bar = upProgress.querySelector('.progress-bar');
    const span = upProgress.querySelector('span');
    
    upProgress.classList.remove('hidden');
    let p = 0;
    let inv = setInterval(() => {
        p += 10;
        bar.style.width = p + "%";
        span.innerText = p + "%";
        if (p >= 100) {
            clearInterval(inv);
            const btn = document.getElementById('btn-upload');
            btn.classList.add('btn-yellow');
            btn.innerText = "Upload Fini 100%";
            document.getElementById('btn-analyze').classList.remove('hidden');
        }
    }, 200);
}

// Analyse Gemini (Point 6-7)
function startAnalysis() {
    const aiProgress = document.getElementById('ai-progress');
    const bar = aiProgress.querySelector('.ai-bar');
    const span = aiProgress.querySelector('span');
    
    aiProgress.classList.remove('hidden');
    let p = 0;
    let inv = setInterval(() => {
        p += 5;
        bar.style.width = p + "%";
        span.innerText = p + "%";
        if (p >= 100) {
            clearInterval(inv);
            document.getElementById('btn-analyze').style.background = "#28a745";
            document.getElementById('btn-analyze').innerText = "Analyse Finie 100%";
            document.getElementById('final-results-nav').classList.remove('hidden');
            saveResult();
        }
    }, 150);
}

function saveResult() {
    db.lastResult = {
        resume: "<h2>Titre du cours</h2><p>Ceci est un résumé long du cours...</p>",
        quiz: "<span class='quiz-question'>Question 1: Quelle est la couleur du ciel ?</span><br><span class='correct-ans'>1. Bleu</span><br><span>2. Vert</span>"
    };
    localStorage.setItem('ai_cours_data', JSON.stringify(db));
}

function showContent(type) {
    const win = document.getElementById('display-window');
    win.classList.remove('hidden');
    win.innerHTML = type === 'resume' ? db.lastResult.resume : db.lastResult.quiz;
}
