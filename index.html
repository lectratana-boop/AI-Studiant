<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expert Analyse 🎓</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"></script>
    <style>
        :root {
            --primary: #6366f1;
            --bg: #0f172a;
            --card: #1e293b;
            --text: #f1f5f9;
        }
        body {
            font-family: 'Segoe UI', sans-serif;
            background-color: var(--bg);
            color: var(--text);
            display: flex;
            justify-content: center;
            padding: 20px;
            margin: 0;
        }
        .container {
            width: 100%;
            max-width: 500px;
            background: var(--card);
            padding: 25px;
            border-radius: 20px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .btn-key { background: none; border: none; cursor: pointer; font-size: 20px; }
        
        .upload-zone {
            border: 2px dashed #334155;
            padding: 30px;
            text-align: center;
            border-radius: 15px;
            margin-bottom: 20px;
            transition: 0.3s;
        }
        .btn-upload {
            background: var(--primary);
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            cursor: pointer;
            display: inline-block;
            font-weight: bold;
        }
        input[type="file"] { display: none; }

        /* Progress Bars */
        .progress-container { margin: 15px 0; }
        .progress-label { display: flex; justify-content: space-between; font-size: 0.85em; margin-bottom: 5px; color: #94a3b8; }
        .progress-bg { background: #334155; height: 8px; border-radius: 4px; overflow: hidden; }
        .progress-fill { background: var(--primary); width: 0%; height: 100%; transition: width 0.4s; }
        #ia-fill { background: #f59e0b; } /* Orange pour l'IA */

        .btn-main {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            color: white;
            cursor: pointer;
            transition: 0.3s;
        }
        .btn-analyze { background: #475569; opacity: 0.6; }
        .btn-success { background: #10b981; margin-top: 15px; }
        .hidden { display: none !important; }

        /* Animation Loading */
        .spinner {
            border: 4px solid rgba(255,255,255,0.1);
            border-top: 4px solid var(--primary);
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        #results-container { margin-top: 30px; border-top: 1px solid #334155; padding-top: 20px; }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h2>Expert Analyse 🎓</h2>
        <button class="btn-key" onclick="resetApiKey()">🔑</button>
    </div>

    <div class="upload-zone">
        <label for="fileInput" class="btn-upload">☁️ Charger PDF ou Word</label>
        <input type="file" id="fileInput" accept=".pdf,.docx">
        <p id="file-name-display" style="margin-top:10px; font-size:0.9em; color:#94a3b8;">En attente du fichier...</p>
    </div>

    <div id="upload-status-container" class="progress-container hidden">
        <div class="progress-label">
            <span>Traitement du document...</span>
            <span id="upload-perc">0%</span>
        </div>
        <div class="progress-bg">
            <div id="upload-fill" class="progress-fill"></div>
        </div>
    </div>

    <button id="btn-ai" class="btn-main btn-analyze" onclick="processCourse()" disabled>
        Analyse indisponible
    </button>

    <div id="ia-detail-container" class="progress-container hidden">
        <div class="progress-label">
            <span>Analyse Gemini 2.5 en cours...</span>
            <span id="ia-perc">0%</span>
        </div>
        <div class="progress-bg">
            <div id="ia-fill" class="progress-fill"></div>
        </div>
        
        <div id="ai-loading-fancy" class="hidden" style="text-align: center; margin-top: 15px;">
            <div class="spinner"></div>
            <p style="color: #94a3b8; font-size: 0.9em;">L'IA réfléchit et génère votre quiz... ⏳</p>
        </div>
    </div>

    <button id="btn-result" class="btn-main btn-success hidden" onclick="showResults()">
        ✅ Voir Résumé & Quiz
    </button>

    <div id="results-container" class="hidden">
        <div id="summary-result"></div>
        <div id="quiz-result"></div>
    </div>
</div>

<script src="script.js"></script>
</body>
</html>
