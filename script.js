let role = "";
let tokens = 1;

// ROLE
function selectRole(r) {
  role = r;
  choicePage.classList.add("hidden");
  loginPage.classList.remove("hidden");
}

// LOGIN
function login() {
  if (role === "admin" && username.value === "ADMIN" && password.value === "Andy2030@@") {
    startApp(true);
  } else if (role === "user" && username.value === "USER" && password.value === "123456") {
    loginPage.classList.add("hidden");
    userSetup.classList.remove("hidden");
  } else {
    alert("Erreur");
  }
}

// SAVE USER
function saveUser() {
  localStorage.setItem("user", name.value);
  userSetup.classList.add("hidden");
  startApp(false);
}

// START
function startApp(isAdmin) {
  mainApp.classList.remove("hidden");
  if (!isAdmin) adminBtn.style.display = "none";
  else loadAdmin();
}

// TAB
function showTab(tab) {
  document.querySelectorAll(".tab").forEach(t => t.classList.add("hidden"));
  document.getElementById(tab).classList.remove("hidden");
}

// ADD SUBJECT
function addSubject() {
  let name = prompt("Nom matière ?");
  let div = document.createElement("div");
  div.className = "subject";

  div.innerHTML = `
    <h3>${name}</h3>

    <button class="red" onclick="this.parentElement.remove()">Delete Matière</button>

    <input type="file" onchange="uploadFile(event,this)">
    <button class="yellow" onclick="deleteFile(this)">Delete Fichier</button>

    <div class="progress"></div>
    <div class="actions"></div>
    <div class="resultBox"></div>
  `;

  subjects.appendChild(div);
}

// DELETE FILE
function deleteFile(btn) {
  let parent = btn.parentElement;
  parent.querySelector("input").value = "";
  parent.querySelector(".progress").innerHTML = "";
  parent.querySelector(".actions").innerHTML = "";
  parent.querySelector(".resultBox").innerHTML = "";
}

// UPLOAD
function uploadFile(e, el) {
  let file = e.target.files[0];
  if (!file) return;

  if (file.size > 500 * 1024 * 1024) {
    alert("Max 500Mo");
    return;
  }

  let progress = el.parentElement.querySelector(".progress");
  let actions = el.parentElement.querySelector(".actions");

  let p = 0;
  let interval = setInterval(() => {
    p += 10;
    progress.innerText = p + "%";

    if (p === 100) {
      clearInterval(interval);
      actions.innerHTML = `<button class="red" onclick="analyse(this)">Analyse</button>`;
    }
  }, 200);
}

// ANALYSE
function analyse(btn) {
  if (tokens <= 0) {
    alert("Acheter token !");
    return;
  }

  let parent = btn.parentElement.parentElement;
  let box = parent.querySelector(".resultBox");

  let p = 0;
  let interval = setInterval(() => {
    p += 20;
    box.innerHTML = "Analyse: " + p + "%";

    if (p === 100) {
      clearInterval(interval);
      tokens--;

      box.innerHTML = `
        <button class="green" onclick="showResume(this)">Résumé</button>
        <button class="green" onclick="showQuiz(this)">Quiz</button>
      `;
    }
  }, 300);
}

// RESUME
function showResume(btn) {
  let box = btn.parentElement;

  box.innerHTML += `
  <div class="resultBox">
    <h3 style="color:blue">Résumé</h3>
    <p><b style="color:purple">Chapitre 1:</b> Résumé long généré...</p>
    <p><b style="color:green">Chapitre 2:</b> Suite du cours...</p>
  </div>`;
}

// QUIZ
function showQuiz(btn) {
  let box = btn.parentElement;

  box.innerHTML += `
  <div class="resultBox">
    <h3 style="color:red">Quiz</h3>
    <p>1. Question ?</p>
    <p class="correct">✔ Bonne réponse</p>
    <p class="wrong">✖ Mauvaise</p>
    <p class="wrong">✖ Mauvaise</p>
    <p class="wrong">✖ Mauvaise</p>
  </div>`;
}

// TOKEN
function selectToken() {
  paymentBox.classList.remove("hidden");
}

function showRef() {
  refBox.classList.remove("hidden");
}

function confirmPayment() {
  let ref = refTrans.value;
  let user = localStorage.getItem("user");

  if (!ref) return alert("Entrer Ref");

  let logs = JSON.parse(localStorage.getItem("logs") || "[]");

  logs.push({ user, ref, type: "MORA", status: "pending" });

  localStorage.setItem("logs", JSON.stringify(logs));

  alert("Envoyé à ADMIN !");
}

// ADMIN
function loadAdmin() {
  let logs = JSON.parse(localStorage.getItem("logs") || "[]");

  adminLogs.innerHTML = logs.map((l, i) => `
    <div>
      ${l.user} - ${l.type} - ${l.ref}
      <button onclick="validateToken(${i})">Valider</button>
    </div>
  `).join("");
}

function validateToken(i) {
  let logs = JSON.parse(localStorage.getItem("logs"));
  logs[i].status = "done";
  localStorage.setItem("logs", JSON.stringify(logs));

  tokens += 5;
  alert("Token ajouté !");
  loadAdmin();
}
