import { user } from "./index.js";
import links from "./links.js";
import { db, auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { 
    doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, 
    collection, addDoc, deleteDoc, query, orderBy, getDocs 
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// ============================================================
// 0. ELEMENTOS DA UI (Definidos no topo para evitar erros)
// ============================================================
const loginScreen = document.getElementById('login-screen');
const dashboardContainer = document.getElementById('dashboard-container');

// Botões de Login/Logout
const btnStartTraining = document.getElementById("btn_iniciar_treinamento");
const btnAdminLogin = document.getElementById("btn_entrar_admin");
const btnLogout = document.getElementById('btnLogout');

// Elementos de Email (Verificação de segurança adicionada)
const viewMainEmail = document.getElementById('viewMainEmail');
const formMainEmail = document.getElementById('formMainEmail');
const txtMainEmail = document.getElementById('txtMainEmail');
const listaEmailsCopia = document.getElementById('listaEmailsCopia');

// Elementos de Vídeo
const listaVideos = document.getElementById('listaVideos');

// Referências do Banco
const configRef = doc(db, "settings", "general");
const videosRef = collection(db, "videos");

// Variáveis de Estado
let currentMainMail = "";

// ============================================================
// 1. LÓGICA DO ALUNO (COLABORADOR)
// ============================================================

async function handleStudentLogin() {
  const inputName = document.getElementById("input_name");
  const inputLastname = document.getElementById("input_lastname");
  const inputEmail = document.getElementById("input_email_aluno");

  user.name = inputName ? inputName.value : "";
  user.lastname = inputLastname ? inputLastname.value : "";
  user.email = inputEmail ? inputEmail.value : "";

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

if(btnStartTraining) btnStartTraining.addEventListener("click", handleStudentLogin);

// ============================================================
// 2. LÓGICA DO ADMINISTRADOR (FIREBASE)
// ============================================================

onAuthStateChanged(auth, (user) => {
    if (user) {
        if(loginScreen) loginScreen.style.display = 'none'; 
        if(dashboardContainer) dashboardContainer.style.display = 'block'; 
        
        carregarConfiguracoes(); 
        carregarVideos(); 
    } else {
        if(loginScreen) loginScreen.style.display = 'block';
        if(dashboardContainer) dashboardContainer.style.display = 'none';
    }
});

if(btnAdminLogin) {
    btnAdminLogin.addEventListener('click', async () => {
        const emailEl = document.getElementById('adminEmail');
        const passEl = document.getElementById('adminPass');
        const email = emailEl ? emailEl.value : "";
        const pass = passEl ? passEl.value : "";
        
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
}

if(btnLogout) {
    btnLogout.addEventListener('click', () => {
        signOut(auth);
        window.location.reload();
    });
}

// ============================================================
// 3. FUNÇÕES DO PAINEL (Gerenciamento)
// ============================================================

// --- CONFIGURAÇÕES E EMAILS ---
async function carregarConfiguracoes() {
    try {
        const docSnap = await getDoc(configRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const checkEl = document.getElementById('checkObrigatorio');
            if(checkEl) checkEl.checked = data.videosMandatory;
            
            currentMainMail = data.main_mail || "";
            renderEmails(currentMainMail, data.notificationEmails || []);
        } else {
            await setDoc(configRef, { videosMandatory: true, notificationEmails: [], main_mail: "" });
        }
    } catch (e) { console.error("Erro config:", e); }
}

const btnSalvarConfig = document.getElementById('btnSalvarConfig');
if(btnSalvarConfig) {
    btnSalvarConfig.addEventListener('click', async () => {
        const checkEl = document.getElementById('checkObrigatorio');
        const isMandatory = checkEl ? checkEl.checked : true;
        await updateDoc(configRef, { videosMandatory: isMandatory });
        Swal.fire("Salvo", "Configurações atualizadas!", "success");
    });
}

// --- RENDERIZAÇÃO DE EMAILS ---
function renderEmails(mainMail, secondaryEmails) {
    // Se os elementos não existirem no HTML, para a execução para não dar erro
    if (!viewMainEmail || !formMainEmail || !txtMainEmail || !listaEmailsCopia) {
        console.warn("Elementos de email não encontrados no HTML. Verifique o arquivo login.html");
        return;
    }

    // 1. Renderiza Email Principal
    if (mainMail) {
        viewMainEmail.classList.remove('d-none');
        viewMainEmail.classList.add('d-flex');
        formMainEmail.classList.add('d-none');
        txtMainEmail.textContent = mainMail;
    } else {
        viewMainEmail.classList.remove('d-flex');
        viewMainEmail.classList.add('d-none');
        formMainEmail.classList.remove('d-none');
    }

    // 2. Renderiza Lista de Cópias
    listaEmailsCopia.innerHTML = '';
    
    if(secondaryEmails.length === 0) {
        listaEmailsCopia.innerHTML = '<li class="list-group-item text-muted small text-center">Nenhuma cópia configurada</li>';
    }

    secondaryEmails.forEach(email => {
        const li = document.createElement('li');
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.textContent = email;
        
        const btn = document.createElement('button');
        btn.className = "btn btn-sm btn-outline-danger";
        btn.textContent = "Remover";
        btn.onclick = async () => {
            if(confirm(`Remover cópia para ${email}?`)) {
                await updateDoc(configRef, { notificationEmails: arrayRemove(email) });
                carregarConfiguracoes();
            }
        };
        li.appendChild(btn);
        listaEmailsCopia.appendChild(li);
    });
}

// === LISTENERS DE BOTÕES DE EMAIL ===

const btnAddMainEmail = document.getElementById('btnAddMainEmail');
if(btnAddMainEmail) {
    btnAddMainEmail.addEventListener('click', async () => {
        const inputMain = document.getElementById('inputMainEmail');
        const email = inputMain ? inputMain.value : "";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if(!email || !emailRegex.test(email)) {
            Swal.fire("Inválido", "Insira um email válido.", "error");
            return;
        }

        try {
            await updateDoc(configRef, { main_mail: email });
            if(inputMain) inputMain.value = "";
            Swal.fire("Definido", "Novo email principal salvo.", "success");
            carregarConfiguracoes();
        } catch (error) {
            Swal.fire("Erro", error.message, "error");
        }
    });
}

const btnRemoveMain = document.getElementById('btnRemoveMain');
if(btnRemoveMain) {
    btnRemoveMain.addEventListener('click', async () => {
        Swal.fire({
            title: "Remover Principal?",
            text: "O sistema ficará sem remetente principal.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            confirmButtonText: "Sim, remover"
        }).then(async (result) => {
            if (result.isConfirmed) {
                await updateDoc(configRef, { main_mail: "" });
                carregarConfiguracoes();
            }
        });
    });
}

const btnAddCopyEmail = document.getElementById('btnAddCopyEmail');
if(btnAddCopyEmail) {
    btnAddCopyEmail.addEventListener('click', async () => {
        const inputCopy = document.getElementById('inputCopyEmail');
        const email = inputCopy ? inputCopy.value : "";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if(!email || !emailRegex.test(email)) {
            Swal.fire("Inválido", "Insira um email válido.", "error");
            return;
        }

        if(email === currentMainMail) {
            Swal.fire("Erro", "Este email já é o principal.", "warning");
            return;
        }

        try {
            await updateDoc(configRef, { notificationEmails: arrayUnion(email) });
            if(inputCopy) inputCopy.value = "";
            carregarConfiguracoes();
        } catch (error) {
            Swal.fire("Erro", error.message, "error");
        }
    });
}

// --- GERENCIAMENTO DE VÍDEOS ---

async function carregarVideos() {
    if(!listaVideos) return;
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

const btnAddVideo = document.getElementById('btnAddVideo');
if(btnAddVideo) {
    btnAddVideo.addEventListener('click', async () => {
        const tituloEl = document.getElementById('tituloVideo');
        const urlEl = document.getElementById('urlVideo');
        const titulo = tituloEl ? tituloEl.value : "";
        const url = urlEl ? urlEl.value : "";

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
            if(tituloEl) tituloEl.value = "";
            if(urlEl) urlEl.value = "";
            carregarVideos();
            Swal.fire("Sucesso", "Vídeo adicionado!", "success");
        } catch (error) {
            Swal.fire("Erro", error.message, "error");
        }
    });
}