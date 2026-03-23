import { user } from "./index.js";
import links from "./links.js";

const btnGetLogin = document.getElementById("btn_login");

async function getUsernameAndLastname() {
  let getName = document.getElementById("input_name").value;
  let getLastname = document.getElementById("input_lastname").value;
  let getEmail = document.getElementById("input_email").value;

  user.name = getName;
  user.lastname = getLastname;
  user.email = getEmail;

  if (user.name === "" || user.lastname === "") {
    return false;
  }

  console.log(user);
  return true;
}

async function goToForms() {
  let response = await getUsernameAndLastname();
  if (response) {
    sessionStorage.setItem("userData", JSON.stringify(user));
    console.log(sessionStorage);
    window.location.href=links.FormsPage;
  } else {
    Swal.fire({
      title: "Nome ou sobrenome vazios!",
      text: "Verifique os campos corretamente",
      icon: "warning",
    });
  }
}

btnGetLogin.addEventListener("click", goToForms);
