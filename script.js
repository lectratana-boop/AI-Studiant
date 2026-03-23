let currentRole = 'USER';
let selectedPackData = null;
let appData = JSON.parse(localStorage.getItem('ai_cours_db')) || {
    subjects: {},
    tokens: 1, // 1 gratuit par jour
    history: [],
    requests: []
};

// --- AUTHENTIFICATION (Point 2) ---
function selectRole(role) {
    currentRole = role;
    document.getElementById('role-admin').classList.toggle('selected', role === 'ADMIN');
    document.getElementById('role-user').classList.toggle('selected', role === 'USER');
}

function attemptLogin() {
    const id = document.getElementById('login-id').value;
    const pass = document.getElementById('login-pass').value;

    if (currentRole === 'ADMIN' && id === 'ADMIN' && pass === 'Andy2030@@') {
        document.getElementById('nav-admin-btn').classList.remove('hidden');
        enterApp();
    } else if (currentRole === 'USER' && id === 'USER' && pass === '123456') {
        enterApp();
    } else {
        alert("Erreur de login");
    }
}

function enterApp() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('main-app').classList.add('active');
    updateUI();
}

// --- ANALYSE (Points 5, 6, 7) ---
async function runGeminiAI() {
    const apiKey = document.getElementById('user-api').value;
    if (!apiKey) return alert("Entrez votre code API !");
    if (appData.tokens <= 0) return alert("Plus de tokens. Achetez-en !");

    const btn = document.getElementById('btn-run-ai');
    progressEffect('load-ai', 100, () => {
        btn.style.backgroundColor = "green";
        btn.innerText = "Analyse Finie 100%";
        appData.tokens--;
        
        // Simuler stockage résultat (Point 8)
        appData.lastResult = {
            resume: "<h3 class='res-title'>Titre du cours</h3><p>Résumé détaillé...</p>",
            quiz: "<span class='quiz-q'>Q1: Quelle est la capitale ?</span><br><span class='correct'>Antananarivo</span><br><span>Paris</span>"
        };
        save();
        document.getElementById('final-buttons').classList.remove('hidden');
    });
}

function progressEffect(elemId, target, callback) {
    let p = 0;
    const bar = document.querySelector(`#${elemId} .fill`);
    const txt = document.querySelector(`#${elemId} span`);
    const interval = setInterval(() => {
        p += 5;
        bar.style.width = p + "%";
        txt.innerText = p + "%";
        if (p >= target) { clearInterval(interval); callback(); }
    }, 100);
}

// --- ACHAT (Point 11) ---
function selectPack(name, price, qty) {
    selectedPackData = { name, price, qty };
    document.getElementById('payment-details').classList.remove('hidden');
}

function submitPurchase() {
    const ref = document.getElementById('ref-trans').value;
    const user = document.getElementById('user-name').value || "Inconnu";
    appData.requests.push({ user, type: selectedPackData.name, ref, qty: selectedPackData.qty });
    save();
    alert("Demande envoyée à l'ADMIN");
}

// --- ADMIN (Point 12) ---
function finalAdminValidate() {
    // Logique pour créditer les tokens à l'utilisateur ciblé
    alert("Tokens ajoutés avec succès !");
}

function save() { localStorage.setItem('ai_cours_db', JSON.stringify(appData)); updateUI(); }
function updateUI() { document.getElementById('token-display').innerText = appData.tokens; }

function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active');
}
