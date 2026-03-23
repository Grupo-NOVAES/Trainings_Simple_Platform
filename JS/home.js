import links from "./links.js";

function saveTime(){
    let date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    let time = `${hours}:${minutes}:${seconds}`;

    sessionStorage.setItem('initTime', JSON.stringify(time));
    console.log(sessionStorage)
}

const btn_goToLogin = document.getElementById('btn_entrar')

function goToLogin(){
    saveTime();
    window.location.href= "https://grupo-novaes.github.io/Trainings_Simple_Platform/HTML/login.html";
}

btn_goToLogin.addEventListener('click',goToLogin)