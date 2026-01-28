import { user } from "./form.js";
import { db } from "./firebase-config.js"; 
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import links from "./links.js";

const status = document.getElementById('status-bar');

export async function sendAllEmails() {
    // 1. Coleta e formata os dados do usuário e respostas
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    
    // Tratamento das respostas para formato legível
    const responses = JSON.stringify(user.answers);
    const responsesArray = responses.split(',');
    const formattedResponses = responsesArray.join('\n').replace(/["[\]]/g, '');

    // Cálculo do tempo
    const date = new Date();
    const finalTime = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    // Limpeza extra para evitar caracteres de escape no JSON antigo
    const initTimeRaw = sessionStorage.getItem('initTime');
    const initTime = initTimeRaw ? JSON.stringify(initTimeRaw).replace(/\\"/g, '').replace(/"/g, '') : "N/A";
    const time = `${initTime} -- ${finalTime}`;

    // 2. Busca emails no Firebase (Configuração)
    let emailsDestino = ["inovacaonovaes@gmail.com"]; // Fallback de segurança
    let emailPrincipal = "inovacaonovaes@gmail.com";
    let emailsCopia = "";

    try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.notificationEmails && data.notificationEmails.length > 0) {
                emailsDestino = data.notificationEmails;
                emailPrincipal = emailsDestino[0];
                emailsCopia = emailsDestino.slice(1).join(',');
            }
        }

        console.log("emailPrincipal: "+emailPrincipal)
        console.log("emailsDestino: "+emailsDestino)
        console.log("emailsCopia: "+emailsCopia)
    } catch (error) {
        console.error("Erro ao buscar emails no banco (usando padrão):", error);
    }

    // 3. Prepara os dados para o FormSubmit
    const nomeCompleto = `${userData.name} ${userData.lastname}`;
    
    const formData = {
        _subject: `Treinamento Concluído: ${nomeCompleto}`,
        _template: "table", // Cria uma tabela formatada automaticamente
        _captcha: "false",  // Desativa captcha para envio via JS
        
        // Campos que aparecerão no email:
        "Nome do Colaborador": nomeCompleto,
        "Tempo de Prova": time,
        "Respostas": formattedResponses
    };

    // Adiciona cópia (CC) apenas se houver mais de um email configurado
    if (emailsCopia) {
        formData["_cc"] = emailsCopia;
    }

    console.log(`Enviando para: ${emailPrincipal} (CC: ${emailsCopia})`);

    // Feedback visual de "Enviando..."
    Swal.fire({
        title: 'Enviando resultados...',
        text: 'Por favor, aguarde.',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    await sendEmailFormSubmit(emailPrincipal, formData);
}

async function sendEmailFormSubmit(targetEmail, data) {
    try {
        const response = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
            method: "POST",
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log("Sucesso FormSubmit:", result);
        
        if(result.success === "false") {
            throw new Error("FormSubmit retornou erro no envio.");
        }

        // --- SUCESSO ---
        Swal.fire({
            title: "Sucesso!",
            text: "Seu treinamento foi enviado e registrado com sucesso.",
            icon: "success",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "Fechar"
        }).then(() => {
            // Opcional: Redirecionar para o início ou limpar a sessão
            sessionStorage.clear();
            window.location.href = links.thankYouPage;
        });

    } catch (err) {
        console.error("Erro no envio:", err);
        
        // --- ERRO ---
        Swal.fire({
            title: "Atenção",
            text: "Houve um erro ao enviar seus resultados. Por favor, tire um print desta tela e avise o instrutor.",
            icon: "error"
        });
    }
}