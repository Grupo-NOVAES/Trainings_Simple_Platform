import { user } from "./index.js";
import links from "./links.js";
import { db, auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { 
    doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, 
    collection, addDoc, deleteDoc, query, orderBy, getDocs 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// Elementos da UI
const loginScreen = document.getElementById('login-screen');
const dashboardContainer = document.getElementById('dashboard-container');
const btnStartTraining = document.getElementById("btn_iniciar_treinamento");
const btnAdminLogin = document.getElementById("btn_entrar_admin");
const btnLogout = document.getElementById('btnLogout');

// ============================================================
// 1. LÓGICA DO ALUNO (COLABORADOR)
// ============================================================

async function handleStudentLogin() {
  let getName = document.getElementById("input_name").value;
  let getLastname = document.getElementById("input_lastname").value;
  let getEmail = document.getElementById("input_email_aluno").value;

  user.name = getName;
  user.lastname = getLastname;
  user.email = getEmail;

  if (user.name === "" || user.lastname === "") {
    Swal.fire({
      title: "Campos obrigatórios!",
      text: "Por favor, preencha seu Nome e Sobrenome.",
      icon: "warning",
    });
    return;
  }

  sessionStorage.setItem("userData", JSON.stringify(user));
  window.location.href = links.VideoPage; 
}

btnStartTraining.addEventListener("click", handleStudentLogin);

// ============================================================
// 2. LÓGICA DO ADMINISTRADOR (FIREBASE)
// ============================================================

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginScreen.style.display = 'none'; 
        dashboardContainer.style.display = 'block'; 
        
        carregarConfiguracoes(); 
        carregarVideos(); 
    } else {
        loginScreen.style.display = 'block';
        dashboardContainer.style.display = 'none';
    }
});

btnAdminLogin.addEventListener('click', async () => {
    const email = document.getElementById('adminEmail').value;
    const pass = document.getElementById('adminPass').value;
    
    if(!email || !pass) {
        Swal.fire("Erro", "Preencha email e senha", "error");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        console.error(error);
        Swal.fire({
            title: "Acesso Negado",
            text: "Credenciais inválidas. Verifique email e senha.",
            icon: "error"
        });
    }
});

btnLogout.addEventListener('click', () => {
    signOut(auth);
    window.location.reload();
});


// ============================================================
// 3. FUNÇÕES DO PAINEL (Gerenciamento)
// ============================================================

const configRef = doc(db, "settings", "general");

// Variáveis globais para armazenar estado atual
let currentMainMail = "";

// --- CONFIGURAÇÕES E EMAILS ---
async function carregarConfiguracoes() {
    try {
        const docSnap = await getDoc(configRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('checkObrigatorio').checked = data.videosMandatory;
            
            // Passamos os dois campos separadamente
            currentMainMail = data.main_mail || "";
            renderEmails(currentMainMail, data.notificationEmails || []);
        } else {
            await setDoc(configRef, { videosMandatory: true, notificationEmails: [], main_mail: "" });
        }
    } catch (e) { console.error("Erro config:", e); }
}

document.getElementById('btnSalvarConfig').addEventListener('click', async () => {
    const isMandatory = document.getElementById('checkObrigatorio').checked;
    await updateDoc(configRef, { videosMandatory: isMandatory });
    Swal.fire("Salvo", "Configurações atualizadas!", "success");
});

// --- GERENCIAMENTO DE EMAILS ---
const containerPrincipal = document.getElementById('containerEmailPrincipal');
const listaEmails = document.getElementById('listaEmails');

function renderEmails(mainMail, secondaryEmails) {
    // 1. Renderiza Email Principal
    containerPrincipal.innerHTML = '';
    
    if (mainMail) {
        containerPrincipal.innerHTML = `
            <div class="d-flex justify-content-between align-items-center w-100">
                <span class="fw-bold text-dark">${mainMail}</span>
                <button class="btn btn-sm btn-outline-danger" id="btnRemovePrincipal">
                    Remover
                </button>
            </div>
        `;
        
        document.getElementById('btnRemovePrincipal').addEventListener('click', async () => {
            Swal.fire({
                title: "Remover Principal?",
                text: "O sistema ficará sem remetente principal até você adicionar outro.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                confirmButtonText: "Sim, remover"
            }).then(async (result) => {
                if (result.isConfirmed) {
                    // Define como vazio no banco
                    await updateDoc(configRef, { main_mail: "" });
                    carregarConfiguracoes();
                }
            });
        });
    } else {
        containerPrincipal.innerHTML = '<span class="text-muted fst-italic">Nenhum email principal definido. O próximo email adicionado assumirá esta posição.</span>';
    }

    // 2. Renderiza Lista de Cópias
    listaEmails.innerHTML = '';
    secondaryEmails.forEach(email => {
        const li = document.createElement('li');
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.textContent = email;
        
        const btn = document.createElement('button');
        btn.className = "btn btn-sm btn-danger";
        btn.textContent = "Remover";
        btn.onclick = async () => {
            if(confirm(`Remover cópia para ${email}?`)) {
                await updateDoc(configRef, { notificationEmails: arrayRemove(email) });
                carregarConfiguracoes();
            }
        };
        li.appendChild(btn);
        listaEmails.appendChild(li);
    });
}

document.getElementById('btnAddEmail').addEventListener('click', async () => {
    const email = document.getElementById('novoEmail').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if(!email || !emailRegex.test(email)) {
        Swal.fire("Inválido", "Insira um email válido.", "error");
        return;
    }

    try {
        // LÓGICA INTELIGENTE:
        // Se não tem principal, vira principal. Se tem, vira cópia.
        if (!currentMainMail) {
            await updateDoc(configRef, { main_mail: email });
            Swal.fire("Principal Definido", "Não esqueça de ativar no FormSubmit!", "success");
        } else {
            // Verifica se não está duplicando o principal na lista de cópia
            if (email === currentMainMail) {
                Swal.fire("Erro", "Este email já é o principal.", "warning");
                return;
            }
            await updateDoc(configRef, { notificationEmails: arrayUnion(email) });
            Swal.fire("Cópia Adicionada", "Email adicionado à lista de notificação.", "success");
        }

        document.getElementById('novoEmail').value = "";
        carregarConfiguracoes();
    } catch (error) {
        console.error(error);
        Swal.fire("Erro", "Falha ao salvar no banco.", "error");
    }
});

// --- GERENCIAMENTO DE VÍDEOS ---
const listaVideos = document.getElementById('listaVideos');
const videosRef = collection(db, "videos");

async function carregarVideos() {
    listaVideos.innerHTML = '<p class="text-center">Carregando...</p>';
    try {
        const q = query(videosRef, orderBy("ordem"));
        const querySnapshot = await getDocs(q);
        listaVideos.innerHTML = ''; 

        querySnapshot.forEach((doc) => {
            const video = doc.data();
            const li = document.createElement('li');
            li.className = "list-group-item d-flex justify-content-between align-items-center mb-2 border";
            li.innerHTML = `
                <div>
                    <strong>${video.ordem} - ${video.titulo}</strong><br>
                    <small class="text-muted text-truncate" style="max-width: 300px; display:block;">${video.url}</small>
                </div>
                <button class="btn btn-sm btn-danger btn-remover-video">Excluir</button>
            `;
            
            li.querySelector('.btn-remover-video').addEventListener('click', async () => {
                if(confirm("Excluir este vídeo?")) {
                    await deleteDoc(doc.ref); 
                    carregarVideos();
                }
            });
            listaVideos.appendChild(li);
        });
    } catch (error) {
        console.error(error);
        listaVideos.innerHTML = '<p class="text-danger">Erro ao carregar lista.</p>';
    }
}

document.getElementById('btnAddVideo').addEventListener('click', async () => {
    const titulo = document.getElementById('tituloVideo').value;
    const url = document.getElementById('urlVideo').value;

    if (!titulo || !url) {
        Swal.fire("Erro", "Preencha título e URL", "error");
        return;
    }

    try {
        const snapshot = await getDocs(videosRef);
        await addDoc(videosRef, {
            titulo: titulo,
            url: url,
            ordem: snapshot.size + 1
        });
        document.getElementById('tituloVideo').value = "";
        document.getElementById('urlVideo').value = "";
        carregarVideos();
        Swal.fire("Sucesso", "Vídeo adicionado!", "success");
    } catch (error) {
        Swal.fire("Erro", error.message, "error");
    }
});