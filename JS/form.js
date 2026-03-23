import { sendAllEmails } from './enviarEmail.js';
import links from './links.js';

const numerosSorteados = [];
let numeroQuestao = 0;
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
let currentQuestion = 1;

function sorteioOrdem() {
  while (numerosSorteados.length < 10) {
    const numero = Math.floor(Math.random() * 19) + 1;
    if (!numerosSorteados.includes(numero)) {
      numerosSorteados.push(numero);
    }
  }
  console.log(JSON.stringify(numerosSorteados))
  return numerosSorteados;
}

export const user = {
  name: "",
  lastname: "",
  email: "",
  answers: Array(10).fill(""),
  initHour: "",
  finalHour: "",
};



function showQuestion() {
  const questionNumber = numerosSorteados[numeroQuestao];
  currentQuestion = questionNumber;
  document.querySelectorAll(".question-card").forEach(question => {
    question.classList.remove("active");
  });
  document.querySelector(`#question${questionNumber}`).classList.add("active");
}

function validateCurrentQuestion() {
  const currentQuestionCard = document.querySelector(`#question${currentQuestion}`);
  const radioInputs = currentQuestionCard.querySelectorAll('input[type="radio"]');
  const checkboxInputs = currentQuestionCard.querySelectorAll('input[type="checkbox"]');
  const textareaInput = currentQuestionCard.querySelector("textarea");

  console.log("RESPOSTAS _____________")
  console.log("card: "+JSON.stringify(currentQuestionCard));
  console.log("radio: "+JSON.stringify(radioInputs));
  console.log("checkbox: "+JSON.stringify(checkboxInputs));
  console.log("text: "+JSON.stringify(textareaInput));

  const isRadioChecked = Array.from(radioInputs).some(input => input.checked);
  const isCheckboxChecked = Array.from(checkboxInputs).some(input => input.checked);
  const isTextareaFilled = textareaInput ? textareaInput.value.trim() !== '' : false;


  console.log(isRadioChecked)
  console.log(isCheckboxChecked)
  console.log(isTextareaFilled)

  return isRadioChecked || isCheckboxChecked || isTextareaFilled;
}

function guardarResposta() {
  const respostaSelecionada = document.querySelector(`input[name="${currentQuestion}"]:checked`);
  if (respostaSelecionada) {
    user.answers[numeroQuestao] = `Pergunta ${currentQuestion} - Resposta: ${respostaSelecionada.value}`;
  }
  console.log(JSON.stringify(user.answers))
}

function guardarRespostaTexto() {
  const respostaTexto = document.querySelector(`textarea[name="${currentQuestion}"]`);
  if (respostaTexto) {
    user.answers[numeroQuestao] = `Pergunta ${currentQuestion} - Resposta: ${respostaTexto.value}`;
  }
  console.log(JSON.stringify(user.answers))
}


function nextQuestion() {
  console.log(currentQuestion)
  if (!validateCurrentQuestion()) {
    Swal.fire({
      title: "Responda a pergunta antes de avançar!",
      text: "Verifique sua resposta",
      icon: "warning",
    });
    return;
  }

  
  if (numeroQuestao <= 9) {
    guardarResposta();
    guardarRespostaTexto();
    console.log("numero da questao: " + numeroQuestao)
    numeroQuestao++;
    console.log("numero da questao depois: " + numeroQuestao)
  }
  if (numeroQuestao === 10) {
    goToFinal();
  } else {
    showQuestion();
  }
}


function prevQuestion() {
  if (currentQuestion > 1) {
    numeroQuestao--;
    currentQuestion--;
    showQuestion();
  } else {
    Swal.fire({
      title: "Anular questionário?",
      text: "Se você clicar em 'Sim, anular', o questionário será anulado!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, anular",
      cancelButtonText: "Não, continuar a responder",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = links.LoginPage
      }
    });
  }
}

function goToFinal() {
  guardarResposta();
  Swal.fire({
    title: "Deseja finalizar?",
    text: "Se você clicar em 'Sim, finalizar', o questionário será finalizado.",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sim, finalizar",
    cancelButtonText: "Não",
  }).then(async (result) => {
    if (result.isConfirmed) {
      document.getElementById("nextBtn").disabled = true;
      document.getElementById("prevBtn").disabled = true;
      await sendAllEmails();
      window.location.href = links.thankYouPage
    }
  });
}

function startTimer() {
  let timeLeft = 900;
  const timerDisplay = document.getElementById("timer");

  const countdown = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `Tempo restante: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    if (timeLeft <= 0) {
      clearInterval(countdown);
      Swal.fire({
        title: "O tempo acabou!",
        text: "Você será redirecionado para o início.",
        icon: "error",
      });
      window.location.href = links.HomePage
    }

    timeLeft--;
  }, 1000);
}

window.addEventListener("DOMContentLoaded", () => {
  startTimer();
});

const sorteio = sorteioOrdem();
showQuestion();

prevBtn.addEventListener("click", prevQuestion);
nextBtn.addEventListener("click", nextQuestion);
