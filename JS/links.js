const isGitHubPages = window.location.hostname.includes("github.io");

const REPO_NAME = "/Trainings_Simple_Platform";
const BASE_PATH = isGitHubPages ? REPO_NAME : "";

const LoginPage = `${BASE_PATH}/HTML/login.html`;
const VideoPage = `${BASE_PATH}/HTML/videos.html`;
const FormsPage = `${BASE_PATH}/HTML/indexForms.html`;
const thankYouPage = `${BASE_PATH}/HTML/thanks.html`;
const HomePage = `${BASE_PATH}/index.html`;

export default { 
    VideoPage, 
    HomePage, 
    FormsPage, 
    LoginPage, 
    thankYouPage 
};