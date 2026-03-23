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
    window.location.href= links.LoginPage;
}

btn_goToLogin.addEventListener('click',goToLogin)