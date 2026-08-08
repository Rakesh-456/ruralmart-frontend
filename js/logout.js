const logoutButton = document.getElementById("logoutBtn");

if(logoutButton){

    logoutButton.addEventListener("click",logout);

}

function logout(){

    localStorage.removeItem("token");

    window.location.href="login.html";

}