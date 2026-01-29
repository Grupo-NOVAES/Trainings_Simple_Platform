import { user } from "./form.js";
import { db } from "./firebase-config.js"; 
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import links from "./links.js";

export async function sendAllEmails() {
    // 1. Dados
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    
    // Tratamento de Respostas
    const responses = JSON.stringify(user.answers);
    const responsesArray = responses.split(',');
    const formattedResponses = responsesArray.join('\n').replace(/["[\]]/g, '');

    // Tratamento de Tempo
    const date = new Date();
    const finalTime = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    const initTimeRaw = sessionStorage.getItem('initTime');
    const initTime = initTimeRaw ? JSON.stringify(initTimeRaw).replace(/\\"/g, '').replace(/"/g, '') : "N/A";
    const time = `${initTime} -- ${finalTime}`;

    // 2. BUSCA INTELIGENTE DE EMAILS (Atualizado para main_mail)
    let emailPrincipal = "adm@novaes.eng.br"; // Fallback
    let emailsCopia = "";

    try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Prioridade: Campo main_mail
            if (data.main_mail) {
                emailPrincipal = data.main_mail;
            } else if (data.notificationEmails && data.notificationEmails.length > 0) {
                // Fallback antigo: Pega o primeiro da lista se não tiver main_mail
                emailPrincipal = data.notificationEmails[0];
            }

            // Monta lista de cópia (CC)
            if (data.notificationEmails && data.notificationEmails.length > 0) {
                // Remove o principal da lista de cópia para não enviar duplicado
                const listaFiltrada = data.notificationEmails.filter(e => e !== emailPrincipal);
                emailsCopia = listaFiltrada.join(',');
            }
        }
    } catch (error) {
        console.error("Erro ao buscar emails no banco (usando padrão):", error);
    }

    // 3. Envio
    const nomeCompleto = `${userData.name} ${userData.lastname}`;
    
    const formData = {
        _subject: `Treinamento Concluído: ${nomeCompleto}`,
        _template: "table",
        _captcha: "false",
        "Nome do Colaborador": nomeCompleto,
        "Tempo de Prova": time,
        "Respostas": formattedResponses
    };

    if (emailsCopia) {
        formData["_cc"] = emailsCopia;
    }

    console.log(`Enviando para Principal: ${emailPrincipal} | CC: ${emailsCopia}`);

    // Feedback Visual
    Swal.fire({
        title: 'Enviando resultados...',
        text: 'Por favor, aguarde um momento.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
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
        
        if(result.success === "false") {
            throw new Error("FormSubmit retornou erro.");
        }

        Swal.fire({
            title: "Sucesso!",
            text: "Treinamento finalizado e enviado com sucesso.",
            icon: "success",
            confirmButtonColor: "#3085d6",
            confirmButtonText: "Fechar"
        }).then(async (result) => {
            if(result.isConfirmed) {
                window.location.href = links.thankYouPage
            }
        });

    } catch (err) {
        console.error("Erro no envio:", err);
        Swal.fire({
            title: "Atenção",
            text: "Erro ao enviar resultados. Avise o instrutor.",
            icon: "error"
        });
    }
}