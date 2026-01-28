// JS/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

// Suas configurações reais
const firebaseConfig = {
    apiKey: "AIzaSyCvcZiJIvffYVRcFJtVuUh266X5w3i2YxY",
    authDomain: "treinamentos-novaes.firebaseapp.com",
    projectId: "treinamentos-novaes",
    storageBucket: "treinamentos-novaes.firebasestorage.app",
    messagingSenderId: "444711167089",
    appId: "1:444711167089:web:00b481681a09a9cbc027d0",
    measurementId: "G-V59J9ZQGW8"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Inicializa e exporta os serviços que o site usa
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, analytics };