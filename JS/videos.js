const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
let currentQuestion = 1;
const totalQuestions = document.querySelectorAll(".question-card").length;
let intervalId = null;
import links from "./links.js";

// Função para exibir a pergunta atual
export function showQuestion(questionNumber) {
    const questions = document.querySelectorAll(".question-card");
    questions.forEach((question) => {
        question.classList.remove("active");
    });
    document.querySelector(`#question${questionNumber}`).classList.add("active");

    // Iniciar o contador do vídeo atual
    startTimer(questionNumber);
}

// Função para iniciar o contador
function startTimer(questionNumber) {
    const timerElement = document.querySelector(`#timer${questionNumber}`);
    const videoElement = document.querySelector(`#video${questionNumber}`);

    if (!timerElement || !videoElement) return;

    // Extrair minutos e segundos do texto do contador
    const [minutes, seconds] = timerElement.textContent.split(":").map(Number);
    let totalTime = minutes * 60 + seconds;

    // Limpar o intervalo anterior, se existir
    if (intervalId) clearInterval(intervalId);

    // Atualizar o contador a cada segundo
    intervalId = setInterval(() => {
        if (totalTime <= 0) {
            clearInterval(intervalId);
            nextBtn.disabled = false; // Habilitar o botão "Próximo"
            return;
        }

        totalTime--;
        const minutesLeft = Math.floor(totalTime / 60);
        const secondsLeft = totalTime % 60;
        console.log(minutesLeft+":"+secondsLeft);
        timerElement.textContent = `${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
    }, 1000);

    // Sincronizar o contador com o vídeo
    videoElement.addEventListener("play", () => {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
            if (totalTime <= 0) {
                clearInterval(intervalId);
                nextBtn.disabled = false; // Habilitar o botão "Próximo"
                return;
            }

            totalTime--;
            const minutesLeft = Math.floor(totalTime / 60);
            const secondsLeft = totalTime % 60;
            timerElement.textContent = `${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
        }, 1000);
    });

    videoElement.addEventListener("pause", () => {
        if (intervalId) clearInterval(intervalId);
    });

    videoElement.addEventListener("ended", () => {
        clearInterval(intervalId);
        nextBtn.disabled = false; // Habilitar o botão "Próximo"
    });
}

// Função para avançar para a próxima pergunta
export async function nextQuestion() {

    if (currentQuestion < totalQuestions + 1) {
        currentQuestion++;
        console.log(currentQuestion)
        nextBtn.disabled = true; // Desabilitar o botão "Próximo" ao mudar de vídeo
        if (currentQuestion === 4) {
          goToFinal();
          currentQuestion = currentQuestion-1;
        } else {
          showQuestion(currentQuestion);
        }
        
    
      }
    
}

// Função para voltar para a pergunta anterior
export function prevQuestion() {
    if (currentQuestion > 1) {
        currentQuestion--;
        showQuestion(currentQuestion);
        nextBtn.disabled = true; // Desabilitar o botão "Próximo" ao mudar de vídeo
    }
    
}

export function goToFinal() {
  
    Swal.fire({
      title: "Iniciar questionário?",
      text: "Você terá 15 minutos para realizar o questionário!",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, iniciar",
      cancelButtonText: "Não"
    }).then((result) => {
      if(result.isConfirmed){
        window.location.href="https://grupo-novaes.github.io/Trainings_Simple_Platform/HTML/indexForms.html"
        //window.location.href='../HTML/indexForms.html'
      }else if(result.isDenied){
        console.log("RECUSADO!")
      }
    });
    
  }

// Inicializar a primeira pergunta
showQuestion(currentQuestion);

// Adicionar listeners aos botões
prevBtn.addEventListener("click", prevQuestion);
nextBtn.addEventListener("click", nextQuestion);