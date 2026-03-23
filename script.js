let role = "";
let tokens = 1;

function selectRole(r) {
  role = r;
  document.getElementById("choicePage").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
}

function login() {
  const u = document.getElementById("username").value;
  const p = document.getElementById("password").value;

  if (role === "admin" && u === "ADMIN" && p === "Andy2030@@") {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    document.getElementById("adminTab").classList.remove("hidden");
  }

  if (role === "user" && u === "USER" && p === "123456") {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("userInfoPage").classList.remove("hidden");
  }
}

function enterApp() {
  document.getElementById("userInfoPage").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

function showTab(tab) {
  document.querySelectorAll(".tab").forEach(t => t.classList.add("hidden"));
  document.getElementById(tab).classList.remove("hidden");
}

function addSubject() {
  let name = prompt("Nom matière ?");
  let div = document.createElement("div");
  div.className = "subject";
  div.innerHTML = `
    <h3>${name}</h3>
    <input type="file" onchange="uploadFile(this)">
    <button class="analyse hidden" onclick="analyse(this)">Analyse</button>
    <button class="hidden" onclick="showResult(this)">Résumé - Quiz</button>
  `;
  document.getElementById("subjects").appendChild(div);
}

function uploadFile(input) {
  let file = input.files[0];

  if (file.size > 500 * 1024 * 1024) {
    alert("Fichier trop lourd !");
    return;
  }

  let btn = input.nextElementSibling;
  let progress = 0;

  let interval = setInterval(() => {
    progress += 10;
    if (progress >= 100) {
      clearInterval(interval);
      btn.classList.remove("hidden");
    }
  }, 200);
}

function analyse(btn) {
  if (tokens <= 0) {
    alert("Plus de token !");
    return;
  }

  tokens--;

  let progress = 0;
  let interval = setInterval(() => {
    progress += 10;
    if (progress >= 100) {
      clearInterval(interval);
      btn.classList.add("done");

      let resultBtn = btn.nextElementSibling;
      resultBtn.classList.remove("hidden");

      let data = {
        resume: "Résumé long du cours...",
        quiz: [
          {
            q: "Question 1 ?",
            correct: "Bonne réponse",
            wrong: ["A", "B", "C"]
          }
        ]
      };

      localStorage.setItem("result", JSON.stringify(data));
    }
  }, 300);
}

function showResult(btn) {
  let data = JSON.parse(localStorage.getItem("result"));

  let html = `<h3>Résumé</h3><p>${data.resume}</p>`;
  html += `<h3>Quiz</h3>`;

  data.quiz.forEach(q => {
    html += `<p>${q.q}</p>`;
    html += `<p class="correct">${q.correct}</p>`;
    q.wrong.forEach(w => html += `<p>${w}</p>`);
  });

  document.body.innerHTML = html;
}

function buyToken() {
  document.getElementById("payment").classList.remove("hidden");
}

function confirmPayment() {
  tokens += 5;
  alert("Token ajouté !");
}
