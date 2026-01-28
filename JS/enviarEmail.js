import { user } from "./form.js";

export async function sendAllEmails() {
    // 1. Recupera os dados do SessionStorage e do Objeto User
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    
    // Tratamento das respostas (Mantendo sua lógica original de formatação)
    const responses = JSON.stringify(user.answers);
    const responsesArray = responses.split(',');
    const formattedResponses = responsesArray.join('\n');
    const cleanedFormattedResponses = formattedResponses.replace(/["[\]]/g, '').replace(/,/g, '\n');

    // 2. Cálculo do Tempo (Mantendo sua lógica original)
    const date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    // Pequena correção: .length funciona em strings, números não têm .length direto
    const strMinutes = minutes < 10 ? "0" + minutes : minutes;
    const strSeconds = seconds < 10 ? "0" + seconds : seconds;

    const finalTime = `${hours}:${strMinutes}:${strSeconds}`;
    
    // Recupera o tempo inicial e limpa as aspas extras
    let initTime = sessionStorage.getItem('initTime');
    if (initTime) {
        initTime = initTime.replace(/['"]+/g, '');
    } else {
        initTime = "--:--:--";
    }

    const timeString = `${initTime} às ${finalTime}`;

    // 3. Configuração do Envio para o FormSubmit
    // DEFINA AQUI QUEM SERÁ O PRINCIPAL (Que recebe o link de ativação)
    const emailPrincipal = "brunosantiago7002@gmail.com"; 
    
    // DEFINA AQUI AS CÓPIAS (Separadas por vírgula)
    const emailsCopias = "brunosantiago2007@gmail.com,rh@novaes.eng.br";

    // Criação do formulário virtual para envio
    const formData = new FormData();
    
    // Campos Especiais do FormSubmit
    formData.append("_cc", emailsCopias); // Envia para os outros emails
    formData.append("_subject", `Novo Treinamento: ${userData.name} ${userData.lastname}`); // Assunto do email
    formData.append("_template", "table"); // Formata o email como uma tabela bonita
    formData.append("_captcha", "false"); // Desativa o captcha (opcional)
    
    // Se o usuário não preencheu email, usamos um genérico para não dar erro
    formData.append("email", userData.email || "sem_email@novaes.eng.br"); 

    // Dados do Formulário
    formData.append("Nome do Colaborador", `${userData.name} ${userData.lastname}`);
    formData.append("Horário de Realização", timeString);
    formData.append("Respostas do Questionário", cleanedFormattedResponses);

    try {
        // Envio via AJAX para não sair da página
        const response = await fetch(`https://formsubmit.co/ajax/${emailPrincipal}`, {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        console.log("Sucesso ao enviar:", result);
        
    } catch (error) {
        console.error("Erro ao enviar email:", error);
        // Mesmo com erro no envio, o código segue para redirecionar o usuário na outra função
    }
}