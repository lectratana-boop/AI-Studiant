let role = "";
let tokens = 1;

function selectRole(r) {
  role = r;
  document.getElementById("choicePage").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
}

function login() {
  let user = username.value;
  let pass = password.value;

  if (role === "admin" && user === "ADMIN" && pass === "Andy2030@@") {
    startApp(true);
  } else if (role === "user" && user === "USER" && pass === "123456") {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("userSetup").classList.remove("hidden");
  } else {
    alert("Erreur login");
  }
}

function saveUser() {
  localStorage.setItem("user", name.value);
  document.getElementById("userSetup").classList.add("hidden");
  startApp(false);
}

function startApp(isAdmin) {
  document.getElementById("mainApp").classList.remove("hidden");
  if (!isAdmin) {
    document.getElementById("adminTabBtn").style.display = "none";
  }
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
    <input type="file" onchange="uploadFile(event,this)">
    <div class="progress"></div>
  `;

  subjects.appendChild(div);
}

function uploadFile(e, el) {
  let file = e.target.files[0];
  if (file.size > 500 * 1024 * 1024) {
    alert("Max 500Mo");
    return;
  }

  let progress = el.nextElementSibling;
  let percent = 0;

  let interval = setInterval(() => {
    percent += 10;
    progress.innerText = percent + "%";

    if (percent === 100) {
      clearInterval(interval);
      el.insertAdjacentHTML("afterend",
        `<button class="analyseBtn" onclick="analyse(this)">Analyse</button>`
      );
    }
  }, 200);
}

function analyse(btn) {
  if (tokens <= 0) {
    alert("Acheter token !");
    return;
  }

  let percent = 0;
  let div = document.createElement("div");
  btn.after(div);

  let interval = setInterval(() => {
    percent += 20;
    div.innerText = percent + "%";

    if (percent === 100) {
      clearInterval(interval);
      tokens--;

      btn.insertAdjacentHTML("afterend",
        `<button class="resultBtn" onclick="showResult()">Résumé - Quiz</button>`
      );
    }
  }, 300);
}

function showResult() {
  alert("Résumé long + Quiz généré !");
}

function buyToken() {
  document.getElementById("paymentBox").classList.remove("hidden");
}

function confirmPayment() {
  let ref = document.getElementById("refTrans").value;
  if (!ref) return alert("Entrer Ref");

  tokens += 5;

  let logs = JSON.parse(localStorage.getItem("logs") || "[]");
  logs.push(ref);
  localStorage.setItem("logs", JSON.stringify(logs));

  alert("Token ajouté !");
}
