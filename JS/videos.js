import { db } from "./firebase-config.js";
import { doc, getDoc, collection, query, orderBy, getDocs } 
    from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import links from "./links.js";

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const cardsContainer = document.getElementById("cards-container");

// Variáveis de Estado
let currentQuestion = 1;
let totalQuestions = 0;
let isMandatory = true;
let players = {}; 
let timers = {};
// NOVA VARIÁVEL: Guarda o tempo máximo assistido de cada vídeo
let maxWatched = {}; 

// --- 1. Inicialização e API do YouTube ---

const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

window.onYouTubeIframeAPIReady = function() {
    console.log("YouTube API Pronta. Iniciando sistema...");
    init();
};

async function init() {
    await loadSettings(); 
    await renderVideos(); 
}

// --- 2. Lógica de Dados (Firebase) ---

async function loadSettings() {
    try {
        const docSnap = await getDoc(doc(db, "settings", "general"));
        if (docSnap.exists()) {
            isMandatory = docSnap.data().videosMandatory !== undefined ? docSnap.data().videosMandatory : true;
            console.log("Modo Obrigatório:", isMandatory);
        }
    } catch (error) {
        console.error("Erro config:", error);
    }
}

function extractVideoID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function renderVideos() {
    cardsContainer.innerHTML = '<p style="text-align: center;">Carregando vídeos...</p>';
    
    try {
        const q = query(collection(db, "videos"), orderBy("ordem"));
        const querySnapshot = await getDocs(q);
        
        cardsContainer.innerHTML = ""; 
        totalQuestions = querySnapshot.size;

        if (totalQuestions === 0) {
            cardsContainer.innerHTML = '<p>Nenhum vídeo encontrado. Cadastre no banco de dados.</p>';
            return;
        }

        let index = 1;
        let htmlAcumulado = ""; 
        let videosParaCarregar = []; 

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const videoID = extractVideoID(data.url);
            
            const cardHTML = `
                <div class="card question-card" id="question${index}">
                    <div class="card-body">
                        <p>${data.titulo}</p>
                        <div class="video-wrapper" style="margin: 0 auto; width: fit-content;">
                            <div id="player${index}"></div>
                        </div>
                        <div id="timer${index}" class="timer">Carregando tempo...</div>
                    </div>
                </div>
            `;
            htmlAcumulado += cardHTML;
            videosParaCarregar.push({ idx: index, vidId: videoID });
            
            // Inicializa o contador de progresso desse vídeo como 0
            maxWatched[index] = 0;
            
            index++;
        });

        cardsContainer.innerHTML = htmlAcumulado;

        videosParaCarregar.forEach(item => {
            createPlayer(item.idx, item.vidId);
        });

        showQuestion(1);

    } catch (error) {
        console.error("Erro ao carregar vídeos:", error);
        cardsContainer.innerHTML = '<p>Erro ao carregar vídeos do banco de dados.</p>';
    }
}

function createPlayer(index, videoId) {
    if (!videoId) return;

    const origin = window.location.origin;

    players[index] = new YT.Player(`player${index}`, {
        height: '270',
        width: '300',
        videoId: videoId,
        playerVars: { 
            'playsinline': 1, 
            'rel': 0,
            'origin': origin,
            // 'controls': 0 // Se quiser esconder totalmente a barra (mas perde o botão de velocidade)
        },
        events: {
            'onReady': (event) => onPlayerReady(event, index),
            'onStateChange': (event) => onPlayerStateChange(event, index)
        }
    });
}

// --- 3. Eventos do Player ---

function onPlayerReady(event, index) {
    const duration = event.target.getDuration();
    const timerElement = document.getElementById(`timer${index}`);
    
    if (timerElement) {
        timerElement.textContent = (duration > 0) ? formatTime(duration) : "00:00";
    }
}

function onPlayerStateChange(event, index) {
    if (event.data == YT.PlayerState.PLAYING) {
        startTimer(index);
    } else if (event.data == YT.PlayerState.PAUSED) {
        stopTimer(index);
    } else if (event.data == YT.PlayerState.ENDED) {
        stopTimer(index);
        document.getElementById(`timer${index}`).textContent = "00:00";
        // Garante que marcou como tudo assistido ao acabar
        const player = players[index];
        if(player) maxWatched[index] = player.getDuration();
        
        checkCompletion(); 
    }
}

// --- 4. Controle de Timer e Anti-Seek ---

function startTimer(index) {
    const timerElement = document.getElementById(`timer${index}`);
    const player = players[index];
    
    if (!player || typeof player.getCurrentTime !== 'function') return;

    if (isMandatory) nextBtn.disabled = true;

    if (timers[index]) clearInterval(timers[index]);

    console.log(`[Vídeo ${index}] Monitoramento iniciado.`);

    timers[index] = setInterval(() => {
        if (!player || typeof player.getCurrentTime !== 'function') return;

        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        const timeLeft = duration - currentTime;

        // --- LÓGICA ANTI-PULO (ANTI-SEEK) ---
        if (isMandatory) {
            // Tolerância de 2 segundos para delay de rede/processamento
            // Se o usuário tentar pular para um tempo maior que o máximo já visto + 2s:
            if (currentTime > maxWatched[index] + 2) {
                console.log(`[Bloqueio] Tentativa de pulo detectada. Voltando para ${maxWatched[index]}s`);
                player.seekTo(maxWatched[index], true); // Força voltar
            } else {
                // Se estiver assistindo normal (mesmo acelerado), atualiza o máximo
                if (currentTime > maxWatched[index]) {
                    maxWatched[index] = currentTime;
                }
            }
        }
        // ------------------------------------

        // Atualiza Timer Visual
        console.log(`[Vídeo ${index}] Restante: ${timeLeft.toFixed(1)}s`);

        if (timeLeft <= 0.5) {
            clearInterval(timers[index]);
            timerElement.textContent = "00:00";
        } else {
            timerElement.textContent = formatTime(timeLeft);
        }
    }, 1000);
}

function stopTimer(index) {
    if (timers[index]) {
        clearInterval(timers[index]);
    }
}

function checkCompletion() {
    if (!isMandatory) {
        nextBtn.disabled = false;
        return;
    }
    
    const player = players[currentQuestion];

    if (player && typeof player.getPlayerState === 'function') {
        if (player.getPlayerState() === YT.PlayerState.ENDED) {
            nextBtn.disabled = false;
        } else {
            nextBtn.disabled = true;
        }
    } else {
        nextBtn.disabled = true;
    }
}

export function showQuestion(questionNumber) {
    if (currentQuestion !== questionNumber && players[currentQuestion]) {
        try { 
            if(typeof players[currentQuestion].pauseVideo === 'function'){
                players[currentQuestion].pauseVideo(); 
            }
        } catch(e){}
    }

    const questions = document.querySelectorAll(".question-card");
    questions.forEach(q => q.classList.remove("active"));
    
    const currentCard = document.querySelector(`#question${questionNumber}`);
    if(currentCard) {
        currentCard.classList.add("active");
        currentQuestion = questionNumber;
        checkCompletion(); 
    } else {
        console.error(`Card #question${questionNumber} não encontrado!`);
    }
    
    prevBtn.style.display = (questionNumber > 1) ? "inline-block" : "none";
}

export async function nextQuestion() {
    if (currentQuestion < totalQuestions) {
        showQuestion(currentQuestion + 1);
    } else {
        goToFinal();
    }
}

export function prevQuestion() {
    if (currentQuestion > 1) {
        showQuestion(currentQuestion - 1);
    }
}

export function goToFinal() {
    Swal.fire({
      title: "Iniciar questionário?",
      text: "Você terá 15 minutos para realizar o questionário!",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sim, iniciar",
      cancelButtonText: "Não"
    }).then((result) => {
      if(result.isConfirmed){
        window.location.href=links.FormsPage
      }
    });
}

prevBtn.addEventListener("click", prevQuestion);
nextBtn.addEventListener("click", nextQuestion);