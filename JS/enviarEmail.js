import { user } from "./form.js";

const status = document.getElementById('status-bar');

export async function sendAllEmails(){
    const userData = JSON.parse(sessionStorage.getItem('userData'));

    const responses = JSON.stringify(user.answers);
    const responsesArray = responses.split(',');
    const formattedResponses = responsesArray.join('\n');
    const cleanedFormattedResponses = formattedResponses.replace(/["[\]]/g, '');


    const date = new Date();
    const hours = date.getHours();
    let minutes = date.getMinutes();
    if(minutes.lenght == 1){
        minutes = "0"+minutes
    }
    let seconds = date.getSeconds();
    if(seconds.lenght == 1){
        seconds = "0"+seconds
    }

    const finalTime = `${hours}:${minutes}:${seconds}`;
    const initTime = JSON.stringify(sessionStorage.getItem('initTime'));


    const time = `${initTime} -- ${finalTime}`;

    const formatedTime = time.replace(/\\"/g, '').replace(/"/g, '');
    console.log(formatedTime);

    console.log("nome: "+userData.name);
    console.log("responses: "+responses.toString())
    console.log(`Time: ${formatedTime}`);
    await sendEmailMicheli(cleanedFormattedResponses,formatedTime,userData);
}

async function sendEmailMicheli(cleanedFormattedResponses,formatedTime,userData) {
   
    const data = {
        service_id: 'service_5k99nne',
        template_id: 'template_6qvjzwi',
        user_id: 'LzfiSU8wYibsYiSsV',
        template_params: {
            'name': userData.name +" "+userData.lastname,
            'response': cleanedFormattedResponses,
            'time':formatedTime
        }
    };
    try {
         const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
             method: 'POST',
             body: JSON.stringify(data),
             headers: {
                 'Content-Type': 'application/json',
                 'Accept': 'application/json'
             }
         });
        console.log(JSON.stringify(data))
        console.log("certo: "+JSON.stringify(res));
    } catch (err) {
        console.log("erro:  "+err.stack);
    }
}