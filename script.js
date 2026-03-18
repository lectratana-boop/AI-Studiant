// ✅ TEST AVEC LE MODÈLE PRO (PLUS COMPATIBLE QUE FLASH DANS CERTAINES RÉGIONS)
const PROXY_URL = "https://cors-anywhere.herokuapp.com/"; 
const TARGET_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
const FINAL_URL = PROXY_URL + TARGET_URL;
