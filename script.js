// --- Initialisation des données ---
let userRole = 'USER';
let db = JSON.parse(localStorage.getItem('appAI_DB')) || {
    subjects: [],
    tokens: 1,
    pendingPurchases: []
};

// --- Gestion de la connexion ---
function setRole(role) {
    userRole = role;
    document.getElementById('btn-admin-role').className = role === 'ADMIN' ? 'selected' : '';
    document.getElementById('btn-user-role').className = role === 'USER' ? 'selected' : '';
}

function handleLogin() {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;

    if (userRole === 'ADMIN' && u === 'ADMIN' && p === 'Andy2030@@') {
        startApp(true);
    } else if (userRole === 'USER' && u === 'USER' && p === '123456') {
        startApp(false);
    } else {
        alert("Identifiants incorrects !");
    }
}

function startApp(isAdmin) {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('main-app').classList.add('active');
    if (isAdmin) {
        document.getElementById('nav-admin').classList.remove('hidden');
        renderAdmin();
    }
    updateTokenUI();
    renderSubjects();
}

// --- Navigation Onglets ---
function changeTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
}

// --- Logique Analyse & Gemini ---
function triggerUpload() {
    document.getElementById('file-input').click();
}

document.getElementById('file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.size <= 500 * 1024 * 1024) {
        simulateProgress('up-progress', () => {
            const btn = document.getElementById('btn-upload');
            btn.innerText = "Upload Fini 100%";
            btn.style.backgroundColor = "yellow";
            btn.style.color = "black";
            document.getElementById('btn-analyse').classList.remove('hidden');
        });
    } else {
        alert("Fichier trop gros (>500Mo)");
    }
});

async function startGeminiAnalysis() {
    const key = document.getElementById('gemini-api-key').value;
    if (!key) return alert("Veuillez entrer votre clé API Gemini à l'accueil.");
    if (db.tokens <= 0) return alert("Tokens épuisés ! Achetez-en dans l'onglet Achat.");

    simulateProgress('ai-progress', async () => {
        const btn = document.getElementById('btn-analyse');
        btn.innerText = "Analyse Finie 100%";
        btn.style.backgroundColor = "green";
        
        // Appel API Gemini réel
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Fais un résumé long et un quiz QCM (1 bonne réponse rose vif, 3 fausses) sur ce cours." }] }]
                })
            });
            const data = await response.json();
            db.tokens--;
            saveDB();
            updateTokenUI();
            
            // Simulation de stockage du résultat
            db.lastResult = {
                resume: "<h1>Résumé du cours</h1><p>Contenu analysé par l'IA...</p>",
                quiz: "<span class='question-title'>Question 1: ...</span><br><span class='correct-answer'>Rép A</span><br><span>Rép B</span>"
            };
            document.getElementById('results-zone').classList.remove('hidden');
        } catch (e) { alert("Erreur API"); }
    });
}

function showView(type) {
    const display = document.getElementById('display-text');
    display.innerHTML = type === 'resume' ? db.lastResult.resume : db.lastResult.quiz;
}

// --- Utilitaires ---
function simulateProgress(id, callback) {
    const div = document.getElementById(id);
    const bar = div.querySelector('.bar');
    const span = div.querySelector('span');
    div.style.display = "block";
    let p = 0;
    let inv = setInterval(() => {
        p += 5;
        bar.style.width = p + "%";
        span.innerText = p + "%";
        if (p >= 100) { clearInterval(inv); callback(); }
    }, 100);
}

function saveDB() { localStorage.setItem('appAI_DB', JSON.stringify(db)); }
function updateTokenUI() { document.getElementById('token-count').innerText = db.tokens; }

// --- Fonctions Admin ---
function renderAdmin() {
    const list = document.getElementById('admin-req-list');
    list.innerHTML = db.pendingPurchases.map((r, i) => `
        <tr><td>${r.user}</td><td>${r.type}</td><td>${r.ref}</td>
        <td><button onclick="approve(${i})">+</button></td></tr>
    `).join('');
}

function approve(i) {
    db.tokens += db.pendingPurchases[i].qty;
    db.pendingPurchases.splice(i, 1);
    saveDB();
    renderAdmin();
    updateTokenUI();
}
